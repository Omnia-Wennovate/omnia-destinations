import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";
import { awardBookingCoins, reverseBookingCoins } from "@/lib/services/loyalty.service";

export interface FirestoreBooking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageTitle: string;
  tourId?: string;
  tourTitle?: string;
  bookingDate: any;
  travelDate: string;
  guests: number;
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
  totalAmount: number;
  omniaServiceValue?: number; // defaults to 0 if not provided
  specialRequests?: string;
}

// Create a new booking
export async function createBooking(data: CreateBookingData): Promise<string> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  
  if (!db || !modules.firestore) {
    throw new Error("Database not initialized");
  }

  const { collection, addDoc, serverTimestamp } = modules.firestore;

  const bookingDoc = {
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    packageId: data.packageId,
    packageTitle: data.packageTitle,
    tourId: data.packageId,
    tourTitle: data.packageTitle,
    bookingDate: serverTimestamp(),
    travelDate: data.travelDate,
    guests: data.guests,
    totalAmount: data.totalAmount,
    amount: data.totalAmount,
    omniaServiceValue: data.omniaServiceValue ?? 0,
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
        guests: data.guests || data.guestCount || 1,
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
    console.error("Error fetching user bookings:", error);
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
    // Fetch bookings
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
        guests: data.guests || data.guestCount || 1,
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

    console.error("Error fetching bookings:", error);
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

  // Reverse coins if previously awarded
  await reverseBookingCoins(bookingId);
}

// Mark booking as refunded (admin) — reverses any awarded coins
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

  // Reverse coins if previously awarded
  await reverseBookingCoins(bookingId);
}

// Update booking status (admin) — triggers loyalty coin award when completed
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

  // Trigger loyalty logic based on new status
  if (bookingStatus === "completed") {
    // awardBookingCoins checks paymentStatus === "paid" internally
    await awardBookingCoins(bookingId);
  } else if (bookingStatus === "cancelled") {
    await reverseBookingCoins(bookingId);
  }
}

// Update payment status (admin) — triggers loyalty coin award when paid + completed
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

  // If payment is confirmed and booking is already completed, award coins
  if (paymentStatus === "paid") {
    await awardBookingCoins(bookingId);
  } else if (paymentStatus === "refunded") {
    await reverseBookingCoins(bookingId);
  }
}
