import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  REFERRAL_COINS,
  COINS_EXPIRY_MONTHS,
} from "@/lib/services/loyalty.service";

/**
 * POST /api/referral/process
 *
 * Called when a new user signs up with a referral code.
 *
 * What this route does:
 *   1. Validate the referral code and find the referrer.
 *   2. Guard against self-referrals.
 *   3. Atomically save `referredBy` on the new user + increment `totalReferrals`
 *      on the referrer.
 *   4. Award 150 referral-signup coins to the referrer (idempotent).
 */
export async function POST(req: NextRequest) {
  try {
    const { referralCode, newUserId } = await req.json();

    if (!referralCode || !newUserId) {
      return NextResponse.json(
        { error: "Missing referralCode or newUserId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // ── 1. Find the referrer by code ────────────────────────────────────────
    const referrerSnap = await db
      .collection("users")
      .where("referralCode", "==", referralCode.trim().toUpperCase())
      .limit(1)
      .get();

    if (referrerSnap.empty) {
      console.log(`[process-referral] Code not found: ${referralCode}`);
      return NextResponse.json({ success: false, reason: "code_not_found" });
    }

    const referrerDoc = referrerSnap.docs[0];
    const referrerId = referrerDoc.id;

    // ── 2. Self-referral guard ───────────────────────────────────────────────
    if (referrerId === newUserId) {
      console.log(`[process-referral] Self-referral blocked: ${newUserId}`);
      return NextResponse.json({ success: false, reason: "self_referral" });
    }

    // ── 3. Check new user doc exists ─────────────────────────────────────────
    const newUserRef = db.collection("users").doc(newUserId);
    const newUserSnap = await newUserRef.get();
    if (!newUserSnap.exists) {
      return NextResponse.json(
        { error: "New user document not found" },
        { status: 404 }
      );
    }

    // ── 4. Idempotency — skip if referredBy already set ──────────────────────
    const existingReferredBy = newUserSnap.data()?.referredBy;
    if (existingReferredBy) {
      console.log(
        `[process-referral] referredBy already set for user: ${newUserId} → referrer: ${existingReferredBy}`
      );
      return NextResponse.json({
        success: true,
        referrerId: existingReferredBy,
        note: "already_recorded",
      });
    }

    // ── 5. Atomic batch write ─────────────────────────────────────────────────
    //    Save referredBy on the new user, increment referrer's counter,
    //    and award referral-signup coins to the referrer.
    const idempotencyKey = `signup_${referrerId}_${newUserId}`;
    const referralGuardRef = db.collection("referrals").doc(idempotencyKey);
    const guardSnap = await referralGuardRef.get();
    const alreadyAwarded = guardSnap.exists && guardSnap.data()?.status === "completed";

    const coins = REFERRAL_COINS.individual; // 150 coins

    const batch = db.batch();

    batch.update(newUserRef, {
      referredBy: referrerId,
      referralCodeUsed: referralCode.trim().toUpperCase(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // When awarding coins, combine referrer counter + balance into ONE write
    // (Firestore batches: last write to a doc path wins, so we must merge them)
    if (!alreadyAwarded) {
      const exp = new Date();
      exp.setMonth(exp.getMonth() + COINS_EXPIRY_MONTHS);

      const referrerTier = referrerDoc.data()?.tier ?? "Hope";

      const txData = {
        userId: referrerId,
        coins,
        amount: coins,
        type: "referral_signup",
        affectsTier: false,
        relatedBookingId: null,
        multiplierApplied: 1,
        tierAtTime: referrerTier,
        reason: `Referral signup reward: a new user joined via your referral link`,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: exp.toISOString(),
        status: "active",
      };

      const histRef = db
        .collection("users")
        .doc(referrerId)
        .collection("coinsHistory")
        .doc();
      batch.set(histRef, txData);

      const loyaltyRef = db.collection("loyaltyTransactions").doc();
      batch.set(loyaltyRef, { ...txData, coinsHistoryId: histRef.id });

      // Single merged write: totalReferrals + coin balance
      batch.set(
        referrerDoc.ref,
        {
          totalReferrals: FieldValue.increment(1),
          loyaltyPoints: FieldValue.increment(coins),
          totalCoinsEarned: FieldValue.increment(coins),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Idempotency guard doc
      batch.set(referralGuardRef, {
        referrerId,
        referredUserId: newUserId,
        referralType: "individual",
        rewardAmount: coins,
        type: "signup",
        status: "completed",
        awardedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Coins already awarded — only increment the referral counter
      batch.set(
        referrerDoc.ref,
        {
          totalReferrals: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();

    console.log(
      `[process-referral] ✅ referredBy=${referrerId} saved for user=${newUserId}` +
      (alreadyAwarded
        ? ` — coins already awarded previously`
        : ` — ${coins} referral-signup coins awarded to referrer`)
    );

    return NextResponse.json({ success: true, referrerId });
  } catch (error: any) {
    console.error("[process-referral] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}