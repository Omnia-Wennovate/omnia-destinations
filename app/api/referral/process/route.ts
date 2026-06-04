import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/process-referral
 *
 * Called when a new user signs up with a referral code.
 *
 * Per the Omnia Loyalty Program rules:
 *   - Referral coins are NOT awarded at signup.
 *   - Coins are awarded ONLY after the referred person's trip is fully
 *     completed (individual: 150 coins, group: 350 coins, corporate: 600 coins).
 *   - This route only records `referredBy` on the new user document so that
 *     the booking-completion flow can look it up and award coins at that point.
 *
 * What this route does:
 *   1. Validate the referral code and find the referrer.
 *   2. Guard against self-referrals.
 *   3. Atomically save `referredBy` on the new user + increment `totalReferrals`
 *      on the referrer.
 *
 * What this route does NOT do:
 *   - Award any coins (that happens in the booking-completion flow).
 *   - Count a trip toward the referrer's tier (that also happens at completion).
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
    //    Save referredBy on the new user and increment the referrer's counter.
    //    No coins are awarded here — coins come only after a completed trip.
    const batch = db.batch();

    batch.update(newUserRef, {
      referredBy: referrerId,
      referralCodeUsed: referralCode.trim().toUpperCase(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.update(referrerDoc.ref, {
      totalReferrals: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    console.log(
      `[process-referral] ✅ referredBy=${referrerId} saved for user=${newUserId}` +
      ` — coins will be awarded when the referred person completes a trip`
    );

    return NextResponse.json({ success: true, referrerId });
  } catch (error: any) {
    console.error("[process-referral] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}