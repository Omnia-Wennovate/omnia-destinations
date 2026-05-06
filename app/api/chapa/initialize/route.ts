/**
 * /api/chapa/initialize — Initialises a Chapa payment session.
 *
 * Security fixes applied:
 *  1. IGNORES the client-provided `amount` entirely.
 *  2. Fetches booking.totalAmount from Firestore using tx_ref (booking ID) to validate the booking.
 *  3. Validates that the booking exists and is not already paid before initialising.
 *  4. Stores tx_ref on the booking document so verify-payment can look it up.
 *  5. CHAPA_SECRET_KEY runtime presence check.
 *
 * NOTE: The amount charged via Chapa is FIXED at 10 ETB (trigger payment).
 *       The real package value (booking.totalAmount) is preserved in Firestore
 *       and used for loyalty points and all internal business logic.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // NOTE: `amount` from the body is IGNORED — we fetch from Firestore.
    const { email, first_name, last_name, tx_ref } = body as Record<string, string>;

    // ── Input guard ───────────────────────────────────────────────────────────
    if (!email || !first_name || !tx_ref) {
      return NextResponse.json(
        { message: "Missing required fields: email, first_name, tx_ref" },
        { status: 400 }
      );
    }

    if (typeof tx_ref !== "string" || !/^[a-zA-Z0-9_-]{10,128}$/.test(tx_ref)) {
      return NextResponse.json({ message: "Invalid tx_ref format" }, { status: 400 });
    }

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
    if (!chapaSecretKey) {
      console.error("[chapa/initialize] CRITICAL: CHAPA_SECRET_KEY is not set");
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    // ── Fetch booking from Firestore — tx_ref is the booking document ID ─────
    const db = getAdminDb();
    const bookingSnap = await db.collection("bookings").doc(tx_ref).get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    const bookingData = bookingSnap.data() as Record<string, any>;

    // Guard: don't re-initialise a paid or cancelled booking
    if (bookingData.paymentStatus === "paid") {
      return NextResponse.json({ message: "Booking already paid" }, { status: 409 });
    }
    if (bookingData.bookingStatus === "cancelled") {
      return NextResponse.json({ message: "Booking has been cancelled" }, { status: 409 });
    }

    // ── Validate that the booking has a valid amount (used for loyalty, NOT for Chapa) ─
    const trustedAmount: number = Number(bookingData.totalAmount ?? 0);
    if (trustedAmount <= 0) {
      return NextResponse.json({ message: "Invalid booking amount" }, { status: 400 });
    }

    // ── Fixed Chapa charge: 10 ETB trigger payment ───────────────────────────
    // The real package value (trustedAmount) stays in Firestore for loyalty/business logic.
    const CHAPA_TRIGGER_AMOUNT = 10;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const chapaPayload = {
      amount: CHAPA_TRIGGER_AMOUNT.toString(),   // fixed 10 ETB trigger payment
      currency: "ETB",
      email,
      first_name,
      last_name: last_name || "",
      tx_ref,
      callback_url: `${appUrl}/api/verify-payment?tx_ref=${encodeURIComponent(tx_ref)}`,
      return_url: `${appUrl}/api/verify-payment?tx_ref=${encodeURIComponent(tx_ref)}`,
      customization: {
        title: "Omnia Booking",
        description: "Payment for booking",
      },
    };

    const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chapaPayload),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await response.json();

    if (data.status === "success") {
      // Store tx_ref on the booking so verify-payment can query by it later
      await db.collection("bookings").doc(tx_ref).update({
        tx_ref,
        paymentInitiatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        message: "Payment initialized",
        checkoutUrl: data.data.checkout_url,
      });
    } else {
      console.error("[chapa/initialize] Chapa error:", data.message);
      return NextResponse.json(
        { message: data.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[chapa/initialize] Error:", error?.message ?? error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
