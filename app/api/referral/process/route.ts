/**
 * POST /api/referral/process
 *
 * Called immediately after a new user is created.
 * Uses Admin SDK (bypasses Firestore security rules) to:
 *   1. Find the referrer by referralCode
 *   2. Increment their totalReferrals
 *   3. Save referredBy on the new user's document
 *   4. Award referral signup coins (500) to the referrer immediately
 *
 * Idempotent — safe to retry.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { awardReferralCoinsAdmin } from "@/lib/services/loyalty.admin";

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
      return NextResponse.json({ error: "New user document not found" }, { status: 404 });
    }

    // ── 4. Check if referredBy already set ───────────────────────────────────
    const existingReferredBy = newUserSnap.data()?.referredBy;
    let effectiveReferrerId = referrerId;

    if (existingReferredBy) {
      // referredBy already saved — skip batch write but STILL award coins below
      // (coins have their own idempotency via referrals/{key} guard doc)
      console.log(`[process-referral] referredBy already set for user: ${newUserId}, skipping batch write`);
      effectiveReferrerId = existingReferredBy;
    } else {
      // ── 5. Atomic batch write ──────────────────────────────────────────────
      const batch = db.batch();

      // Save referredBy on new user
      batch.update(newUserRef, {
        referredBy: referrerId,
        referralCodeUsed: referralCode.trim().toUpperCase(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Increment referrer's totalReferrals
      batch.update(referrerDoc.ref, {
        totalReferrals: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();

      console.log(
        `[process-referral] ✅ referredBy=${referrerId} set for user=${newUserId}, totalReferrals incremented`
      );
    }

    // ── 6. Award referral signup coins immediately ───────────────────────────
    //    Uses existing awardReferralCoinsAdmin with referralType="signup"
    //    Idempotency key: `${effectiveReferrerId}_${newUserId}_signup`
    //    ONE-TIME reward — safe to retry (checked inside awardReferralCoinsAdmin)
    console.log("[process-referral] Referral signup detected");
    console.log("[process-referral] Referrer ID:", effectiveReferrerId);

    try {
      await awardReferralCoinsAdmin({
        referrerId: effectiveReferrerId,
        referredUserId: newUserId,
        referralType: "signup",
        // No relatedBookingId — this is a signup reward, not booking-based
      });
      console.log("[process-referral] Referral signup reward granted");
    } catch (err) {
      // Non-fatal — referredBy is already saved, coins can be retried
      console.error("[process-referral] Referral signup reward failed (non-fatal):", err);
    }

    return NextResponse.json({ success: true, referrerId: effectiveReferrerId });
  } catch (error: any) {
    console.error("[process-referral] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
