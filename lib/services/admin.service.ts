import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";

export interface AdminStats {
  totalUsers: number
  totalPackages: number
  totalBookings: number
  totalRevenue: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) {
    return { totalUsers: 0, totalPackages: 0, totalBookings: 0, totalRevenue: 0 };
  }

  const { collection, getDocs, query, where } = modules.firestore;

  try {
    const [usersSnap, packagesSnap, bookingsSnap, paidBookingsSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "packages")),
      getDocs(collection(db, "bookings")),
      getDocs(query(collection(db, "bookings"), where("paymentStatus", "==", "paid"))),
    ]);

    let totalRevenue = 0;
    paidBookingsSnap.forEach((d: any) => {
      const data = d.data();
      totalRevenue += data.totalAmount || data.amount || 0;
    });

    return {
      totalUsers: usersSnap.size,
      totalPackages: packagesSnap.size,
      totalBookings: bookingsSnap.size,
      totalRevenue,
    };
  } catch (error: any) {
    const msg = error?.message || "";
    const code = error?.code || "";
    if (
      msg.includes("insufficient permissions") ||
      msg.includes("permission-denied") ||
      code === "permission-denied" ||
      msg.includes("does not exist")
    ) {
      return { totalUsers: 0, totalPackages: 0, totalBookings: 0, totalRevenue: 0 };
    }
    console.error("Unexpected error fetching admin stats:", error);
    return { totalUsers: 0, totalPackages: 0, totalBookings: 0, totalRevenue: 0 };
  }
}
