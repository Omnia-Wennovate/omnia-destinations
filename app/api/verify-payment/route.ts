import { NextRequest, NextResponse } from "next/server";
import { updateBookingStatus, updatePaymentStatus } from "@/lib/services/bookings.service";

export async function GET(req: NextRequest) {
  const tx_ref = req.nextUrl.searchParams.get("tx_ref");
  
  if (!tx_ref) {
    return NextResponse.redirect(new URL('/dashboard?error=Missing+transaction+reference', req.url));
  }
  
  try {
    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
    
    if (!chapaSecretKey) {
      console.error("CHAPA_SECRET_KEY is not defined");
      return NextResponse.redirect(new URL('/dashboard?payment=error', req.url));
    }

    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: {
        "Authorization": `Bearer ${chapaSecretKey}`
      }
    });
    
    const data = await response.json();
    
    if (data.status === "success" && data.data.status === "success") {
      // Transaction was successful.
      // Update payment status to paid
      await updatePaymentStatus(tx_ref, "paid");
      
      // Update booking status to completed.
      // This will also trigger `awardBookingCoins(bookingId)` securely
      // since now both paymentStatus="paid" and bookingStatus="completed".
      await updateBookingStatus(tx_ref, "completed");
      
      return NextResponse.redirect(new URL('/dashboard?payment=success', req.url));
    } else {
      // Payment failed or is still pending
      return NextResponse.redirect(new URL('/dashboard?payment=failed', req.url));
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(new URL('/dashboard?payment=error', req.url));
  }
}
