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

      // FIX: Only skip loyalty entirely if coins are ALSO already awarded.
      // Previously this returned alreadyCompleted=true even when coinsStatus
      // was still "pending", causing welcome bonus and referral to never run
      // for bookings that were manually set to "completed" or re-approved.
      const coinsAlreadyAwarded = booking?.coinsStatus === "awarded";
      const statusAlreadyAtTarget =
        booking?.bookingStatus === "completed" ||
        (booking?.bookingStatus === "confirmed" && targetStatus === "confirmed");

      if (statusAlreadyAtTarget && coinsAlreadyAwarded) {
        console.log(`⚠️ Skipped: booking already ${booking?.bookingStatus} with coinsStatus=awarded:`, bookingId);
        alreadyCompleted = true;
        return;
      }

      // If status already matches target but coins not yet awarded:
      // - Skip bookingStatus update (already correct)
      // - STILL force paymentStatus = "paid" so awardBookingCoinsAdmin can
      //   pass its paymentStatus check. Without this, loyalty was silently
      //   skipped for any booking manually set to "completed" in Firestore.
      if (statusAlreadyAtTarget) {
        console.log(`ℹ️ Status already ${booking?.bookingStatus} but coinsStatus=${booking?.coinsStatus} — forcing paymentStatus=paid, running loyalty`);
        tx.update(bookingRef, {
          paymentStatus: "paid",
          updatedAt: FieldValue.serverTimestamp(),
        });
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
    // awardBookingCoinsAdmin handles: booking coins + welcome bonus + referral + tier.
    console.log("🎯 Awarding coins for booking:", bookingId);
    try {
      await awardBookingCoinsAdmin(bookingId);
      console.log("✅ awardBookingCoinsAdmin completed for booking:", bookingId);
    } catch (err) {
      console.error("❌ awardBookingCoinsAdmin failed:", err);
      // Non-fatal — admin can retry
    }

    // 3. REFERRAL SAFETY FALLBACK — only runs if awardBookingCoinsAdmin skipped
    // referral (e.g. coinsStatus was already "awarded" from a prior run that
    // failed after booking coins but before referral).
    try {
      const bookingSnap = await bookingRef.get();
      const bookingData = bookingSnap.data();
      if (bookingData) {
        const userId = bookingData.userId;
        // referredBy may be on the booking doc (legacy) or only on the user doc
        const bookingReferredBy: string = bookingData.referredBy ?? "";

        if (!bookingReferredBy && userId) {
          const userSnap = await db.collection("users").doc(userId).get();
          const userData = userSnap.data() ?? {};
          if (userData.referredBy && userData.referredBy !== "") {
            console.log("[approve-booking] Safety-fallback: calling awardReferralCoinsAdmin for referrer:", userData.referredBy);
            await awardReferralCoinsAdmin({
              referrerId: userData.referredBy,
              referredUserId: userId,
              referralType: "individual",
              relatedBookingId: bookingId,
            });
          }
        } else if (bookingReferredBy) {
          console.log("[approve-booking] Safety-fallback: calling awardReferralCoinsAdmin from booking.referredBy:", bookingReferredBy);
          await awardReferralCoinsAdmin({
            referrerId: bookingReferredBy,
            referredUserId: bookingData.userId,
            referralType: "individual",
            relatedBookingId: bookingId,
          });
        }
      }
    } catch (err) {
      console.error("[approve-booking] Referral safety-fallback failed (non-fatal):", err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[approve-booking] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
