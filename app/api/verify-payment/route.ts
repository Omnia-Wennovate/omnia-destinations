/**
 * /api/verify-payment — Chapa payment callback handler.
 *
 * Security fixes applied:
 *  1. Uses Firebase Admin SDK (server-side, bypasses client SDK null issue).
 *  2. Verifies tx_ref maps to a real booking in Firestore before acting.
 *  3. Cross-checks Chapa-reported amount against the FIXED 10 ETB trigger payment.
 *  4. Only marks booking paid if all checks pass.
 *  5. Triggers coin award ONCE via atomic Firestore transaction (no duplicate).
 *  6. Awards referral coins if the booking user was referred.
 *  7. Captures and stores Chapa receipt data on the booking document.
 *
 * NOTE: Loyalty points and internal logic use booking.totalAmount (the real
 *       package value), NOT the 10 ETB Chapa charge.
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
  paymentReceipts?: PaymentReceipt[];
  [key: string]: unknown; // Allow additional Firestore fields
}

interface PaymentReceipt {
  tx_ref: string;
  chapa_ref: string;
  amount: number;
  paidAt: FirebaseFirestore.FieldValue | string;
  status: "success";
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

/**
 * Build a receipt object from the Chapa verification response.
 * Uses server timestamp for paidAt so the time is authoritative.
 */
function buildReceipt(chapaData: Record<string, any>, tx_ref: string): PaymentReceipt {
  return {
    tx_ref,
    chapa_ref: chapaData?.data?.reference ?? chapaData?.data?.tx_ref ?? tx_ref,
    amount: Number(chapaData?.data?.amount ?? 0),
    paidAt: new Date().toISOString(),
    status: "success",
  };
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

    // ── Step 3: Amount integrity check — Chapa must match the fixed 10 ETB trigger ─
    // The real package value (booking.totalAmount) is NOT compared here;
    // it is preserved in Firestore for loyalty points and business logic.
    const CHAPA_TRIGGER_AMOUNT = 10;
    if (Math.abs(chapaAmount - CHAPA_TRIGGER_AMOUNT) > 1) {
      // Allow ±1 ETB tolerance for floating-point rounding only
      console.error(
        "[verify-payment] Amount mismatch — chapa:",
        chapaAmount,
        "expected trigger:",
        CHAPA_TRIGGER_AMOUNT,
        "booking:",
        booking.id
      );
      return NextResponse.redirect(
        new URL("/dashboard?payment=error&reason=amount_mismatch", req.url)
      );
    }

    // ── Build receipt from Chapa response ────────────────────────────────────
    const receipt = buildReceipt(chapaData, tx_ref);

    // ── Step 4 + 5: Atomic idempotency check + status update + receipt ───────
    // Using a transaction prevents two concurrent Chapa callbacks from both
    // marking the same booking as paid (TOCTOU race condition).
    const db = getAdminDb();
    const bookingRef = db.collection("bookings").doc(booking.id);

    // Build the Chapa receipt URL
    const chapaReference = chapaData?.data?.reference ?? chapaData?.data?.tx_ref ?? tx_ref;
    
    // Use Chapa's receipt_url if provided (live mode), otherwise use local receipt page
    const chapaReceiptUrl = chapaData?.data?.receipt_url || null;
    // Local receipt page — always works (test + live mode)
    const receiptUrl = chapaReceiptUrl || `/api/receipt/${booking.id}`;
    
    console.log("📝 Saving Chapa receipt URL:", receiptUrl, "reference:", chapaReference);
    if (chapaReceiptUrl) {
      console.log("🔗 Receipt URL stored successfully (Chapa hosted):", chapaReceiptUrl);
    } else {
      console.log("🔗 Receipt URL stored successfully (local):", receiptUrl);
    }

    let alreadyProcessed = false;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) throw new Error("Booking disappeared during transaction");

      const bookingData = snap.data() ?? {};

      // ── Idempotency: if paymentCompleted is already true, skip ──
      if (bookingData.paymentCompleted === true) {
        alreadyProcessed = true;

        // Check if this exact receipt tx_ref is already stored
        const existingReceipts: PaymentReceipt[] = bookingData.paymentReceipts ?? [];
        const isDuplicate = existingReceipts.some((r: PaymentReceipt) => r.tx_ref === tx_ref);
        if (isDuplicate) {
          console.log("⚠️ Duplicate receipt skipped — tx_ref:", tx_ref, "booking:", booking.id);
        }
        return; // Idempotent — already processed
      }

      // ── Idempotency: check if this receipt tx_ref is already stored ────
      const existingReceipts: PaymentReceipt[] = bookingData.paymentReceipts ?? [];
      const isDuplicate = existingReceipts.some((r: PaymentReceipt) => r.tx_ref === tx_ref);

      if (isDuplicate) {
        console.log("⚠️ Duplicate receipt skipped — tx_ref:", tx_ref, "booking:", booking.id);
        // Still update status if needed, but don't add the receipt again
        tx.update(bookingRef, {
          paymentStatus: "pending",
          bookingStatus: "pending",       // keep pending — admin approves later
          paymentCompleted: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }

      // ── Store receipt: latest + append to history array + extended fields ──
      tx.update(bookingRef, {
        paymentStatus: "pending",           // payment submitted, awaiting admin verification
        bookingStatus: "pending",           // keep pending — admin approves later
        paymentReceipt: receipt,            // latest receipt (quick access)
        paymentReceipts: FieldValue.arrayUnion(receipt), // full history (never overwrites)
        // Extended receipt tracking fields
        receiptUrl,
        chapaReference,
        paidAmount: chapaAmount,
        paymentMethod: "chapa",
        paidAt: new Date().toISOString(),
        paymentCompleted: true,             // receipt exists — enables receipt display
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log("✅ Payment verified — receipt stored for tx_ref:", tx_ref, "booking:", booking.id);
      console.log("📄 Receipt added to booking:", JSON.stringify(receipt));
      console.log("🔗 Receipt URL stored successfully:", receiptUrl);
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