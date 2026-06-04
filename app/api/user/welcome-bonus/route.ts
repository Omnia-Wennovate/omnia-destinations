/**
 * POST /api/user/welcome-bonus
 *
 * Awards 100 welcome coins to a user on their FIRST completed booking.
 * Uses Admin SDK (bypasses Firestore security rules).
 * Idempotent — safe to call multiple times.
 *
 * NOTE: This route should NOT be called during signup/registration.
 * Welcome coins are awarded only after the first booking is completed,
 * handled by awardWelcomeBonusAdmin() in loyalty.admin.ts.
 *
 * This route is kept as a fallback/manual trigger only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COINS_EXPIRY_MONTHS, WELCOME_BONUS_COINS } from "@/lib/services/loyalty.service";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(userId);

    // ── Idempotency: skip if welcome bonus already awarded ───────────────────
    const historySnap = await db
      .collection("users")
      .doc(userId)
      .collection("coinsHistory")
      .where("type", "==", "welcome_bonus")
      .limit(1)
      .get();

    if (!historySnap.empty) {
      console.log("[welcome-bonus] Already awarded for:", userId);
      return NextResponse.json({ success: true, alreadyAwarded: true });
    }

    // ── Verify user exists ───────────────────────────────────────────────────
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Compute expiry ───────────────────────────────────────────────────────
    const exp = new Date();
    exp.setMonth(exp.getMonth() + COINS_EXPIRY_MONTHS);

    const txData = {
      userId,
      coins: WELCOME_BONUS_COINS,
      amount: WELCOME_BONUS_COINS,
      type: "welcome_bonus",
      affectsTier: false, // welcome coins are a gift, not a tier-qualifying earn
      relatedBookingId: null,
      reason: "Welcome bonus — thank you for your first booking with Omnia!",
      multiplierApplied: 1,
      tierAtTime: "Hope",
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: exp.toISOString(),
      status: "active",
    };

    // ── Atomic batch write ───────────────────────────────────────────────────
    const batch = db.batch();

    const histRef = db
      .collection("users")
      .doc(userId)
      .collection("coinsHistory")
      .doc();
    batch.set(histRef, txData);

    const loyaltyRef = db.collection("loyaltyTransactions").doc();
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

    console.log("[welcome-bonus] ✅ 100 coins awarded to:", userId);
    return NextResponse.json({ success: true, coins: WELCOME_BONUS_COINS });
  } catch (error: any) {
    console.error("[welcome-bonus] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
