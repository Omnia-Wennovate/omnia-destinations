import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  awardBookingCoinsAdmin,
  awardReferralCoinsAdmin,
} from "@/lib/services/loyalty.admin";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, adminId, targetStatus = "completed" } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    console.log(`🔥 Admin approval initiated for booking: ${bookingId} with targetStatus: ${targetStatus}`);

    const db = getAdminDb();
    const bookingRef = db.collection("bookings").doc(bookingId);

    // 1. UPDATE booking document atomically
    let alreadyCompleted = false;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) {
        throw new Error("Booking not found");
      }

      const booking = snap.data();
      // If the booking is already in the target status or higher (completed), skip
      if (booking?.bookingStatus === "completed" || (booking?.bookingStatus === "confirmed" && targetStatus === "confirmed")) {
        console.log(`⚠️ Skipped: booking already ${booking?.bookingStatus}:`, bookingId);
        alreadyCompleted = true;
        return;
      }

      tx.update(bookingRef, {
        bookingStatus: targetStatus,
        paymentStatus: "paid",
        approvedBy: adminId || "admin",
        approvedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    if (alreadyCompleted) {
      return NextResponse.json({ success: true, alreadyCompleted: true });
    }

    // 2. LOYALTY TRIGGER — runs AFTER status is committed
    console.log("🎯 Awarding coins for booking:", bookingId);
    try {
      await awardBookingCoinsAdmin(bookingId);
      console.log("✅ Coins awarded successfully for booking:", bookingId);
    } catch (err) {
      console.error("❌ awardBookingCoinsAdmin failed:", err);
      // Non-fatal — admin can retry
    }

    // 3. REFERRAL COINS — award if the booking user was referred
    try {
      const bookingSnap = await bookingRef.get();
      const bookingData = bookingSnap.data();
      if (bookingData) {
        const userId = bookingData.userId;
        const referredBy: string = bookingData.referredBy ?? "";

        if (!referredBy && userId) {
          // Check the user doc for referredBy field
          const userSnap = await db.collection("users").doc(userId).get();
          const userData = userSnap.data() ?? {};
          if (userData.referredBy) {
            await awardReferralCoinsAdmin({
              referrerId: userData.referredBy,
              referredUserId: userId,
              referralType: "individual",
              relatedBookingId: bookingId,
            });
          }
        } else if (referredBy) {
          await awardReferralCoinsAdmin({
            referrerId: referredBy,
            referredUserId: bookingData.userId,
            referralType: "individual",
            relatedBookingId: bookingId,
          });
        }
      }
    } catch (err) {
      console.error("[approve-booking] awardReferralCoinsAdmin failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[approve-booking] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
