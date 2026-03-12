import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  category: string;
  status: "draft" | "published";
  featuredImage: string;
  publishDate: string;
  createdAt: any;
  updatedAt?: any;
  createdByAdminId: string;
}

export interface CreateNewsData {
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  category: string;
  status: "draft" | "published";
  featuredImage: string;
  publishDate: string;
}

export async function getNewsArticles(): Promise<NewsArticle[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, getDocs, query, orderBy } = modules.firestore;

  try {
    const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as NewsArticle));
  } catch (error: any) {
    const code = error?.code || "";
    const msg = error?.message || "";
    if (code === "permission-denied" || msg.includes("insufficient permissions")) return [];
    return [];
  }
}

export async function getNewsById(newsId: string): Promise<NewsArticle | null> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return null;

  const { doc, getDoc } = modules.firestore;
  const snap = await getDoc(doc(db, "news", newsId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as NewsArticle;
}

export async function createNewsArticle(data: CreateNewsData, adminId: string): Promise<string> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { collection, addDoc, serverTimestamp } = modules.firestore;
  const docRef = await addDoc(collection(db, "news"), {
    ...data,
    createdAt: serverTimestamp(),
    createdByAdminId: adminId,
  });
  return docRef.id;
}

export async function updateNewsArticle(newsId: string, data: Partial<CreateNewsData>): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, serverTimestamp } = modules.firestore;
  await updateDoc(doc(db, "news", newsId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteNewsArticle(newsId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, deleteDoc } = modules.firestore;
  await deleteDoc(doc(db, "news", newsId));
}

export async function toggleNewsStatus(newsId: string, currentStatus: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, serverTimestamp } = modules.firestore;
  const newStatus = currentStatus === "published" ? "draft" : "published";
  await updateDoc(doc(db, "news", newsId), {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}
