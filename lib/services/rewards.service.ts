import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";
import { adminAdjustCoins, type CoinTransactionType } from "@/lib/services/loyalty.service";

// FirestoreReward now maps directly to a coin transaction entry
export interface FirestoreReward {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  points: number;
  type: CoinTransactionType;
  reason: string;
  relatedBookingId?: string;
  status: "active" | "expired" | "reversed";
  expiresAt?: string;
  createdAt: any;
}

/**
 * Fetch all coin transactions across all users for the admin rewards log.
 * Reads from the top-level rewards collection first (legacy), then merges
 * coinsHistory subcollection data for users who have the new structure.
 */
export async function getRewardsFromFirestore(): Promise<FirestoreReward[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, getDocs, query, orderBy } = modules.firestore;

  try {
    // Fetch users for name/email lookup
    const usersSnap = await getDocs(collection(db, "users"));
    const usersMap = new Map<string, { name: string; email: string }>();
    usersSnap.forEach((d: any) => {
      const data = d.data();
      usersMap.set(d.id, {
        name: data.name || data.email || "Unknown",
        email: data.email || "",
      });
    });

    const rewards: FirestoreReward[] = [];

    // Read coinsHistory subcollection for each user
    const userIds = Array.from(usersMap.keys());
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const histSnap = await getDocs(
            query(
              collection(db, "users", uid, "coinsHistory"),
              orderBy("createdAt", "desc")
            )
          );
          const userInfo = usersMap.get(uid) || { name: "Unknown", email: "" };
          histSnap.forEach((d: any) => {
            const data = d.data();
            rewards.push({
              id: d.id,
              userId: uid,
              userName: userInfo.name,
              userEmail: userInfo.email,
              points: data.amount || 0,
              type: data.type || "manual",
              reason: data.reason || "—",
              relatedBookingId: data.relatedBookingId || undefined,
              status: data.status || "active",
              expiresAt: data.expiresAt || undefined,
              createdAt: data.createdAt || null,
            });
          });
        } catch {
          // User may not have coinsHistory yet — skip silently
        }
      })
    );

    // Sort descending by createdAt (Firestore Timestamps compare correctly)
    rewards.sort((a, b) => {
      const aTs = a.createdAt?.toMillis?.() ?? 0;
      const bTs = b.createdAt?.toMillis?.() ?? 0;
      return bTs - aTs;
    });

    return rewards;
  } catch (error: any) {
    const code = error?.code || "";
    if (code === "permission-denied") return [];
    return [];
  }
}

/**
 * Admin manual coin adjustment — delegates to loyalty service which
 * writes the transaction + audit log atomically.
 */
export async function addReward(params: {
  adminId: string;
  userId: string;
  points: number;
  type: CoinTransactionType;
  reason: string;
}): Promise<void> {
  await adminAdjustCoins({
    adminId: params.adminId,
    targetUserId: params.userId,
    amount: params.points,
    reason: params.reason,
    type: params.type,
  });
}
