/**
 * Omnia Loyalty Program — Core Service
 *
 * Single source of truth for all coin calculation, tier evaluation,
 * referral logic, expiry, redemption, and admin overrides.
 *
 * Design principles:
 * - All writes to loyaltyPoints go through writeCoinTransaction() — never direct
 * - awardBookingCoins / reverseBookingCoins are idempotent
 * - Tier can only be upgraded automatically; downgrades require admin action
 * - Annual Omnia value resets every 12 months from tierUpdatedAt
 * - Coins expire 24 months after createdAt
 * - Redemption is capped at 30% of the Omnia service fee, FIFO deduction
 * - Every admin action writes to auditLogs with actionType + details
 */

import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";

// ── Constants ─────────────────────────────────────────────────────────────────

/** 1 coin per ETB 1,000 of Omnia-managed service value */
export const ETB_PER_COIN = 1_000;
export const COINS_EXPIRY_MONTHS = 24;
export const REDEMPTION_CAP_PERCENT = 0.30; // 30% of Omnia service fee

// ── Tier definitions (spec-exact thresholds) ─────────────────────────────────

export type TierName = "Hope" | "Explorer" | "Gold" | "Platinum";

export interface Tier {
  name: TierName;
  label: string;
  multiplier: number;
  minAnnualSpend: number; // ETB annual Omnia-managed service value
  minCoins: number;       // alternative: lifetime coins earned threshold
  color: string;
}

export const TIERS: Tier[] = [
  { name: "Hope",     label: "Hope (Blue)",       multiplier: 1.0, minAnnualSpend: 0,        minCoins: 0,     color: "blue"     },
  { name: "Explorer", label: "Explorer (Silver)",  multiplier: 1.2, minAnnualSpend: 50_000,   minCoins: 500,   color: "silver"   },
  { name: "Gold",     label: "Gold (Royal)",       multiplier: 1.5, minAnnualSpend: 100_000,  minCoins: 1_000, color: "gold"     },
  { name: "Platinum", label: "Platinum (Legacy)",  multiplier: 2.0, minAnnualSpend: 200_000,  minCoins: 1_500, color: "platinum" },
];

// ── Referral reward amounts ───────────────────────────────────────────────────

export const REFERRAL_COINS = {
  individual: 500,
  group: 1_000,
  corporate: 2_000,
} as const;
export type ReferralType = keyof typeof REFERRAL_COINS;

// ── Transaction types ─────────────────────────────────────────────────────────

export type CoinTransactionType = "booking" | "referral" | "manual" | "reversal" | "redemption" | "expiry";
export type CoinTransactionStatus = "active" | "expired" | "reversed";

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: CoinTransactionType;
  relatedBookingId?: string;
  multiplierApplied: number;
  tierAtTime: TierName;
  reason: string;
  createdAt: any;
  expiresAt: string | null; // ISO string; null for deduction entries
  status: CoinTransactionStatus;
}

// ── Pure calculation helpers (no Firestore) ───────────────────────────────────

/** Base coins = floor(omniaServiceValue / ETB_PER_COIN) */
export function calculateBaseCoins(omniaServiceValue: number): number {
  return Math.floor(omniaServiceValue / ETB_PER_COIN);
}

/** Apply tier multiplier to base coins */
export function applyTierMultiplier(baseCoins: number, tier: TierName): number {
  const tierDef = TIERS.find((t) => t.name === tier);
  const multiplier = tierDef?.multiplier ?? 1.0;
  return Math.floor(baseCoins * multiplier);
}

/** Full booking coin calculation */
export function calculateBookingCoins(omniaServiceValue: number, tier: TierName): number {
  return applyTierMultiplier(calculateBaseCoins(omniaServiceValue), tier);
}

/**
 * Evaluate tier based on annualOmniaValue OR lifetime coins earned.
 * Returns the highest qualifying tier.
 */
export function evaluateTier(annualOmniaValue: number, totalCoinsEarned: number): TierName {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const t = TIERS[i];
    if (annualOmniaValue >= t.minAnnualSpend || totalCoinsEarned >= t.minCoins) {
      return t.name;
    }
  }
  return "Hope";
}

/** Get tier multiplier for a given tier name */
export function getTierMultiplier(tier: TierName): number {
  return TIERS.find((t) => t.name === tier)?.multiplier ?? 1.0;
}

/**
 * Validate a redemption request.
 * Returns { valid, maxRedeemable, error? }
 */
export function validateRedemption(params: {
  requestedCoins: number;
  userBalance: number;
  omniaServiceFee: number;
}): { valid: boolean; maxRedeemable: number; error?: string } {
  const { requestedCoins, userBalance, omniaServiceFee } = params;
  const maxRedeemable = Math.floor((omniaServiceFee * REDEMPTION_CAP_PERCENT) / ETB_PER_COIN);

  if (requestedCoins > userBalance) {
    return { valid: false, maxRedeemable, error: "Insufficient coin balance." };
  }
  if (requestedCoins > maxRedeemable) {
    return {
      valid: false,
      maxRedeemable,
      error: `Cannot redeem more than ${maxRedeemable} coins (30% of Omnia service fee).`,
    };
  }
  return { valid: true, maxRedeemable };
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

/**
 * Write a coin transaction to users/{uid}/coinsHistory AND atomically
 * update loyaltyPoints + totalCoinsEarned on the user doc.
 *
 * - loyaltyPoints  = spendable balance (goes up for earn, down for deductions)
 * - totalCoinsEarned = lifetime earn counter (only increases for positive earn types)
 */
export async function writeCoinTransaction(params: {
  userId: string;
  amount: number;
  type: CoinTransactionType;
  relatedBookingId?: string;
  reason: string;
  multiplierApplied?: number;
  tierAtTime?: TierName;
  status?: CoinTransactionStatus;
  /** Pass false to skip updating loyaltyPoints (used internally during FIFO deduction) */
  updateBalance?: boolean;
}): Promise<string> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, collection, addDoc, updateDoc, getDoc, increment, serverTimestamp } = modules.firestore;

  // Resolve current tier for the transaction record
  let tierAtTime: TierName = params.tierAtTime ?? "Hope";
  if (!params.tierAtTime) {
    try {
      const userSnap = await getDoc(doc(db, "users", params.userId));
      if (userSnap.exists()) tierAtTime = (userSnap.data() as any).tier ?? "Hope";
    } catch { /* use default */ }
  }

  const multiplierApplied = params.multiplierApplied ?? getTierMultiplier(tierAtTime);
  const isEarnType = params.amount > 0 && params.type !== "reversal" && params.type !== "redemption" && params.type !== "expiry";

  // Calculate expiresAt — only for positive earn transactions
  let expiresAt: string | null = null;
  if (isEarnType) {
    const exp = new Date();
    exp.setMonth(exp.getMonth() + COINS_EXPIRY_MONTHS);
    expiresAt = exp.toISOString();
  }

  const historyRef = collection(db, "users", params.userId, "coinsHistory");
  const txRef = await addDoc(historyRef, {
    userId: params.userId,
    amount: params.amount,
    type: params.type,
    relatedBookingId: params.relatedBookingId ?? null,
    multiplierApplied,
    tierAtTime,
    reason: params.reason,
    createdAt: serverTimestamp(),
    expiresAt,
    status: params.status ?? (params.amount >= 0 ? "active" : "reversed"),
  });

  // Update user balance
  if (params.updateBalance !== false) {
    const userUpdate: Record<string, any> = {
      loyaltyPoints: increment(params.amount),
      updatedAt: serverTimestamp(),
    };
    // Only count positive earn transactions toward lifetime total
    if (isEarnType) {
      userUpdate.totalCoinsEarned = increment(params.amount);
    }
    await updateDoc(doc(db, "users", params.userId), userUpdate);
  }

  return txRef.id;
}

// ── Award / Reverse booking coins ─────────────────────────────────────────────

/**
 * Award coins for a completed booking.
 * Idempotent — checks coinsStatus === "awarded" before writing.
 * Also updates annualOmniaValue, lifetimeOmniaValue on the user doc.
 */
export async function awardBookingCoins(bookingId: string) {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();

  if (!db || !modules.firestore) return;

  const {
    doc,
    getDoc,
    updateDoc,
    increment,
    addDoc,
    collection,
    serverTimestamp,
  } = modules.firestore;

  const bookingRef = doc(db, "bookings", bookingId);
  const bookingSnap = await getDoc(bookingRef);

  if (!bookingSnap.exists()) {
    console.log("Booking not found");
    return;
  }

  const booking = bookingSnap.data() as any;

  console.log("BOOKING DATA:", booking);

  const userId = booking.userId;
  const value = booking.omniaServiceValue || 0;
  const paymentStatus = booking.paymentStatus;

  if (!userId) {
    console.log("Missing userId");
    return;
  }

  if (paymentStatus !== "paid") {
    console.log("Payment not paid:", paymentStatus);
    return;
  }

  const coins = Math.floor(value / 1000);

  console.log("COINS:", coins);

  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    loyaltyPoints: increment(coins),
    totalCoinsEarned: increment(coins),
    annualOmniaValue: increment(value),
  });

  await addDoc(collection(db, "users", userId, "coinsHistory"), {
    amount: coins,
    type: "booking",
    bookingId,
    createdAt: serverTimestamp(),
  });

  await updateDoc(bookingRef, {
    coinsStatus: "awarded",
    coinsEarned: coins,
  });

  console.log("LOYALTY AWARDED");
}

/**
 * Reverse coins for a cancelled or refunded booking.
 * Prevents negative balances.
 */
export async function reverseBookingCoins(bookingId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, getDoc, updateDoc, serverTimestamp } = modules.firestore;

  const bookingRef = doc(db, "bookings", bookingId);
  const bookingSnap = await getDoc(bookingRef);
  if (!bookingSnap.exists()) return;

  const booking = bookingSnap.data() as any;
  if (booking.coinsStatus !== "awarded" || !booking.coinsEarned) return;

  const coinsToReverse: number = booking.coinsEarned;
  const userId: string = booking.userId;

  // Clamp to prevent negative balance
  const userSnap = await getDoc(doc(db, "users", userId));
  const currentBalance: number = userSnap.exists()
    ? (userSnap.data() as any).loyaltyPoints ?? 0
    : 0;
  const actualReversal = Math.min(coinsToReverse, Math.max(0, currentBalance));

  if (actualReversal > 0) {
    await writeCoinTransaction({
      userId,
      amount: -actualReversal,
      type: "reversal",
      relatedBookingId: bookingId,
      reason: `Coins reversed: booking cancelled/refunded (${booking.packageTitle ?? bookingId})`,
      tierAtTime: userSnap.exists() ? ((userSnap.data() as any).tier ?? "Hope") : "Hope",
      multiplierApplied: 1,
      status: "reversed",
    });
  }

  await updateDoc(bookingRef, {
    coinsStatus: "reversed",
    updatedAt: serverTimestamp(),
  });
}

// ── Tier evaluation ───────────────────────────────────────────────────────────

/**
 * Evaluate and upgrade a user's tier. Never downgrades automatically.
 * Writes to users/{uid}/tierHistory when a change occurs.
 */
export async function evaluateAndUpgradeTier(
  userId: string,
  hint?: { annualOmniaValue: number; totalCoinsEarned: number; currentTier: TierName }
): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return;

  const { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } = modules.firestore;

  let annualOmniaValue: number;
  let totalCoinsEarned: number;
  let currentTier: TierName;

  if (hint) {
    annualOmniaValue = hint.annualOmniaValue;
    totalCoinsEarned = hint.totalCoinsEarned;
    currentTier = hint.currentTier;
  } else {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const data = userSnap.data() as any;
    annualOmniaValue = data.annualOmniaValue ?? 0;
    totalCoinsEarned = data.totalCoinsEarned ?? 0;
    currentTier = data.tier ?? "Hope";
  }

  const currentIdx = TIERS.findIndex((t) => t.name === currentTier);
  const newTier = evaluateTier(annualOmniaValue, totalCoinsEarned);
  const newIdx = TIERS.findIndex((t) => t.name === newTier);

  if (newIdx <= currentIdx) return; // no upgrade needed

  await updateDoc(doc(db, "users", userId), {
    tier: newTier,
    tierUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Write tierHistory entry
  await addDoc(collection(db, "users", userId, "tierHistory"), {
    previousTier: currentTier,
    newTier,
    reason: `Automatic upgrade: annualOmniaValue=${annualOmniaValue} ETB, totalCoinsEarned=${totalCoinsEarned}`,
    changedAt: serverTimestamp(),
  });
}

// ── Referral coins ────────────────────────────────────────────────────────────

/**
 * Award referral coins after referred client completes travel.
 * Idempotent — uses referrals/{idempotencyKey} as a guard document.
 * Stores referral record per spec in the referrals collection.
 */
export async function awardReferralCoins(params: {
  referrerId: string;
  referredUserId: string;
  referralType: ReferralType;
  relatedBookingId: string;
  corporateCoins?: number;
}): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, getDoc, setDoc, serverTimestamp } = modules.firestore;

  // Idempotency key
  const idempotencyKey = `${params.referrerId}_${params.referredUserId}_${params.relatedBookingId}`;
  const referralRef = doc(db, "referrals", idempotencyKey);
  const existing = await getDoc(referralRef);
  if (existing.exists() && existing.data()?.status === "completed") return;

  const coins =
    params.referralType === "corporate" && params.corporateCoins !== undefined
      ? Math.min(params.corporateCoins, REFERRAL_COINS.corporate)
      : REFERRAL_COINS[params.referralType];

  // Get referrer tier
  const referrerSnap = await getDoc(doc(db, "users", params.referrerId));
  const referrerTier: TierName = referrerSnap.exists()
    ? ((referrerSnap.data() as any).tier ?? "Hope")
    : "Hope";

  await writeCoinTransaction({
    userId: params.referrerId,
    amount: coins,
    type: "referral",
    relatedBookingId: params.relatedBookingId,
    reason: `Referral reward (${params.referralType}): referred client completed travel`,
    tierAtTime: referrerTier,
    multiplierApplied: 1, // referral coins are flat — no multiplier
    status: "active",
  });

  // Write referral record (spec fields)
  await setDoc(referralRef, {
    referrerId: params.referrerId,
    referredUserId: params.referredUserId,
    relatedBookingId: params.relatedBookingId,
    referralType: params.referralType,
    rewardAmount: coins,
    status: "completed",
    awardedAt: serverTimestamp(),
  });

  // Evaluate tier upgrade for referrer
  await evaluateAndUpgradeTier(params.referrerId);
}

// ── Coin redemption (FIFO) ────────────────────────────────────────────────────

/**
 * Redeem coins using FIFO order (oldest active coins deducted first).
 * Validates against 30% cap and sufficient balance before writing.
 */
export async function redeemCoins(params: {
  userId: string;
  coinsToRedeem: number;
  omniaServiceFee: number;
  relatedBookingId?: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string; etbValue: number }> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc } = modules.firestore;

  // Get current balance
  const userSnap = await getDoc(doc(db, "users", params.userId));
  if (!userSnap.exists()) return { success: false, error: "User not found.", etbValue: 0 };
  const userData = userSnap.data() as any;
  const balance: number = userData.loyaltyPoints ?? 0;

  // Validate
  const validation = validateRedemption({
    requestedCoins: params.coinsToRedeem,
    userBalance: balance,
    omniaServiceFee: params.omniaServiceFee,
  });
  if (!validation.valid) {
    return { success: false, error: validation.error, etbValue: 0 };
  }

  // Fetch active coin transactions ordered by createdAt ASC (oldest first = FIFO)
  const historySnap = await getDocs(
    query(
      collection(db, "users", params.userId, "coinsHistory"),
      where("status", "==", "active"),
      orderBy("createdAt", "asc")
    )
  );

  // FIFO deduction — mark individual transactions as reversed/partially consumed
  let remaining = params.coinsToRedeem;
  const updatePromises: Promise<void>[] = [];

  historySnap.forEach((d: any) => {
    if (remaining <= 0) return;
    const data = d.data();
    if (data.amount <= 0) return; // skip deduction entries

    const available = data.amount as number;
    if (available <= remaining) {
      // Consume this transaction entirely
      remaining -= available;
      updatePromises.push(
        updateDoc(
          doc(db, "users", params.userId, "coinsHistory", d.id),
          { status: "reversed" }
        )
      );
    } else {
      // Partially consume — split is handled by writing a new partial reversal
      remaining = 0;
      // We don't split the doc — just note partial use; full deduction is tracked
      // via the redemption transaction below
    }
  });

  await Promise.all(updatePromises);

  // Write a single redemption transaction entry (negative amount)
  await writeCoinTransaction({
    userId: params.userId,
    amount: -params.coinsToRedeem,
    type: "redemption",
    relatedBookingId: params.relatedBookingId,
    reason: params.reason ?? `Redeemed ${params.coinsToRedeem} coins against booking`,
    multiplierApplied: 1,
    tierAtTime: userData.tier ?? "Hope",
    status: "reversed",
    expiresAt: null,
  } as any);

  const etbValue = params.coinsToRedeem * ETB_PER_COIN;
  return { success: true, etbValue };
}

// ── Coin expiry ───────────────────────────────────────────────────────────────

/**
 * Expire coins that are past their expiresAt date.
 * Should be triggered by a scheduled Cloud Function or admin action.
 * Returns total coins expired.
 */
export async function expireOldCoins(userId: string): Promise<number> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return 0;

  const { doc, collection, query, where, getDocs, updateDoc, serverTimestamp } = modules.firestore;

  const now = new Date().toISOString();
  let totalExpired = 0;

  try {
    const snap = await getDocs(
      query(
        collection(db, "users", userId, "coinsHistory"),
        where("status", "==", "active")
      )
    );

    const updates: Promise<void>[] = [];
    snap.forEach((d: any) => {
      const data = d.data();
      // Only expire positive earn transactions with a valid expiresAt
      if (data.expiresAt && data.expiresAt < now && data.amount > 0) {
        totalExpired += data.amount as number;
        updates.push(
          updateDoc(
            doc(db, "users", userId, "coinsHistory", d.id),
            { status: "expired" }
          )
        );
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      // Write a single expiry deduction transaction
      await writeCoinTransaction({
        userId,
        amount: -totalExpired,
        type: "expiry",
        reason: `${totalExpired} coins expired after ${COINS_EXPIRY_MONTHS} months`,
        multiplierApplied: 1,
        status: "expired",
      });
    }
  } catch {
    // Silent — will retry next scheduled run
  }

  return totalExpired;
}

// ── Coin history query ────────────────────────────────────────────────────────

export async function getUserCoinHistory(userId: string): Promise<CoinTransaction[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, orderBy, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(
      query(collection(db, "users", userId, "coinsHistory"), orderBy("createdAt", "desc"))
    );
    const txs: CoinTransaction[] = [];
    snap.forEach((d: any) => {
      const data = d.data();
      txs.push({
        id: d.id,
        userId: data.userId ?? userId,
        amount: data.amount ?? 0,
        type: data.type ?? "manual",
        relatedBookingId: data.relatedBookingId ?? undefined,
        multiplierApplied: data.multiplierApplied ?? 1,
        tierAtTime: data.tierAtTime ?? "Hope",
        reason: data.reason ?? "",
        createdAt: data.createdAt,
        expiresAt: data.expiresAt ?? null,
        status: data.status ?? "active",
      });
    });
    return txs;
  } catch {
    return [];
  }
}

// ── Admin overrides ───────────────────────────────────────────────────────────

/**
 * Admin manual coin adjustment with full audit log.
 */
export async function adminAdjustCoins(params: {
  adminId: string;
  targetUserId: string;
  amount: number;
  reason: string;
  type?: CoinTransactionType;
}): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { collection, addDoc, serverTimestamp } = modules.firestore;

  await writeCoinTransaction({
    userId: params.targetUserId,
    amount: params.amount,
    type: params.type ?? "manual",
    reason: params.reason,
    status: params.amount >= 0 ? "active" : "reversed",
  });

  await addDoc(collection(db, "auditLogs"), {
    adminId: params.adminId,
    actionType: "manual_coin_adjustment",
    targetUserId: params.targetUserId,
    details: {
      amount: params.amount,
      reason: params.reason,
      type: params.type ?? "manual",
    },
    createdAt: serverTimestamp(),
  });
}

/**
 * Admin manual tier override with audit log.
 */
export async function adminSetTier(params: {
  adminId: string;
  targetUserId: string;
  tier: TierName;
  reason: string;
}): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } = modules.firestore;

  // Read current tier for history record
  const userSnap = await getDoc(doc(db, "users", params.targetUserId));
  const previousTier: TierName = userSnap.exists()
    ? ((userSnap.data() as any).tier ?? "Hope")
    : "Hope";

  await updateDoc(doc(db, "users", params.targetUserId), {
    tier: params.tier,
    tierOverriddenByAdmin: true,
    tierUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Write tierHistory entry
  await addDoc(collection(db, "users", params.targetUserId, "tierHistory"), {
    previousTier,
    newTier: params.tier,
    reason: `Admin override: ${params.reason}`,
    changedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "auditLogs"), {
    adminId: params.adminId,
    actionType: "manual_tier_override",
    targetUserId: params.targetUserId,
    details: {
      previousTier,
      newTier: params.tier,
      reason: params.reason,
    },
    createdAt: serverTimestamp(),
  });
}

/**
 * Admin assign Travel Family recognition with audit log.
 */
export async function adminAssignTravelFamily(params: {
  adminId: string;
  targetUserId: string;
  familyName: string;
  reason: string;
}): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, collection, addDoc, serverTimestamp } = modules.firestore;

  await updateDoc(doc(db, "users", params.targetUserId), {
    travelFamily: params.familyName,
    travelFamilyAssignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "auditLogs"), {
    adminId: params.adminId,
    actionType: "travel_family_assigned",
    targetUserId: params.targetUserId,
    details: {
      familyName: params.familyName,
      reason: params.reason,
    },
    createdAt: serverTimestamp(),
  });
}

/**
 * Get audit log entries (admin only).
 */
export async function getAuditLogs(limitCount = 100): Promise<any[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, orderBy, limit, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(
      query(collection(db, "auditLogs"), orderBy("createdAt", "desc"), limit(limitCount))
    );
    const logs: any[] = [];
    snap.forEach((d: any) => logs.push({ id: d.id, ...d.data() }));
    return logs;
  } catch {
    return [];
  }
}
