import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface FirestoreTour {
  id: string;
  title: string;
  country: string;
  price: number;
  status: "published" | "draft" | "archived";
  bookingCount: number;
  tags: string[];
  image?: string;
  duration?: string;
  createdAt?: string;
}

export async function getToursFromFirestore(): Promise<FirestoreTour[]> {
  try {
    const toursRef = collection(db, "tours");
    const q = query(toursRef, orderBy("title"));
    const snapshot = await getDocs(q);

    const tours: FirestoreTour[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      tours.push({
        id: docSnap.id,
        title: data.title || "Untitled",
        country: data.country || data.location || "Unknown",
        price: data.price || 0,
        status: data.status || "draft",
        bookingCount: data.bookingCount || 0,
        tags: data.tags || [],
        image: data.image || "",
        duration: data.duration || "",
        createdAt: data.createdAt || "",
      });
    });

    return tours;
  } catch (error: any) {
    const msg = error?.message || '';
    const code = error?.code || '';

    if (
      msg.includes('insufficient permissions') ||
      msg.includes('permission-denied') ||
      code === 'permission-denied' ||
      msg.includes('does not exist')
    ) {
      return [];
    }

    return [];
  }
}

export async function updateTourStatus(
  tourId: string,
  status: "published" | "draft" | "archived"
): Promise<void> {
  const tourRef = doc(db, "tours", tourId);
  await updateDoc(tourRef, { status });
}

export async function deleteTour(tourId: string): Promise<void> {
  const tourRef = doc(db, "tours", tourId);
  await deleteDoc(tourRef);
}

export async function getTourById(tourId: string): Promise<Record<string, any> | null> {
  const { getDoc } = await import("firebase/firestore");
  const tourRef = doc(db, "tours", tourId);
  const snap = await getDoc(tourRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateTour(tourId: string, data: CreateTourData): Promise<void> {
  const tagsList: string[] = [];
  if (data.tags.isTopDestination) tagsList.push("top");
  if (data.tags.isNew) tagsList.push("new");
  if (data.tags.isPopular) tagsList.push("popular");

  const tourRef = doc(db, "tours", tourId);
  await updateDoc(tourRef, {
    title: data.title,
    slug: data.slug,
    country: data.country,
    city: data.city,
    description: data.description,
    price: data.basePrice,
    maxGuests: data.maxGuests,
    startDate: data.startDate,
    expireDate: data.expireDate,
    itinerary: data.itinerary,
    priceIncludes: data.priceIncludes,
    priceExcludes: data.priceExcludes,
    tags: tagsList,
    status: data.status,
    updatedAt: serverTimestamp(),
  });
}

export interface CreateTourData {
  title: string;
  slug: string;
  country: string;
  city: string;
  description: string;
  basePrice: number;
  maxGuests: number;
  startDate: string;
  expireDate: string;
  itinerary: { day: number; title: string; description: string; activities: string[] }[];
  priceIncludes: string[];
  priceExcludes: string[];
  tags: { isTopDestination: boolean; isNew: boolean; isPopular: boolean };
  status: "draft" | "published";
}

export async function createTour(data: CreateTourData, adminId: string): Promise<string> {
  const toursRef = collection(db, "tours");

  const tagsList: string[] = [];
  if (data.tags.isTopDestination) tagsList.push("top");
  if (data.tags.isNew) tagsList.push("new");
  if (data.tags.isPopular) tagsList.push("popular");

  const docRef = await addDoc(toursRef, {
    title: data.title,
    slug: data.slug,
    country: data.country,
    city: data.city,
    description: data.description,
    price: data.basePrice,
    maxGuests: data.maxGuests,
    startDate: data.startDate,
    expireDate: data.expireDate,
    itinerary: data.itinerary,
    priceIncludes: data.priceIncludes,
    priceExcludes: data.priceExcludes,
    tags: tagsList,
    status: data.status,
    bookingCount: 0,
    createdAt: serverTimestamp(),
    createdByAdminId: adminId,
  });

  return docRef.id;
}
