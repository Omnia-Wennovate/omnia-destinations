import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";
import { adminAdjustCoins, adminSetTier, adminAssignTravelFamily, type TierName } from "@/lib/services/loyalty.service";

export interface FirestoreUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "ADMIN" | "USER";
  loyaltyPoints: number;
  totalCoinsEarned: number;
  totalReferrals: number;
  /** Completed packages count — used for tier qualification */
  totalPackages: number;
  /** Total ETB spend on Omnia service value — used for tier qualification */
  totalSpend: number;
  tier: TierName;
  /** Legacy field — kept for backward compat; mirrors totalSpend */
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
        totalPackages: data.totalPackages || 0,
        totalSpend: data.totalSpend || 0,
        tier: data.tier || "Hope",
        annualOmniaSpend: data.annualOmniaSpend || data.totalSpend || 0,
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

export async function updateUserRole(
  userId: string,
  role: "admin" | "user",
  adminId = "system"
): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, addDoc, collection, serverTimestamp } = modules.firestore;

  // Update the role field
  await updateDoc(doc(db, "users", userId), { role, updatedAt: serverTimestamp() });

  // Audit log — every role change is recorded (non-fatal)
  try {
    await addDoc(collection(db, "auditLogs"), {
      actionType: "role_change",
      targetUserId: userId,
      newRole: role,
      adminId,
      changedAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal — role was already updated; audit failure should not block the operation
  }
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
    type: "admin_adjustment",
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
