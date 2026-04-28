import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  const existing = getApps().find((a) => a.name === "admin-app");
  if (existing) return existing;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, "admin-app");
}

const db = getFirestore(getAdminApp());

async function run() {
  const snap = await db.collection("bookings").orderBy("createdAt", "desc").limit(5).get();
  if (snap.empty) {
    console.log("No bookings found");
    return;
  }
  
  snap.docs.forEach((doc, i) => {
    const b = doc.data();
    console.log(`Booking ${i}:`, {
      id: doc.id,
      packageTitle: b.packageTitle,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      coinsStatus: b.coinsStatus,
      coinsEarned: b.coinsEarned,
      omniaServiceValue: b.omniaServiceValue,
      totalAmount: b.totalAmount
    });
  });
}

run().catch(console.error);
