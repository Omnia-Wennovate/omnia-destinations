import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function getAdminApp() {
  const existing = getApps().find((a) => a.name === "admin-app");
  if (existing) return existing;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, "admin-app");
}

const db = getFirestore(getAdminApp());

// Simplified version of the loyalty.admin.ts logic since we can't import TS
async function testDirectApprove(bookingId) {
  const bookingRef = db.collection("bookings").doc(bookingId);
  
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef);
    if (!snap.exists) throw new Error("Booking not found");

    tx.update(bookingRef, {
      bookingStatus: "completed",
      paymentStatus: "paid",
      approvedBy: "admin",
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  
  console.log("Updated booking status to 'completed'. Now we would run awardBookingCoinsAdmin...");
  
  // Now run the actual logic
  await db.runTransaction(async (tx) => {
    const bookingSnap = await tx.get(bookingRef);
    const booking = bookingSnap.data();

    const userId = booking.userId;
    let value = Number(booking.omniaServiceValue ?? 0);
    if (value <= 0) {
      const totalAmount = Number(booking.totalAmount ?? booking.amount ?? 0);
      value = Math.floor(totalAmount * 0.10);
      console.warn("⚠️ omniaServiceValue was 0/missing — computed:", value);
    }

    const coins = Math.floor(value / 100); // Hope tier = 1.0x
    console.log(`Calculating coins: value=${value}, coins=${coins}`);

    const userRef = db.collection("users").doc(userId);
    
    // Increment points
    tx.set(
      userRef,
      {
        loyaltyPoints: FieldValue.increment(coins),
        totalCoinsEarned: FieldValue.increment(coins),
        tierCoins: FieldValue.increment(coins),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    
    // Mark as awarded
    tx.update(bookingRef, {
      coinsStatus: "awarded",
      coinsEarned: coins,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    console.log(`Awarded ${coins} coins to user ${userId}`);
  });
}

testDirectApprove("h9TWkWMrB0wfSzuIioTN").catch(console.error);
