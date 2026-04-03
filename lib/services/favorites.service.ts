import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";
import type { Unsubscribe } from "firebase/firestore";

export interface FavoritePackage {
  packageId: string;
  title: string;
  featuredImageURL: string;
  price: number;
  addedAt?: any; // Firestore Timestamp
}

/**
 * Add a package to the user's favorites
 */
export async function addToFavorites(userId: string, pkg: FavoritePackage): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, setDoc, serverTimestamp } = modules.firestore;

  await setDoc(doc(db, "users", userId, "favorites", pkg.packageId), {
    packageId: pkg.packageId,
    title: pkg.title,
    featuredImageURL: pkg.featuredImageURL,
    price: pkg.price,
    addedAt: serverTimestamp(),
  });
}

/**
 * Remove a package from the user's favorites
 */
export async function removeFromFavorites(userId: string, packageId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, deleteDoc } = modules.firestore;

  await deleteDoc(doc(db, "users", userId, "favorites", packageId));
}

/**
 * Check if a package is favorited by the user
 */
export async function checkIsFavorite(userId: string, packageId: string): Promise<boolean> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return false;

  const { doc, getDoc } = modules.firestore;

  const snap = await getDoc(doc(db, "users", userId, "favorites", packageId));
  return snap.exists();
}

/**
 * Fetch all favorite packages for the user (One-time fetch)
 */
export async function getUserFavorites(userId: string): Promise<FavoritePackage[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(collection(db, "users", userId, "favorites"));
    return snap.docs.map((d: any) => d.data() as FavoritePackage);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
}
