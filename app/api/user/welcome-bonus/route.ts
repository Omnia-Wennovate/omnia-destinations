/**
 * POST /api/user/welcome-bonus
 *
 * Awards 1,000 welcome coins to a newly registered user.
 * Uses Admin SDK (bypasses Firestore security rules).
 * Idempotent — safe to call multiple times.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const WELCOME_COINS = 1_000;
const COINS_EXPIRY_MONTHS = 12;

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
      coins: WELCOME_COINS,
      amount: WELCOME_COINS,
      type: "welcome_bonus",
      affectsTier: true,
      reason: "Welcome bonus — thank you for joining Omnia!",
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
        loyaltyPoints: FieldValue.increment(WELCOME_COINS),
        totalCoinsEarned: FieldValue.increment(WELCOME_COINS),
        tierCoins: FieldValue.increment(WELCOME_COINS),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    console.log("[welcome-bonus] ✅ 1,000 coins awarded to:", userId);
    return NextResponse.json({ success: true, coins: WELCOME_COINS });
  } catch (error: any) {
    console.error("[welcome-bonus] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
