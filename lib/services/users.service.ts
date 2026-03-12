import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";
import { adminAdjustCoins, adminSetTier, adminAssignTravelFamily, type TierName } from "@/lib/services/loyalty.service";

export interface FirestoreUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "ADMIN" | "USER"; // normalised to lowercase in practice
  loyaltyPoints: number;
  totalCoinsEarned: number;
  totalReferrals: number;
  tier: TierName;
  annualOmniaSpend: number;
  travelFamily?: string;
  phone?: string;
  referralCode?: string;
  createdAt?: any;
  updatedAt?: any;
}

export async function getUsersFromFirestore(): Promise<FirestoreUser[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, getDocs, query, orderBy } = modules.firestore;

  try {
    const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
    const users: FirestoreUser[] = [];
    snap.forEach((d: any) => {
      const data = d.data();
      users.push({
        id: d.id,
        name: data.name || data.email || "Unknown",
        email: data.email || "",
        role: data.role || "user",
        loyaltyPoints: data.loyaltyPoints || 0,
        totalCoinsEarned: data.totalCoinsEarned || 0,
        totalReferrals: data.totalReferrals || 0,
        tier: data.tier || "Hope",
        annualOmniaSpend: data.annualOmniaSpend || 0,
        travelFamily: data.travelFamily || "",
        phone: data.phone || "",
        referralCode: data.referralCode || "",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      });
    });
    return users;
  } catch (error: any) {
    const msg = error?.message || "";
    const code = error?.code || "";
    if (
      msg.includes("insufficient permissions") ||
      msg.includes("permission-denied") ||
      code === "permission-denied" ||
      msg.includes("does not exist")
    ) {
      return [];
    }
    return [];
  }
}

export async function updateUserRole(userId: string, role: "admin" | "user"): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, serverTimestamp } = modules.firestore;
  await updateDoc(doc(db, "users", userId), { role, updatedAt: serverTimestamp() });
}

/**
 * Admin-facing loyalty point adjustment.
 * Routes through loyalty.service so coin history + audit log are always written.
 */
export async function adjustLoyaltyPoints(
  userId: string,
  amount: number,
  adminId = "admin",
  reason = "Manual adjustment by admin"
): Promise<void> {
  await adminAdjustCoins({
    adminId,
    targetUserId: userId,
    amount,
    reason,
    type: "manual",
  });
}

/**
 * Admin tier override — writes audit log.
 */
export async function setUserTier(
  adminId: string,
  userId: string,
  tier: TierName,
  reason: string
): Promise<void> {
  await adminSetTier({ adminId, targetUserId: userId, tier, reason });
}

/**
 * Assign Travel Family recognition — writes audit log.
 */
export async function assignTravelFamily(
  adminId: string,
  userId: string,
  familyName: string,
  reason: string
): Promise<void> {
  await adminAssignTravelFamily({ adminId, targetUserId: userId, familyName, reason });
}
