/**
 * loyalty.admin.ts — Server-side loyalty operations using Firebase Admin SDK.
 *
 * Used ONLY inside Next.js API routes (server context).
 * Bypasses Firestore security rules, so all writes are guaranteed to succeed.
 * Uses a Firestore transaction for atomic idempotency to prevent double-awarding.
 *
 * DO NOT import this file in any 'use client' component.
 */

import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  calculateBookingCoins,
  getTierMultiplier,
  COINS_EXPIRY_MONTHS,
  REFERRAL_COINS,
  type TierName,
  type ReferralType,
} from "./loyalty.service";

// ── Award booking coins (atomic, server-side) ─────────────────────────────────

/**
 * Award booking coins atomically using a Firestore transaction.
 * Idempotent — safe to call multiple times; will only award once.
 * Requires: booking.paymentStatus === "paid"
 */
export async function awardBookingCoinsAdmin(bookingId: string): Promise<void> {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(bookingId);

  await db.runTransaction(async (tx) => {
    const bookingSnap = await tx.get(bookingRef);

    if (!bookingSnap.exists) {
      console.error("[awardBookingCoinsAdmin] Booking not found:", bookingId);
      return;
    }

    const booking = bookingSnap.data()!;

    // Idempotency guard — atomic inside transaction
    if (booking.coinsStatus === "awarded") {
      return; // Already processed — no-op
    }

    if (booking.paymentStatus !== "paid") {
      console.error("[awardBookingCoinsAdmin] Booking not paid yet:", bookingId);
      return;
    }

    if (booking.bookingStatus !== "completed" && booking.bookingStatus !== "confirmed") {
      console.error("[awardBookingCoinsAdmin] Booking not completed/confirmed yet:", bookingId);
      return;
    }

    console.log("✅ Conditions met for booking:", bookingId);
    console.log("🎯 Awarding coins...");

    const userId: string = booking.userId;
    // Fall back to computing omniaServiceValue from totalAmount when missing or 0
    // (same formula as createBooking: Math.floor(totalAmount * 0.10))
    let value: number = Number(booking.omniaServiceValue ?? 0);
    if (value <= 0) {
      const totalAmount = Number(booking.totalAmount ?? booking.amount ?? 0);
      value = Math.floor(totalAmount * 0.10);
      console.warn("⚠️ omniaServiceValue was 0/missing for booking:", bookingId, "— computed from totalAmount:", value);
    }

    if (!userId) {
      console.error("❌ Missing userId on booking:", bookingId);
      return;
    }

    // Fetch user inside transaction for tier info
    const userRef = db.collection("users").doc(userId);
    const userSnap = await tx.get(userRef);
    const userData = userSnap.data() ?? {};
    const currentTier: TierName = userData.tier ?? "Hope";

    const coins = calculateBookingCoins(value, currentTier);
    const multiplier = getTierMultiplier(currentTier);

    console.log("🔢 Coin calculation:", {
      bookingId,
      userId,
      omniaServiceValue: value,
      tier: currentTier,
      multiplier,
      coinsAwarded: coins,
    });

    // Compute expiry date
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
      reason: `Booking coins: ${booking.packageTitle ?? bookingId} (${value.toLocaleString()} ETB)`,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      status: "active",
    };

    // 1. Write to users/{uid}/coinsHistory
    const histRef = db
      .collection("users")
      .doc(userId)
      .collection("coinsHistory")
      .doc();
    tx.set(histRef, txData);

    // 2. Mirror to top-level loyaltyTransactions (admin cross-user queries)
    const loyaltyRef = db.collection("loyaltyTransactions").doc();
    tx.set(loyaltyRef, { ...txData, coinsHistoryId: histRef.id });

    // 3. Update user aggregates atomically
    tx.set(
      userRef,
      {
        loyaltyPoints: FieldValue.increment(coins),
        totalCoinsEarned: FieldValue.increment(coins),
        tierCoins: FieldValue.increment(coins), // aggregated field — avoids full subcollection scan
        totalPackages: FieldValue.increment(1),
        totalSpend: FieldValue.increment(value),
        annualOmniaValue: FieldValue.increment(value),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 4. Mark booking coins as awarded
    tx.update(bookingRef, {
      coinsStatus: "awarded",
      coinsEarned: coins,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

// ── Award referral coins (server-side) ────────────────────────────────────────

/**
 * Award referral coins after a booking completes — server-side version.
 * Idempotent via referrals/{idempotencyKey} guard document.
 */
export async function awardReferralCoinsAdmin(params: {
  referrerId: string;
  referredUserId: string;
  referralType: ReferralType;
  relatedBookingId: string;
}): Promise<void> {
  const db = getAdminDb();

  // Self-referral guard
  if (params.referrerId === params.referredUserId) {
    console.warn("[awardReferralCoinsAdmin] Ignored: self-referral detected for user:", params.referrerId);
    return;
  }

  const idempotencyKey = `${params.referrerId}_${params.referredUserId}_${params.relatedBookingId}`;
  const referralRef = db.collection("referrals").doc(idempotencyKey);

  const existing = await referralRef.get();
  if (existing.exists && existing.data()?.status === "completed") return;

  const coins = REFERRAL_COINS[params.referralType];

  // Validate both users exist + fetch referrer tier
  const [referrerSnap, referredSnap] = await Promise.all([
    db.collection("users").doc(params.referrerId).get(),
    db.collection("users").doc(params.referredUserId).get(),
  ]);

  if (!referrerSnap.exists) {
    console.error("[awardReferralCoinsAdmin] Referrer not found:", params.referrerId);
    return;
  }
  if (!referredSnap.exists) {
    console.error("[awardReferralCoinsAdmin] Referred user not found:", params.referredUserId);
    return;
  }

  const referrerTier: TierName = referrerSnap.data()?.tier ?? "Hope";
  console.log("Referral reward triggered:", params.relatedBookingId, "→ referrer:", params.referrerId, "gets", coins, "coins");

  const exp = new Date();
  exp.setMonth(exp.getMonth() + COINS_EXPIRY_MONTHS);

  const txData = {
    userId: params.referrerId,
    coins,
    amount: coins,
    type: "referral",
    affectsTier: false, // referral coins never count toward tier
    relatedBookingId: params.relatedBookingId,
    multiplierApplied: 1,
    tierAtTime: referrerTier,
    reason: `Referral reward (${params.referralType}): referred client completed travel`,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: exp.toISOString(),
    status: "active",
  };

  const batch = db.batch();

  const histRef = db
    .collection("users")
    .doc(params.referrerId)
    .collection("coinsHistory")
    .doc();
  batch.set(histRef, txData);

  const loyaltyRef = db.collection("loyaltyTransactions").doc();
  batch.set(loyaltyRef, { ...txData, coinsHistoryId: histRef.id });

  batch.set(
    db.collection("users").doc(params.referrerId),
    {
      loyaltyPoints: FieldValue.increment(coins),
      tierCoins: FieldValue.increment(coins),   // referral coins count toward tier
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(referralRef, {
    referrerId: params.referrerId,
    referredUserId: params.referredUserId,
    relatedBookingId: params.relatedBookingId,
    referralType: params.referralType,
    rewardAmount: coins,
    status: "completed",
    awardedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
