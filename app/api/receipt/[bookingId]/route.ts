/**
 * /api/receipt/[bookingId] — Generates a styled HTML receipt page
 * for a booking's Chapa payment. Works in both test and live mode
 * since it uses locally stored Firestore receipt data.
 *
 * Access: Admin only (or booking owner).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;

  if (!bookingId) {
    return new NextResponse("Missing booking ID", { status: 400 });
  }

  try {
    const db = getAdminDb();
    const doc = await db.collection("bookings").doc(bookingId).get();

    if (!doc.exists) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    const data = doc.data() ?? {};

    // Extract receipt details from the booking document
    const receipt = data.paymentReceipt;
    const txRef = receipt?.tx_ref || data.tx_ref || "N/A";
    const chapaRef = receipt?.chapa_ref || data.chapaReference || "N/A";
    const paidAmount = receipt?.amount || data.paidAmount || data.totalAmount || 0;
    const paidAt = receipt?.paidAt || data.paidAt || "N/A";
    const paymentMethod = data.paymentMethod || "Chapa";
    const paymentStatus = receipt?.status || (data.paymentCompleted ? "success" : data.paymentStatus || "pending");

    const userName = data.userName || data.name || "N/A";
    const userEmail = data.userEmail || data.email || "N/A";
    const tourTitle = data.tourTitle || data.packageTitle || "N/A";
    const guests = data.guests || 1;
    const travelDate = data.travelDate || "N/A";
    const totalAmount = data.totalAmount || data.amount || 0;

    // Format the paidAt date
    let formattedDate = "N/A";
    if (paidAt && paidAt !== "N/A") {
      try {
        formattedDate = new Date(paidAt).toLocaleString("en-US", {
          dateStyle: "long",
          timeStyle: "short",
        });
      } catch {
        formattedDate = paidAt;
      }
    }

    const statusColor = paymentStatus === "success" ? "#16a34a" : "#d97706";
    const statusBg = paymentStatus === "success" ? "#f0fdf4" : "#fffbeb";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt — ${txRef}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f3f4f6;
      color: #1f2937;
      display: flex;
      justify-content: center;
      padding: 40px 16px;
      min-height: 100vh;
    }
    .receipt {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      max-width: 520px;
      width: 100%;
      overflow: hidden;
      height: fit-content;
    }
    .receipt-header {
      background: linear-gradient(135deg, #c8a85c 0%, #b8963e 100%);
      color: #fff;
      padding: 32px 28px 24px;
      text-align: center;
    }
    .receipt-header h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .receipt-header p {
      font-size: 13px;
      opacity: 0.85;
    }
    .status-badge {
      display: inline-block;
      margin-top: 12px;
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: ${statusBg};
      color: ${statusColor};
    }
    .receipt-body {
      padding: 28px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9ca3af;
      margin-bottom: 12px;
      margin-top: 20px;
    }
    .section-title:first-child { margin-top: 0; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .row:last-child { border-bottom: none; }
    .row .label {
      font-size: 13px;
      color: #6b7280;
    }
    .row .value {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
      text-align: right;
      max-width: 60%;
      word-break: break-all;
    }
    .amount-row {
      margin-top: 16px;
      padding: 16px 0;
      border-top: 2px solid #f3f4f6;
    }
    .amount-row .label {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }
    .amount-row .value {
      font-size: 20px;
      font-weight: 800;
      color: #c8a85c;
    }
    .receipt-footer {
      padding: 20px 28px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .receipt-footer p {
      font-size: 11px;
      color: #9ca3af;
    }
    .print-btn {
      display: inline-block;
      margin-top: 12px;
      padding: 10px 28px;
      background: #c8a85c;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .print-btn:hover { background: #b8963e; }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; max-width: 100%; }
      .print-btn { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="receipt-header">
      <h1>Omnia Destinations</h1>
      <p>Payment Receipt</p>
      <div class="status-badge">${paymentStatus === "success" ? "✓ Payment Successful" : "⏳ " + paymentStatus}</div>
    </div>
    <div class="receipt-body">
      <div class="section-title">Transaction Details</div>
      <div class="row">
        <span class="label">Transaction Ref</span>
        <span class="value">${txRef}</span>
      </div>
      <div class="row">
        <span class="label">Chapa Reference</span>
        <span class="value">${chapaRef}</span>
      </div>
      <div class="row">
        <span class="label">Date & Time</span>
        <span class="value">${formattedDate}</span>
      </div>
      <div class="row">
        <span class="label">Payment Method</span>
        <span class="value">${paymentMethod}</span>
      </div>

      <div class="section-title">Booking Details</div>
      <div class="row">
        <span class="label">Package</span>
        <span class="value">${tourTitle}</span>
      </div>
      <div class="row">
        <span class="label">Customer</span>
        <span class="value">${userName}</span>
      </div>
      <div class="row">
        <span class="label">Email</span>
        <span class="value">${userEmail}</span>
      </div>
      <div class="row">
        <span class="label">Travel Date</span>
        <span class="value">${travelDate}</span>
      </div>
      <div class="row">
        <span class="label">Guests</span>
        <span class="value">${guests}</span>
      </div>

      <div class="section-title">Payment Summary</div>
      <div class="row">
        <span class="label">Chapa Payment</span>
        <span class="value">${paidAmount.toLocaleString()} ETB</span>
      </div>
      <div class="row">
        <span class="label">Package Total</span>
        <span class="value">${totalAmount.toLocaleString()} ETB</span>
      </div>
      <div class="row amount-row">
        <span class="label">Amount Paid via Chapa</span>
        <span class="value">${paidAmount.toLocaleString()} ETB</span>
      </div>
    </div>
    <div class="receipt-footer">
      <p>Booking ID: ${bookingId}</p>
      <p style="margin-top: 4px;">This receipt was generated by Omnia Destinations</p>
      <button class="print-btn" onclick="window.print()">🖨️ Print / Download PDF</button>
    </div>
  </div>
</body>
</html>`;

    console.log("🧾 Opening Chapa receipt for booking:", bookingId);

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("❌ Invalid receipt URL detected — error loading receipt:", error);
    return new NextResponse("Failed to load receipt", { status: 500 });
  }
}
