import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";
import { awardBookingCoins, reverseBookingCoins, awardReferralCoins } from "@/lib/services/loyalty.service";
import { getPackageById } from "@/lib/services/packages.service";
import { logger } from "@/lib/logger";

export interface FirestoreBooking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  phone?: string;
  packageId: string;
  packageTitle: string;
  tourId?: string;
  tourTitle?: string;
  bookingDate: any;
  travelDate: string;
  durationDays?: number;
  guests: number;
  roomType: "single" | "sharing";
  pricePerPerson: number;
  totalAmount: number;
  amount?: number;
  // Loyalty fields
  omniaServiceValue: number;  // ETB value of Omnia-managed services only
  coinsEarned: number;        // coins awarded on completion
  coinsStatus: "pending" | "awarded" | "reversed";
  paymentStatus: "paid" | "pending" | "refunded" | "failed";
  bookingStatus: "confirmed" | "pending" | "cancelled" | "completed";
  refundNote?: string;
  specialRequests?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CreateBookingData {
  userId: string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageTitle: string;
  travelDate: string;
  guests: number;
  roomType: "single" | "sharing";
  pricePerPerson: number;
  totalAmount: number;
  omniaServiceValue?: number; // defaults to 0 if not provided
  specialRequests?: string;
  phone?: string; // full phone number with country code e.g. +251974108003
}

// Create a new booking
export async function createBooking(data: CreateBookingData): Promise<string> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  
  if (!db || !modules.firestore) {
    throw new Error("Database not initialized");
  }

  const { collection, addDoc, serverTimestamp } = modules.firestore;

  // 1. Validate package and dates
  const pkg = await getPackageById(data.packageId);
  if (!pkg) {
    throw new Error("Package not found.");
  }

  if (pkg.availableFrom && data.travelDate < pkg.availableFrom) {
    throw new Error("Selected date is outside the package availability.");
  }
  if (pkg.availableUntil && data.travelDate > pkg.availableUntil) {
    throw new Error("Selected date is outside the package availability.");
  }

  // 1a. Enforce booking people limit (1–10)
  if (!Number.isInteger(data.guests) || data.guests < 1 || data.guests > 10) {
    throw new Error("You can only book between 1 and 10 people per package.");
  }

  // 1b. Validate specialRequests length
  if (data.specialRequests && data.specialRequests.length > 1000) {
    throw new Error("Special requests cannot exceed 1,000 characters.");
  }

  // 1c. Enforce per-package booking limit (max 10 bookings per user per package)
  // Uses a Firestore transaction snapshot to prevent race conditions
  const { query, where, getDocs, runTransaction, doc: firestoreDoc } = modules.firestore;
  const packageBookingsSnap = await getDocs(
    query(
      collection(db, "bookings"),
      where("userId", "==", data.userId),
      where("packageId", "==", data.packageId)
    )
  );
  const activePackageBookings = packageBookingsSnap.docs.filter(
    (d: any) => d.data().bookingStatus !== "cancelled"
  );
  if (activePackageBookings.length >= 10) {
    throw new Error(
      "You have reached the maximum booking limit (10) for this package."
    );
  }

  // 2. Active booking cap + overlap detection
  // Fetch all user bookings once (reuse for both checks)
  const allUserBookingsSnap = await getDocs(
    query(
      collection(db, "bookings"),
      where("userId", "==", data.userId)
    )
  );

  // Filter to only active bookings (exclude cancelled & rejected)
  const EXCLUDED_STATUSES = ["cancelled", "rejected"];
  const activeBookings = allUserBookingsSnap.docs.filter((d: any) => {
    const status = d.data().bookingStatus;
    return !EXCLUDED_STATUSES.includes(status);
  });

  // 2a. Enforce global cap: max 35 active bookings per user
  if (activeBookings.length >= 35) {
    throw new Error(
      "You have reached the maximum booking limit (35). Please cancel an existing booking before making a new one."
    );
  }

  // Compute omniaServiceValue server-side from trusted package data — NEVER use client-provided value.
  // 10% of the total booking value (guests × price from Firestore).
  const serverPricePerPerson =
    data.roomType === "sharing"
      ? ((pkg as any).sharingPrice ?? (pkg as any).pricePerPerson ?? data.pricePerPerson)
      : ((pkg as any).singlePrice  ?? (pkg as any).pricePerPerson ?? data.pricePerPerson);
  const serverTotalAmount   = serverPricePerPerson * data.guests;
  const omniaServiceValue   = Math.floor(serverTotalAmount * 0.10);

  const bookingDoc = {
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    phone: data.phone || "",
    packageId: data.packageId,
    packageTitle: data.packageTitle,
    tourId: data.packageId,
    tourTitle: data.packageTitle,
    bookingDate: serverTimestamp(),
    travelDate: data.travelDate,
    durationDays: pkg.duration > 0 ? pkg.duration : 1,
    guests: data.guests,
    roomType: data.roomType,
    pricePerPerson: serverPricePerPerson,
    totalAmount: serverTotalAmount,
    amount: serverTotalAmount,
    omniaServiceValue,          // server-computed, not client-provided
    coinsEarned: 0,
    coinsStatus: "pending" as const,
    paymentStatus: "pending" as const,
    bookingStatus: "pending" as const,
    specialRequests: data.specialRequests || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "bookings"), bookingDoc);
  return docRef.id;
}

// Get bookings for a specific user
export async function getUserBookings(userId: string): Promise<FirestoreBooking[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  
  if (!db || !modules.firestore) {
    return [];
  }

  const { collection, query, where, orderBy, getDocs } = modules.firestore;

  try {
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(bookingsQuery);
    const bookings: FirestoreBooking[] = [];
    
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        userId: data.userId || "",
        userName: data.userName || "",
        userEmail: data.userEmail || "",
        packageId: data.packageId || data.tourId || "",
        packageTitle: data.packageTitle || data.tourTitle || "Unknown Package",
        tourId: data.tourId || data.packageId || "",
        tourTitle: data.tourTitle || data.packageTitle || "Unknown Tour",
        bookingDate: data.bookingDate || data.createdAt,
        travelDate: data.travelDate || "",
        durationDays: data.durationDays || 1,
        guests: data.guests || data.guestCount || 1,
        roomType: data.roomType || "single",
        pricePerPerson: data.pricePerPerson || 0,
        totalAmount: data.totalAmount || data.amount || 0,
        amount: data.amount || data.totalAmount || 0,
        omniaServiceValue: data.omniaServiceValue ?? 0,
        coinsEarned: data.coinsEarned ?? 0,
        coinsStatus: data.coinsStatus ?? "pending",
        paymentStatus: data.paymentStatus || "pending",
        bookingStatus: data.bookingStatus || data.status || "pending",
        specialRequests: data.specialRequests || "",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
    
    return bookings;
  } catch (error: any) {
    logger.error("Error fetching user bookings:", error);
    return [];
  }
}

// Get all bookings (admin only)
export async function getBookingsFromFirestore(): Promise<FirestoreBooking[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  
  if (!db || !modules.firestore) {
    return [];
  }

  const { collection, query, orderBy, getDocs } = modules.firestore;

  try {
    const bookingsQuery = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc")
    );
    const bookingsSnap = await getDocs(bookingsQuery);

    const bookings: FirestoreBooking[] = [];
    bookingsSnap.forEach((doc: any) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        userId: data.userId || "",
        userName: data.userName || "Unknown User",
        userEmail: data.userEmail || "",
        packageId: data.packageId || data.tourId || "",
        packageTitle: data.packageTitle || data.tourTitle || "Unknown Package",
        tourId: data.tourId || data.packageId || "",
        tourTitle: data.tourTitle || data.packageTitle || "Unknown Tour",
        bookingDate: data.bookingDate || data.createdAt,
        travelDate: data.travelDate || "",
        durationDays: data.durationDays || 1,
        guests: data.guests || data.guestCount || 1,
        roomType: data.roomType || "single",
        pricePerPerson: data.pricePerPerson || 0,
        totalAmount: data.totalAmount || data.amount || 0,
        amount: data.amount || data.totalAmount || 0,
        omniaServiceValue: data.omniaServiceValue ?? 0,
        coinsEarned: data.coinsEarned ?? 0,
        coinsStatus: data.coinsStatus ?? "pending",
        paymentStatus: data.paymentStatus || "pending",
        bookingStatus: data.bookingStatus || data.status || "pending",
        refundNote: data.refundNote || "",
        specialRequests: data.specialRequests || "",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return bookings;
  } catch (error: any) {
    const msg = error?.message || "";
    const code = error?.code || "";

    if (
      msg.includes("insufficient permissions") ||
      msg.includes("permission-denied") ||
      code === "permission-denied"
    ) {
      return [];
    }

    logger.error("Error fetching bookings:", error);
    return [];
  }
}

// Cancel a booking (admin) — reverses any awarded coins
export async function cancelBooking(bookingId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  
  if (!db || !modules.firestore) {
    throw new Error("Database not initialized");
  }

  const { doc, updateDoc, serverTimestamp } = modules.firestore;

  await updateDoc(doc(db, "bookings", bookingId), {
    bookingStatus: "cancelled",
    updatedAt: serverTimestamp(),
  });

  await reverseBookingCoins(bookingId);
}

// Mark booking as refunded (admin)
export async function markAsRefunded(
  bookingId: string,
  refundNote: string
): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  
  if (!db || !modules.firestore) {
    throw new Error("Database not initialized");
  }

  const { doc, updateDoc, serverTimestamp } = modules.firestore;

  await updateDoc(doc(db, "bookings", bookingId), {
    paymentStatus: "refunded",
    refundNote,
    updatedAt: serverTimestamp(),
  });

  await reverseBookingCoins(bookingId);
}

// Internal helper: award referral coins to the referrer if the booking user was referred
async function tryAwardReferralCoins(bookingId: string): Promise<void> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()
  if (!db || !modules.firestore) return

  const { doc, getDoc } = modules.firestore
  try {
    const bookingSnap = await getDoc(doc(db, "bookings", bookingId))
    if (!bookingSnap.exists()) return
    const booking = bookingSnap.data() as any
    const userId: string = booking.userId
    if (!userId) return

    const userSnap = await getDoc(doc(db, "users", userId))
    if (!userSnap.exists()) return
    const userData = userSnap.data() as any
    const referredBy: string = userData.referredBy || ''
    if (!referredBy) return // user was not referred

    console.log('[tryAwardReferralCoins] Awarding referral coins to referrer:', referredBy)
    await awardReferralCoins({
      referrerId: referredBy,
      referredUserId: userId,
      referralType: 'individual',
      relatedBookingId: bookingId,
    })
  } catch (err) {
    console.error('[tryAwardReferralCoins] Error:', err)
    // Non-fatal — don't block the main flow
  }
}

import { triggerLoyaltyCoinsAdmin } from "@/lib/actions/loyalty.actions";

// Update booking status (admin)
export async function updateBookingStatus(
  bookingId: string,
  bookingStatus: "confirmed" | "pending" | "cancelled" | "completed"
): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();

  if (!db || !modules.firestore) {
    throw new Error("Database not initialized");
  }

  const { doc, updateDoc, serverTimestamp } = modules.firestore;

  await updateDoc(doc(db, "bookings", bookingId), {
    bookingStatus,
    updatedAt: serverTimestamp(),
  });

  // Loyalty for "completed" is handled exclusively by /api/admin/approve-booking
  // Only handle cancellation reversal here
  if (bookingStatus === "cancelled") {
    await reverseBookingCoins(bookingId);
  }
}

export async function updateBookingStatusByTxRef(
  tx_ref: string,
  bookingStatus: "confirmed" | "pending" | "cancelled" | "completed"
): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();

  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { collection, query, where, getDocs } = modules.firestore;
  const q = query(collection(db, "bookings"), where("tx_ref", "==", tx_ref));
  const snapshot = await getDocs(q);

  if (snapshot.empty) throw new Error("Booking not found");
  
  const bookingId = snapshot.docs[0].id;
  return updateBookingStatus(bookingId, bookingStatus);
}

export async function updatePaymentStatusByTxRef(
  tx_ref: string,
  paymentStatus: "paid" | "pending" | "refunded" | "failed"
): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();

  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { collection, query, where, getDocs } = modules.firestore;
  const q = query(collection(db, "bookings"), where("tx_ref", "==", tx_ref));
  const snapshot = await getDocs(q);

  if (snapshot.empty) throw new Error("Booking not found");
  
  const bookingId = snapshot.docs[0].id;
  return updatePaymentStatus(bookingId, paymentStatus);
}

// Update payment status (admin)
export async function updatePaymentStatus(
  bookingId: string,
  paymentStatus: "paid" | "pending" | "refunded" | "failed"
): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  
  if (!db || !modules.firestore) {
    throw new Error("Database not initialized");
  }

  const { doc, updateDoc, serverTimestamp } = modules.firestore;

  await updateDoc(doc(db, "bookings", bookingId), {
    paymentStatus,
    updatedAt: serverTimestamp(),
  });

  if (paymentStatus === "refunded") {
    await reverseBookingCoins(bookingId);
  }
}