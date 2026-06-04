/**
 * loyalty.admin.ts — Server-side loyalty operations using Firebase Admin SDK.
 *
 * Used ONLY inside Next.js API routes (server context).
 * Bypasses Firestore security rules, so all writes are guaranteed to succeed.
 * Uses Firestore transactions for atomic idempotency to prevent double-awarding.
 *
 * DO NOT import this file in any 'use client' component.
 *
 * ── Key rules from the Omnia Loyalty Program document ─────────────────────────
 *
 * Coin earning:
 *   Travel bookings:   1 coin per ETB 1,000 of invoice value × tier multiplier
 *   Merch/events:      1 coin per ETB 150 of invoice value × tier multiplier
 *
 * Welcome bonus:       100 coins on the user's FIRST completed booking (not signup)
 *
 * Referral coins (awarded ONLY after referred person's trip is fully completed):
 *   Individual:        150 coins
 *   Group (5+ pax):    350 coins
 *   Corporate:         600 coins
 *   → Referral coins do NOT count toward tier (affectsTier = false)
 *   → The referred trip counts as +1 toward the referrer's completedTripsThisYear
 *
 * Tier qualification:  Based SOLELY on completedTripsThisYear (12-month window)
 *   Hope (Bronze):     0 trips   — open enrolment
 *   HopePlus:          1 trip    — open enrolment (auto after first paid trip)
 *   Explorer (Silver): 2 trips   — open enrolment
 *   Royal (Gold):      3 trips   — invite/approval (Omnia team confirms ≤5 days)
 *   Timeless (Platinum): 4 trips — invite/approval
 *   Diamond:           5+ trips  — invite/approval
 */

import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  calculateBookingCoins,
  getTierMultiplier,
  TIERS,
  COINS_EXPIRY_MONTHS,
  COINS_EXTENSION_DAYS,
  REFERRAL_COINS,
  WELCOME_BONUS_COINS,
  type TierName,
  type ReferralType,
} from "./loyalty.service";

// ── Internal helper: write a coin transaction (Admin SDK) ─────────────────────

async function writeCoinTransactionAdmin(params: {
  userId: string;
  amount: number;
  type: string;
  affectsTier: boolean;
  relatedBookingId?: string | null;
  multiplierApplied: number;
  tierAtTime: TierName;
  reason: string;
  status: "active" | "reversed" | "expired";
}): Promise<void> {
  const db = getAdminDb();

  const exp = new Date();
  exp.setMonth(exp.getMonth() + COINS_EXPIRY_MONTHS);
  const expiresAt =
    params.amount > 0 &&
    params.type !== "reversal" &&
    params.type !== "redemption" &&
    params.type !== "expiry"
      ? exp.toISOString()
      : null;

  const txData = {
    userId: params.userId,
    coins: params.amount,
    amount: params.amount,
    type: params.type,
    affectsTier: params.affectsTier,
    relatedBookingId: params.relatedBookingId ?? null,
    multiplierApplied: params.multiplierApplied,
    tierAtTime: params.tierAtTime,
    reason: params.reason,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    status: params.status,
  };

  const batch = db.batch();

  const histRef = db
    .collection("users")
    .doc(params.userId)
    .collection("coinsHistory")
    .doc();
  batch.set(histRef, txData);

  const loyaltyRef = db.collection("loyaltyTransactions").doc();
  batch.set(loyaltyRef, { ...txData, coinsHistoryId: histRef.id });

  // Update user balance
  const userUpdate: Record<string, any> = {
    loyaltyPoints: FieldValue.increment(params.amount),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (
    params.amount > 0 &&
    params.type !== "reversal" &&
    params.type !== "redemption" &&
    params.type !== "expiry"
  ) {
    userUpdate.totalCoinsEarned = FieldValue.increment(params.amount);
  }

  batch.set(db.collection("users").doc(params.userId), userUpdate, {
    merge: true,
  });

  await batch.commit();

  // ── 90-day expiry extension: extend active coins when new coins are earned ──
  const isEarnType =
    params.amount > 0 &&
    params.type !== "reversal" &&
    params.type !== "redemption" &&
    params.type !== "expiry";

  if (isEarnType) {
    try {
      const snap = await db
        .collection("users")
        .doc(params.userId)
        .collection("coinsHistory")
        .where("status", "==", "active")
        .get();

      const now = new Date().toISOString();
      const extBatch = db.batch();
      let extCount = 0;

      snap.forEach((d) => {
        const txData = d.data();
        if (txData.expiresAt && txData.expiresAt > now && txData.amount > 0) {
          const currentExpiry = new Date(txData.expiresAt);
          currentExpiry.setDate(currentExpiry.getDate() + COINS_EXTENSION_DAYS);
          extBatch.update(d.ref, { expiresAt: currentExpiry.toISOString() });
          extCount++;
        }
      });

      if (extCount > 0) {
        await extBatch.commit();
        console.log(
          "[writeCoinTransactionAdmin] Extended", extCount,
          "active coin records by", COINS_EXTENSION_DAYS, "days for:", params.userId
        );
      }
    } catch (err) {
      console.error("[writeCoinTransactionAdmin] expiry extension failed (non-fatal):", err);
    }
  }
}

// ── Welcome bonus ─────────────────────────────────────────────────────────────

/**
 * Award 100 welcome coins on a user's FIRST completed booking.
 * Idempotent — checks for an existing welcome_bonus transaction first.
 * Called inside awardBookingCoinsAdmin before awarding booking coins.
 */
async function awardWelcomeBonusAdmin(
  userId: string,
  tx?: FirebaseFirestore.Transaction
): Promise<boolean> {
  const db = getAdminDb();

  const existingSnap = await db
    .collection("users")
    .doc(userId)
    .collection("coinsHistory")
    .where("type", "==", "welcome_bonus")
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    console.log("[awardWelcomeBonusAdmin] Already awarded for:", userId);
    return false;
  }

  const exp = new Date();
  exp.setMonth(exp.getMonth() + COINS_EXPIRY_MONTHS);

  const txData = {
    userId,
    coins: WELCOME_BONUS_COINS,
    amount: WELCOME_BONUS_COINS,
    type: "welcome_bonus",
    affectsTier: false, // welcome coins are a gift, not a tier-qualifying earn
    relatedBookingId: null,
    multiplierApplied: 1,
    tierAtTime: "Hope" as TierName,
    reason: "Welcome bonus — thank you for your first booking with Omnia!",
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: exp.toISOString(),
    status: "active",
  };

  const histRef = db
    .collection("users")
    .doc(userId)
    .collection("coinsHistory")
    .doc();
  const loyaltyRef = db.collection("loyaltyTransactions").doc();
  const userRef = db.collection("users").doc(userId);

  if (tx) {
    tx.set(histRef, txData);
    tx.set(loyaltyRef, { ...txData, coinsHistoryId: histRef.id });
    tx.set(
      userRef,
      {
        loyaltyPoints: FieldValue.increment(WELCOME_BONUS_COINS),
        totalCoinsEarned: FieldValue.increment(WELCOME_BONUS_COINS),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    const batch = db.batch();
    batch.set(histRef, txData);
    batch.set(loyaltyRef, { ...txData, coinsHistoryId: histRef.id });
    batch.set(
      userRef,
      {
        loyaltyPoints: FieldValue.increment(WELCOME_BONUS_COINS),
        totalCoinsEarned: FieldValue.increment(WELCOME_BONUS_COINS),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();
  }

  console.log(
    "[awardWelcomeBonusAdmin] 100 welcome coins awarded to:",
    userId
  );
  return true;
}

// ── Award booking coins (atomic, server-side) ─────────────────────────────────

/**
 * Award coins for a completed booking (travel).
 *
 * Flow:
 *   1. Validate booking is paid and completed/confirmed.
 *   2. Award 100 welcome coins if this is the user's first booking.
 *   3. Calculate booking coins: floor(invoiceValue / 1,000) × tier multiplier.
 *   4. Write coin transaction atomically.
 *   5. Increment completedTripsThisYear and totalCompletedTrips on user doc.
 *   6. If the user was referred, award the referrer their referral coins (+1 trip).
 *   7. Evaluate tier after transaction commits.
 *
 * Idempotent — guarded by booking.coinsStatus === "awarded".
 * Coin rate: 1 coin per ETB 1,000 of Omnia invoice value × tier multiplier.
 */
export async function awardBookingCoinsAdmin(bookingId: string): Promise<void> {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(bookingId);

  let awardedUserId: string | null = null;
  let referredBy: string | null = null;

  await db.runTransaction(async (tx) => {
    const bookingSnap = await tx.get(bookingRef);

    if (!bookingSnap.exists) {
      console.error("[awardBookingCoinsAdmin] Booking not found:", bookingId);
      return;
    }

    const booking = bookingSnap.data()!;

    // ── Idempotency guard ──────────────────────────────────────────────────
    if (booking.coinsStatus === "awarded") {
      awardedUserId = booking.userId ?? null;
      return;
    }

    if (booking.paymentStatus !== "paid") {
      console.error("[awardBookingCoinsAdmin] Booking not paid:", bookingId);
      return;
    }

    if (
      booking.bookingStatus !== "completed" &&
      booking.bookingStatus !== "confirmed"
    ) {
      console.error(
        "[awardBookingCoinsAdmin] Booking not completed/confirmed:",
        bookingId
      );
      return;
    }

    const userId: string = booking.userId;
    if (!userId) {
      console.error("[awardBookingCoinsAdmin] Missing userId:", bookingId);
      return;
    }

    // ── Resolve Omnia invoice value ────────────────────────────────────────
    // Prefer explicit omniaServiceValue; fall back to totalAmount
    let invoiceValue: number = Number(booking.omniaServiceValue ?? 0);
    if (invoiceValue <= 0) {
      invoiceValue = Number(booking.totalAmount ?? booking.amount ?? 0);
      console.warn(
        "[awardBookingCoinsAdmin] omniaServiceValue missing — using totalAmount:",
        invoiceValue
      );
    }

    // ── Fetch user for tier info and referredBy ────────────────────────────
    const userRef = db.collection("users").doc(userId);
    const userSnap = await tx.get(userRef);
    const userData = userSnap.data() ?? {};
    const currentTier: TierName = userData.tier ?? "Hope";
    referredBy = userData.referredBy ?? null;

    // ── Calculate booking coins: 1 per ETB 1,000 × tier multiplier ────────
    const coins = calculateBookingCoins(invoiceValue, currentTier);
    const multiplier = getTierMultiplier(currentTier);

    console.log("[awardBookingCoinsAdmin] Coin calculation:", {
      bookingId,
      userId,
      invoiceValue,
      tier: currentTier,
      multiplier,
      coinsAwarded: coins,
    });

    const exp = new Date();
    exp.setMonth(exp.getMonth() + COINS_EXPIRY_MONTHS);
    const expiresAt = exp.toISOString();

    const txData = {
      userId,
      coins,
      amount: coins,
      type: "booking",
      affectsTier: true,
      relatedBookingId: bookingId,
      multiplierApplied: multiplier,
      tierAtTime: currentTier,
      reason: `Booking coins: ${booking.packageTitle ?? bookingId} (ETB ${invoiceValue.toLocaleString()})`,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      status: "active",
    };

    // Write coin transaction
    const histRef = db
      .collection("users")
      .doc(userId)
      .collection("coinsHistory")
      .doc();
    tx.set(histRef, txData);

    const loyaltyRef = db.collection("loyaltyTransactions").doc();
    tx.set(loyaltyRef, { ...txData, coinsHistoryId: histRef.id });

    // Update user: coins + completedTripsThisYear (NOT totalPackages/tierCoins)
    tx.set(
      userRef,
      {
        loyaltyPoints: FieldValue.increment(coins),
        totalCoinsEarned: FieldValue.increment(coins),
        // Trip counter — sole basis for tier qualification
        completedTripsThisYear: FieldValue.increment(1),
        totalCompletedTrips: FieldValue.increment(1),
        totalSpend: FieldValue.increment(invoiceValue),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Mark booking as awarded
    tx.update(bookingRef, {
      coinsStatus: "awarded",
      coinsEarned: coins,
      updatedAt: FieldValue.serverTimestamp(),
    });

    awardedUserId = userId;
  });

  if (!awardedUserId) return;

  // ── Welcome bonus (outside transaction — has own idempotency check) ──────
  // Awarded on first booking only. 100 coins, does not affect tier.
  await awardWelcomeBonusAdmin(awardedUserId);

  // ── Referral coins (outside transaction — has own idempotency guard) ─────
  // If this user was referred, award the referrer 150 coins now that a trip
  // has been completed. Also counts as +1 trip toward the referrer's tier.
  if (referredBy && referredBy !== awardedUserId) {
    await awardReferralCoinsAdmin({
      referrerId: referredBy,
      referredUserId: awardedUserId,
      referralType: "individual", // default for signup referrals completing first trip
      relatedBookingId: bookingId,
    });
  }

  // ── Tier evaluation ───────────────────────────────────────────────────────
  await evaluateAndUpgradeTierAdmin(awardedUserId);
}

// ── Award referral coins (server-side) ────────────────────────────────────────

/**
 * Award referral coins after a referred client completes travel.
 *
 * Per program rules:
 *   - Coins are awarded ONLY after the referred traveller's trip is fully completed.
 *   - Referral coins do NOT count toward tier (affectsTier = false).
 *   - The referred trip counts as +1 toward the referrer's completedTripsThisYear,
 *     which DOES affect tier qualification.
 *   - Partial completions: pass partialFraction (0.0–1.0) for mid-trip cancellations.
 *
 * Coin amounts:
 *   individual:  150 coins
 *   group:       350 coins
 *   corporate:   600 coins
 *
 * Idempotent via referrals/{idempotencyKey} guard document.
 */
export async function awardReferralCoinsAdmin(params: {
  referrerId: string;
  referredUserId: string;
  referralType: Exclude<ReferralType, "signup">; // "signup" type removed — no signup rewards
  relatedBookingId: string;
  /** For partial completions (mid-trip cancellation): 0.0–1.0. Defaults to 1.0. */
  partialFraction?: number;
}): Promise<void> {
  const db = getAdminDb();

  // Self-referral guard
  if (params.referrerId === params.referredUserId) {
    console.warn(
      "[awardReferralCoinsAdmin] Self-referral blocked:",
      params.referrerId
    );
    return;
  }

  const idempotencyKey = `${params.referrerId}_${params.referredUserId}_${params.relatedBookingId}`;
  const referralRef = db.collection("referrals").doc(idempotencyKey);

  const existing = await referralRef.get();
  if (existing.exists && existing.data()?.status === "completed") {
    console.log(
      "[awardReferralCoinsAdmin] Already awarded — skipping:",
      idempotencyKey
    );
    return;
  }

  // Calculate coins (proportional for partial completions)
  const fraction =
    params.partialFraction !== undefined
      ? Math.min(1, Math.max(0, params.partialFraction))
      : 1.0;

  const baseCoins = REFERRAL_COINS[params.referralType];
  const coins =
    fraction < 1.0 ? Math.floor(baseCoins * fraction) : baseCoins;

  if (coins <= 0) {
    console.log(
      "[awardReferralCoinsAdmin] 0 coins to award (cancelled before travel)"
    );
    return;
  }

  // Validate referrer exists
  const referrerSnap = await db
    .collection("users")
    .doc(params.referrerId)
    .get();
  if (!referrerSnap.exists) {
    console.error(
      "[awardReferralCoinsAdmin] Referrer not found:",
      params.referrerId
    );
    return;
  }

  const referrerTier: TierName = referrerSnap.data()?.tier ?? "Hope";

  const exp = new Date();
  exp.setMonth(exp.getMonth() + COINS_EXPIRY_MONTHS);

  const txData = {
    userId: params.referrerId,
    coins,
    amount: coins,
    type: "referral",
    affectsTier: false, // referral coins NEVER count toward tier
    relatedBookingId: params.relatedBookingId,
    multiplierApplied: 1, // flat — no tier multiplier on referral coins
    tierAtTime: referrerTier,
    reason: `Referral reward (${params.referralType})${
      fraction < 1 ? ` — ${Math.round(fraction * 100)}% completed` : ""
    }: referred client completed travel`,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: exp.toISOString(),
    status: "active",
  };

  const batch = db.batch();

  // Coin transaction records
  const histRef = db
    .collection("users")
    .doc(params.referrerId)
    .collection("coinsHistory")
    .doc();
  batch.set(histRef, txData);

  const loyaltyRef = db.collection("loyaltyTransactions").doc();
  batch.set(loyaltyRef, { ...txData, coinsHistoryId: histRef.id });

  // Update referrer balance
  // NOTE: loyaltyPoints gets the coins; completedTripsThisYear gets +1 trip
  // (the referred completed trip counts toward the referrer's tier qualification).
  // tierCoins is NOT incremented — referral coins never drive tier.
  batch.set(
    db.collection("users").doc(params.referrerId),
    {
      loyaltyPoints: FieldValue.increment(coins),
      totalCoinsEarned: FieldValue.increment(coins),
      // +1 trip toward tier because a referred trip counts the same as a direct trip
      completedTripsThisYear: FieldValue.increment(1),
      totalCompletedTrips: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Idempotency guard doc
  batch.set(referralRef, {
    referrerId: params.referrerId,
    referredUserId: params.referredUserId,
    relatedBookingId: params.relatedBookingId,
    referralType: params.referralType,
    rewardAmount: coins,
    partialFraction: fraction,
    status: "completed",
    awardedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  console.log(
    "[awardReferralCoinsAdmin] Referral coins awarded:",
    coins,
    "to",
    params.referrerId,
    "(+1 trip toward tier)"
  );

  // Evaluate tier — the +1 trip may push the referrer to the next tier
  await evaluateAndUpgradeTierAdmin(params.referrerId);
}

// ── Tier evaluation (server-side, Admin SDK) ──────────────────────────────────

/**
 * Evaluate and upgrade a user's tier based solely on completedTripsThisYear.
 *
 * Tiers requiring approval (Royal/Timeless/Diamond):
 *   - A tierReviews/{userId}_{tier} document is written for the Omnia team.
 *   - The user's tier is NOT immediately changed.
 *   - Previous tier benefits remain active until confirmed.
 *
 * Open-enrolment tiers (Hope/HopePlus/Explorer):
 *   - Tier is updated immediately.
 *
 * Admin overrides (tierOverriddenByAdmin = true) skip auto-evaluation.
 * Never downgrades automatically.
 */
export async function evaluateAndUpgradeTierAdmin(userId: string): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    console.error("[evaluateAndUpgradeTierAdmin] User not found:", userId);
    return;
  }

  const data = userSnap.data()!;

  // Skip if an admin has manually overridden this user's tier
  if (data.tierOverriddenByAdmin) {
    console.log(
      "[evaluateAndUpgradeTierAdmin] Admin override active — skipping:",
      userId
    );
    return;
  }

  const completedTripsThisYear: number = data.completedTripsThisYear ?? 0;
  const currentTier: TierName = data.tier ?? "Hope";

  // Find the highest tier the user qualifies for based on trips alone
  let qualifyingTier = TIERS[0]; // default: Hope
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (completedTripsThisYear >= TIERS[i].minTrips) {
      qualifyingTier = TIERS[i];
      break;
    }
  }

  const currentIdx = TIERS.findIndex((t) => t.name === currentTier);
  const newIdx = TIERS.findIndex((t) => t.name === qualifyingTier.name);

  console.log(
    "[evaluateAndUpgradeTierAdmin]",
    userId,
    "completedTripsThisYear:", completedTripsThisYear,
    "currentTier:", currentTier,
    "→ evaluates to:", qualifyingTier.name
  );

  // Never downgrade
  if (newIdx <= currentIdx) {
    console.log(
      "[evaluateAndUpgradeTierAdmin] No upgrade needed — already at",
      currentTier
    );
    return;
  }

  // Tiers requiring Omnia team approval (Gold / Platinum / Diamond)
  if (qualifyingTier.requiresApproval) {
    const reviewKey = `${userId}_${qualifyingTier.name}`;
    const reviewRef = db.collection("tierReviews").doc(reviewKey);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists || reviewSnap.data()?.status === "pending") {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5); // 5 business days

      await reviewRef.set(
        {
          userId,
          currentTier,
          requestedTier: qualifyingTier.name,
          completedTripsThisYear,
          status: "pending",
          requestedAt: FieldValue.serverTimestamp(),
          reviewDeadline: deadline.toISOString(),
        },
        { merge: true }
      );

      console.log(
        "[evaluateAndUpgradeTierAdmin] Tier review requested:",
        userId,
        "→",
        qualifyingTier.name,
        "(pending Omnia approval)"
      );
    }
    return; // do not change tier until team confirms
  }

  // Open-enrolment tier — upgrade immediately
  await userRef.set(
    {
      tier: qualifyingTier.name,
      tierUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await db
    .collection("users")
    .doc(userId)
    .collection("tierHistory")
    .add({
      previousTier: currentTier,
      newTier: qualifyingTier.name,
      reason: `Automatic upgrade: completedTripsThisYear=${completedTripsThisYear}`,
      changedAt: FieldValue.serverTimestamp(),
    });

  console.log(
    "[evaluateAndUpgradeTierAdmin] ✅ Upgraded:",
    userId,
    "from", currentTier,
    "to", qualifyingTier.name
  );
}

// ── Confirm a pending tier upgrade (admin panel) ──────────────────────────────

/**
 * Called by the Omnia admin panel to confirm a pending tier review.
 * Applies the approved tier and closes the review document.
 */
export async function confirmTierUpgradeAdmin(params: {
  adminId: string;
  targetUserId: string;
  approvedTier: TierName;
  notes?: string;
}): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(params.targetUserId);
  const userSnap = await userRef.get();
  const previousTier: TierName = userSnap.data()?.tier ?? "Hope";

  const batch = db.batch();

  batch.set(
    userRef,
    {
      tier: params.approvedTier,
      tierOverriddenByAdmin: false,
      tierUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Close the review doc
  batch.set(
    db.collection("tierReviews").doc(`${params.targetUserId}_${params.approvedTier}`),
    {
      status: "approved",
      reviewedAt: FieldValue.serverTimestamp(),
      adminId: params.adminId,
    },
    { merge: true }
  );

  batch.set(
    db
      .collection("users")
      .doc(params.targetUserId)
      .collection("tierHistory")
      .doc(),
    {
      previousTier,
      newTier: params.approvedTier,
      reason: `Omnia team confirmed upgrade${params.notes ? ": " + params.notes : ""}`,
      changedAt: FieldValue.serverTimestamp(),
    }
  );

  batch.set(
    db.collection("auditLogs").doc(),
    {
      adminId: params.adminId,
      actionType: "tier_upgrade_confirmed",
      targetUserId: params.targetUserId,
      details: {
        previousTier,
        newTier: params.approvedTier,
        notes: params.notes ?? null,
      },
      createdAt: FieldValue.serverTimestamp(),
    }
  );

  await batch.commit();

  console.log(
    "[confirmTierUpgradeAdmin] ✅ Confirmed:",
    params.targetUserId,
    "from", previousTier,
    "to", params.approvedTier
  );
}

// ── Annual trip counter reset ─────────────────────────────────────────────────

/**
 * Reset completedTripsThisYear at the start of each membership year.
 * Call from a scheduled Cloud Function on each user's membership anniversary.
 * Tier is NOT downgraded — the cycle simply starts fresh.
 */
export async function resetAnnualTripCounterAdmin(userId: string): Promise<void> {
  const db = getAdminDb();
  await db
    .collection("users")
    .doc(userId)
    .set(
      {
        completedTripsThisYear: 0,
        membershipYearStartedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  console.log("[resetAnnualTripCounterAdmin] Trip counter reset for:", userId);
}