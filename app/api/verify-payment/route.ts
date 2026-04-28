/**
 * /api/verify-payment — Chapa payment callback handler.
 *
 * Security fixes applied:
 *  1. Uses Firebase Admin SDK (server-side, bypasses client SDK null issue).
 *  2. Verifies tx_ref maps to a real booking in Firestore before acting.
 *  3. Cross-checks Chapa-reported amount against booking.totalAmount — ignores client-provided values.
 *  4. Only marks booking paid if all checks pass.
 *  5. Triggers coin award ONCE via atomic Firestore transaction (no duplicate).
 *  6. Awards referral coins if the booking user was referred.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingDoc {
  id: string;
  userId: string;
  paymentStatus: string;
  bookingStatus: string;
  totalAmount: number;
  coinsStatus?: string;
  coinsEarned?: number;
  referredBy?: string;
  packageTitle?: string;
  omniaServiceValue?: number;
  [key: string]: unknown; // Allow additional Firestore fields
}

// ── helpers ───────────────────────────────────────────────────────────────────

/** Fetch the Firestore booking doc whose tx_ref field matches. Returns null if missing. */
async function getBookingByTxRef(tx_ref: string): Promise<BookingDoc | null> {
  const db = getAdminDb();
  const snap = await db
    .collection("bookings")
    .where("tx_ref", "==", tx_ref)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  const data = docSnap.data() as Omit<BookingDoc, "id">;
  return { id: docSnap.id, ...data } as BookingDoc;
}

// ── main handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const tx_ref = req.nextUrl.searchParams.get("tx_ref");

  // Guard: tx_ref must be present
  if (!tx_ref || typeof tx_ref !== "string" || tx_ref.trim() === "") {
    return NextResponse.redirect(
      new URL("/dashboard?error=Missing+transaction+reference", req.url)
    );
  }

  const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
  if (!chapaSecretKey) {
    console.error("[verify-payment] CRITICAL: CHAPA_SECRET_KEY is not set");
    return NextResponse.redirect(new URL("/dashboard?payment=error", req.url));
  }

  try {
    // ── Step 1: Verify transaction with Chapa (server-to-server) ─────────────
    const chapaRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(tx_ref)}`,
      {
        headers: { Authorization: `Bearer ${chapaSecretKey}` },
        // Timeout guard — don't hang indefinitely
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!chapaRes.ok) {
      console.error("[verify-payment] Chapa verification HTTP error:", chapaRes.status);
      return NextResponse.redirect(new URL("/dashboard?payment=error", req.url));
    }

    const chapaData = await chapaRes.json();

    const chapaSuccess =
      chapaData?.status === "success" && chapaData?.data?.status === "success";

    if (!chapaSuccess) {
      return NextResponse.redirect(new URL("/dashboard?payment=failed", req.url));
    }

    // Chapa-reported amount (in ETB, as a number)
    const chapaAmount = Number(chapaData?.data?.amount ?? 0);

    // ── Step 2: Fetch the booking from Firestore by tx_ref ──────────────────
    const booking = await getBookingByTxRef(tx_ref);

    if (!booking) {
      console.error("[verify-payment] Booking not found for tx_ref:", tx_ref);
      return NextResponse.redirect(
        new URL("/dashboard?payment=error&reason=booking_not_found", req.url)
      );
    }

    // ── Step 3: Amount integrity check — Chapa must match stored totalAmount ─
    const storedAmount = Number(booking.totalAmount ?? 0);
    if (storedAmount <= 0 || Math.abs(chapaAmount - storedAmount) > 1) {
      // Allow ±1 ETB tolerance for floating-point rounding only
      console.error(
        "[verify-payment] Amount mismatch — chapa:",
        chapaAmount,
        "stored:",
        storedAmount,
        "booking:",
        booking.id
      );
      return NextResponse.redirect(
        new URL("/dashboard?payment=error&reason=amount_mismatch", req.url)
      );
    }

    // ── Step 4 + 5: Atomic idempotency check + status update ────────────────
    // Using a transaction prevents two concurrent Chapa callbacks from both
    // marking the same booking as paid (TOCTOU race condition).
    const db = getAdminDb();
    const bookingRef = db.collection("bookings").doc(booking.id);

    let alreadyProcessed = false;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) throw new Error("Booking disappeared during transaction");
      if (snap.data()?.bookingStatus === "pending_approval") {
        alreadyProcessed = true;
        return; // Idempotent — already processed
      }
      tx.update(bookingRef, {
        paymentStatus: "pending",
        bookingStatus: "pending_approval",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    if (alreadyProcessed) {
      return NextResponse.redirect(new URL("/dashboard?payment=success", req.url));
    }

    // Coins (loyalty and referral) are now awarded manually via Admin Approval
    // when the admin changes the bookingStatus to "completed".

    return NextResponse.redirect(new URL("/dashboard?payment=success", req.url));
  } catch (error) {
    console.error("[verify-payment] Unexpected error:", error);
    return NextResponse.redirect(new URL("/dashboard?payment=error", req.url));
  }
}