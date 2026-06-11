/**
 * DEBUG ONLY — DELETE AFTER DEBUGGING
 *
 * Usage:
 *   GET  /api/admin/loyalty-debug              → lists last 10 bookings
 *   GET  /api/admin/loyalty-debug?bookingId=X  → full loyalty trace for that booking
 *   POST /api/admin/loyalty-debug { bookingId } → same as GET with bookingId
 */
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId") ?? "";
  const userId = searchParams.get("userId") ?? "";

  // If no bookingId, just list recent bookings for reference
  if (!bookingId) {
    return listRecentBookings();
  }

  return runDiagnostic(bookingId, userId);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return runDiagnostic(body.bookingId ?? "", body.userId ?? "");
}

// ── List bookings (no bookingId provided) ────────────────────────────────────
async function listRecentBookings() {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("bookings")
      .orderBy("createdAt", "desc")
      .limit(15)
      .get();

    const rows = snap.docs.map((d) => {
      const b = d.data();
      return {
        id: d.id,
        user: b.userName,
        userId: b.userId,
        status: b.bookingStatus,
        payment: b.paymentStatus,
        coins: b.coinsStatus,
        amount: b.totalAmount,
        omniaVal: b.omniaServiceValue,
        coinsEarned: b.coinsEarned,
      };
    });

    return NextResponse.json({
      tip: `To run full diagnostic: /api/admin/loyalty-debug?bookingId=ID`,
      bookings: rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// ── Full loyalty diagnostic ───────────────────────────────────────────────────
async function runDiagnostic(bookingId: string, userId: string) {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log("[loyalty-debug]", msg);
    logs.push(msg);
  };

  try {
    const db = getAdminDb();
    log("✅ Admin DB initialized");

    // ── 1. Booking snapshot ────────────────────────────────────────────────
    if (bookingId) {
      const bookingSnap = await db.collection("bookings").doc(bookingId).get();
      if (!bookingSnap.exists) {
        log(`❌ Booking NOT found: ${bookingId}`);
      } else {
        const b = bookingSnap.data()!;
        log(`✅ Booking found: ${bookingId}`);
        log(`   bookingStatus    : ${b.bookingStatus}`);
        log(`   paymentStatus    : ${b.paymentStatus}`);
        log(`   coinsStatus      : ${b.coinsStatus}`);
        log(`   coinsEarned      : ${b.coinsEarned}`);
        log(`   userId           : ${b.userId}`);
        log(`   omniaServiceValue: ${b.omniaServiceValue ?? "NOT SET"}`);
        log(`   totalAmount      : ${b.totalAmount}`);
        userId = userId || b.userId;
      }
    }

    // ── 2. User snapshot ───────────────────────────────────────────────────
    if (userId) {
      const userSnap = await db.collection("users").doc(userId).get();
      if (!userSnap.exists) {
        log(`❌ User NOT found: ${userId}`);
      } else {
        const u = userSnap.data()!;
        log(`\n✅ User found: ${userId}`);
        log(`   name                  : ${u.name}`);
        log(`   tier                  : ${u.tier}`);
        log(`   loyaltyPoints         : ${u.loyaltyPoints}`);
        log(`   totalCoinsEarned      : ${u.totalCoinsEarned}`);
        log(`   referredBy            : "${u.referredBy}"`);
        log(`   referralCode          : ${u.referralCode}`);
        log(`   completedTripsThisYear: ${u.completedTripsThisYear}`);
      }
    }

    // ── 3. coinsHistory ────────────────────────────────────────────────────
    if (userId) {
      const histSnap = await db
        .collection("users")
        .doc(userId)
        .collection("coinsHistory")
        .limit(10)
        .get();

      log(`\n📋 coinsHistory (${histSnap.docs.length} records):`);
      if (histSnap.empty) {
        log("   (empty — no coins ever awarded)");
      } else {
        histSnap.docs.forEach((d) => {
          const r = d.data();
          log(`   type=${r.type}  coins=${r.coins}  status=${r.status}`);
        });
      }

      const wbSnap = await db
        .collection("users")
        .doc(userId)
        .collection("coinsHistory")
        .where("type", "==", "welcome_bonus")
        .limit(1)
        .get();
      log(`   welcome_bonus record exists: ${!wbSnap.empty}`);
    }

    // ── 4. Run awardBookingCoinsAdmin directly ─────────────────────────────
    if (bookingId) {
      log(`\n🚀 Calling awardBookingCoinsAdmin("${bookingId}")...`);
      try {
        const { awardBookingCoinsAdmin } = await import("@/lib/services/loyalty.admin");
        await awardBookingCoinsAdmin(bookingId);
        log("✅ awardBookingCoinsAdmin completed without throwing");
      } catch (err: any) {
        log(`❌ awardBookingCoinsAdmin THREW: ${err?.message ?? String(err)}`);
        log(`   Stack: ${String(err?.stack).slice(0, 800)}`);
      }

      // Re-read booking after
      const afterBooking = (await db.collection("bookings").doc(bookingId).get()).data() ?? {};
      log(`\n📦 Booking AFTER award:`);
      log(`   coinsStatus: ${afterBooking.coinsStatus}`);
      log(`   coinsEarned: ${afterBooking.coinsEarned}`);
    }

    // ── 5. User final state ────────────────────────────────────────────────
    if (userId) {
      const afterUser = (await db.collection("users").doc(userId).get()).data() ?? {};
      log(`\n👤 User loyalty AFTER award:`);
      log(`   loyaltyPoints         : ${afterUser.loyaltyPoints}`);
      log(`   totalCoinsEarned      : ${afterUser.totalCoinsEarned}`);
      log(`   tier                  : ${afterUser.tier}`);
      log(`   completedTripsThisYear: ${afterUser.completedTripsThisYear}`);

      const wbAfter = await db
        .collection("users")
        .doc(userId)
        .collection("coinsHistory")
        .where("type", "==", "welcome_bonus")
        .limit(1)
        .get();
      log(`   welcome_bonus awarded : ${!wbAfter.empty}`);
    }

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    console.error("[loyalty-debug] Fatal:", err);
    logs.push(`❌ FATAL: ${err?.message ?? err}`);
    return NextResponse.json({ success: false, logs, error: err?.message }, { status: 500 });
  }
}
