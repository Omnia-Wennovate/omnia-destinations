import { getFirebaseDb, getFirebaseStorage, getFirebaseModules } from "@/lib/firebase/config";
import { PACKAGES } from "@/lib/data/packages";
import { TOURS } from "@/lib/data/tours";

// ── Static-only packages ───────────────────────────────────────────────────
// Served from hardcoded data and synchronized with Firestore when available.
const STATIC_PACKAGE_IDS = new Set([
  'mombasa-zanzibar',
  'bali-indonesia',
  '1',
  '2',
  '3',
  'mombasa',
  'zanzibar',
  'bali',
]);

export function findStaticPackage(identifier: string) {
  if (!identifier) return null;
  const norm = identifier.toLowerCase().trim();
  const found = PACKAGES.find((p) => {
    const idLower = p.id.toLowerCase();
    const slugLower = ((p as any).slug || '').toLowerCase();
    const titleLower = p.title.toLowerCase();
    const titleSlug = titleLower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (idLower === norm || slugLower === norm || titleLower === norm || titleSlug === norm) return true;
    if (norm === '1' || norm === 'mombasa') {
      return p.id === 'mombasa';
    }
    if (norm === 'zanzibar') {
      return p.id === 'zanzibar';
    }
    if (norm === 'mombasa-zanzibar') {
      return p.id === 'mombasa';
    }
    if (norm === '2' || norm === '3' || norm === 'bali' || norm === 'bali-indonesia') {
      return p.id === 'bali-indonesia';
    }
    return false;
  });
  return found || null;
}

function toPackageData(staticPkg: (typeof PACKAGES)[number]): PackageData {
  const data: PackageData = {
    id: staticPkg.id,
    title: staticPkg.title,
    slug: (staticPkg as any).slug || staticPkg.id,
    shortDescription: staticPkg.description || '',
    fullDescription: staticPkg.description || '',
    singlePrice: staticPkg.singlePrice,
    sharingPrice: staticPkg.sharingPrice,
    duration: typeof staticPkg.duration === 'number' ? staticPkg.duration : parseInt(staticPkg.duration.toString()) || 1,
    location: staticPkg.location,
    category: 'Featured Packages',
    includedServices: (staticPkg as any).included || [],
    excludedServices: (staticPkg as any).excluded || [],
    status: 'published',
    featuredImageURL: staticPkg.image,
    galleryImageURLs: (staticPkg as any).gallery || [staticPkg.image],
    videoURL: (staticPkg as any).videoUrl || '',
    highlights: (staticPkg as any).highlights || [],
    itinerary: (staticPkg as any).itinerary || [],
    groupSize: (staticPkg as any).groupSize || 'Private or Small Group',
    nextAvailable: (staticPkg as any).nextAvailable || 'Year Round',
    reviews: (staticPkg as any).reviews || 0,
    rating: staticPkg.rating || 4.9,
    difficulty: (staticPkg as any).difficulty || 'Easy',
    minAge: (staticPkg as any).minAge || 0,
    maxPeople: (staticPkg as any).maxPeople || 16,
  };

  if (staticPkg.itinerary && Array.isArray(staticPkg.itinerary)) {
    staticPkg.itinerary.forEach((item, idx) => {
      const actStr = item.activities && item.activities.length ? `\n• ` + item.activities.join('\n• ') : '';
      data[`day${idx + 1}`] = `${item.title}: ${item.description}${actStr}`;
    });
  }

  return data;
}

export interface PackageData {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  singlePrice: number;
  sharingPrice: number;
  duration: number;
  location: string;
  category: string;
  availableFrom?: string;
  availableUntil?: string;
  includedServices: string[];
  excludedServices: string[];
  status: "draft" | "published";
  featuredImageURL: string;
  galleryImageURLs: string[];
  videoURL?: string;
  // Daily itinerary (optional, supports unlimited days: day1, day2, ...)
  day1?: string;
  day2?: string;
  day3?: string;
  day4?: string;
  day5?: string;
  day6?: string;
  day7?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export interface PackageListItem {
  images: any;
  id: string;
  title: string;
  slug?: string;
  shortDescription: string;
  singlePrice: number;
  sharingPrice: number;
  duration: number;
  featuredImageURL?: string;
  location: string;
  category: string;
  availableFrom?: string;
  availableUntil?: string;
}

export interface CreatePackageData {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  singlePrice: number;
  sharingPrice: number;
  duration: number;
  location: string;
  category: string;
  availableFrom?: string;
  availableUntil?: string;
  includedServices: string[];
  excludedServices: string[];
  status: "draft" | "published";
  // Media (optional — used when calling updatePackage with media fields)
  featuredImageURL?: string;
  // Daily itinerary (optional, supports unlimited days: day1, day2, ...)
  day1?: string;
  day2?: string;
  day3?: string;
  day4?: string;
  day5?: string;
  day6?: string;
  day7?: string;
  [key: string]: any;
}

export interface UploadProgress {
  progress: number;
  status: "uploading" | "complete" | "error";
  downloadURL?: string;
  error?: string;
  fileName: string;
}

// ── Slug validation ────────────────────────────────────────────────────────

export async function isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return true;

  const { collection, query, where, getDocs } = modules.firestore;
  const snap = await getDocs(query(collection(db, "packages"), where("slug", "==", slug)));

  if (snap.empty) return true;
  if (excludeId) return snap.docs.every((d: any) => d.id === excludeId);
  return false;
}

// ── CRUD ───────────────────────────────────────────────────────────────────

export async function createPackage(data: CreatePackageData): Promise<string> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { collection, addDoc, serverTimestamp } = modules.firestore;

  const slugUnique = await isSlugUnique(data.slug);
  if (!slugUnique) throw new Error("slug-exists");

  const docRef = await addDoc(collection(db, "packages"), {
    ...data,
    featuredImageURL: "",
    galleryImageURLs: [],
    videoURL: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updatePackage(packageId: string, data: Partial<CreatePackageData>): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, serverTimestamp } = modules.firestore;

  if (data.slug) {
    const slugUnique = await isSlugUnique(data.slug, packageId);
    if (!slugUnique) throw new Error("slug-exists");
  }

  await updateDoc(doc(db, "packages", packageId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePackage(packageId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, deleteDoc } = modules.firestore;
  await deleteDoc(doc(db, "packages", packageId));
}

export async function updatePackageStatus(packageId: string, status: "draft" | "published"): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, serverTimestamp } = modules.firestore;
  await updateDoc(doc(db, "packages", packageId), { status, updatedAt: serverTimestamp() });
}

export async function togglePackageStatus(packageId: string, currentStatus: string): Promise<void> {
  const newStatus = currentStatus === "published" ? "draft" : "published";
  return updatePackageStatus(packageId, newStatus as "draft" | "published");
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function getAllPackages(): Promise<PackageData[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, orderBy, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(query(collection(db, "packages"), orderBy("createdAt", "desc")));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as PackageData));
  } catch (error: any) {
    const code = error?.code || "";
    const msg = error?.message || "";
    if (code === "permission-denied" || msg.includes("insufficient permissions")) return [];
    throw error;
  }
}

// Fetch only published packages with minimal fields (no fullDescription, no videoURL)
export async function getPublishedPackages(): Promise<PackageListItem[]> {
  // Always include the authentic static packages.
  const staticItems: PackageListItem[] = PACKAGES.map((p) => ({
    id: p.id,
    slug: (p as any).slug || p.id,
    title: p.title,
    shortDescription: (p as any).description || '',
    singlePrice: p.singlePrice,
    sharingPrice: p.sharingPrice,
    duration: typeof p.duration === 'number' ? p.duration : parseInt(p.duration.toString()) || 1,
    featuredImageURL: p.image,
    location: p.location,
    category: 'Featured Packages',
    images: (p as any).gallery || [p.image],
  }));

  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return staticItems;

  const { collection, query, where, orderBy, getDocs, doc, getDoc, setDoc, serverTimestamp } = modules.firestore;

  // Lazily ensure both authentic packages exist in Firestore
  for (const pkg of PACKAGES) {
    try {
      const docRef = doc(db, "packages", pkg.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const pkgData = toPackageData(pkg);
        await setDoc(docRef, {
          ...pkgData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      // Ignore if write permission is restricted
    }
  }

  try {
    const snap = await getDocs(
      query(
        collection(db, "packages"),
        where("status", "==", "published"),
        orderBy("createdAt", "desc")
      )
    );

    const OLD_PACKAGE_TITLES = new Set([
      'maldives paradise',
      'roman holiday',
      'singapore explorer',
      'maldives',
      'rome',
      'singapore',
    ]);
    const staticPackageSlugs = new Set(
      PACKAGES.flatMap((p) => [p.id.toLowerCase(), ((p as any).slug || '').toLowerCase()])
    );

    // Exclude old packages and avoid duplicating static packages
    const firestoreItems = snap.docs
      .filter((d: any) => {
        const data = d.data();
        const titleLower = (data.title || '').toLowerCase().trim();
        const slugLower = (data.slug || '').toLowerCase().trim();
        if (OLD_PACKAGE_TITLES.has(titleLower) || OLD_PACKAGE_TITLES.has(slugLower)) return false;
        if (staticPackageSlugs.has(d.id.toLowerCase()) || staticPackageSlugs.has(slugLower)) return false;
        return true;
      })
      .map((d: any) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          slug: data.slug,
          shortDescription: data.shortDescription,
          singlePrice: data.singlePrice || data.price || 0,
          sharingPrice: data.sharingPrice || data.price || 0,
          duration: data.duration,
          featuredImageURL: data.featuredImageURL,
          location: data.location,
          category: data.category,
          availableFrom: data.availableFrom,
          availableUntil: data.availableUntil,
          images: data.galleryImageURLs || [],
        } as PackageListItem;
      });

    // Static authentic packages come first; additional Firestore packages appended after.
    return [...staticItems, ...firestoreItems];
  } catch (error: any) {
    return staticItems;
  }
}

// Fetch full package by ID (used on detail page)
export async function getPackageById(packageId: string): Promise<PackageData | null> {
  const staticPkg = findStaticPackage(packageId);
  if (staticPkg) return toPackageData(staticPkg);

  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();

  if (db && modules.firestore) {
    const { doc, getDoc, collection, query, where, limit, getDocs } = modules.firestore;
    try {
      // 1. Try fetching by ID
      const snap = await getDoc(doc(db, "packages", packageId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as PackageData;
      }

      // 2. Fallback: try fetching by slug
      const slugQuery = query(
        collection(db, "packages"), 
        where("slug", "==", packageId), 
        where("status", "==", "published"),
        limit(1)
      );
      const slugSnap = await getDocs(slugQuery);
      if (!slugSnap.empty) {
        const d = slugSnap.docs[0];
        return { id: d.id, ...d.data() } as PackageData;
      }
    } catch (e) {
      console.error("Error fetching package from Firestore:", e);
    }
  }

  // Fallback to static tours
  const staticTour = TOURS.find((t) => t.id === packageId);
  if (staticTour) {
    return {
      id: staticTour.id,
      title: staticTour.title,
      slug: staticTour.id,
      shortDescription: (staticTour as any).description || '',
      fullDescription: (staticTour as any).description || '',
      singlePrice: (staticTour as any).price || 0,
      sharingPrice: (staticTour as any).price || 0,
      duration: parseInt(staticTour.duration.toString()) || 1,
      location: staticTour.location,
      category: '',
      includedServices: (staticTour as any).included || [],
      excludedServices: (staticTour as any).excluded || [],
      status: 'published',
      featuredImageURL: staticTour.image,
      galleryImageURLs: (staticTour as any).gallery || [],
      videoURL: (staticTour as any).videoUrl || '',
    };
  }

  return null;
}

// Fetch full package by slug (used on detail page - lazy loaded)
export async function getPackageBySlug(rawSlug: string): Promise<PackageData | null> {
  const staticPkg = findStaticPackage(rawSlug);
  if (staticPkg) {
    return toPackageData(staticPkg);
  }

  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (db && modules.firestore) {
    const { doc, getDoc, collection, query, where, limit, getDocs } = modules.firestore;
    try {
      const slugQuery = query(
        collection(db, "packages"), 
        where("slug", "==", rawSlug), 
        where("status", "==", "published"),
        limit(1)
      );
      const slugSnap = await getDocs(slugQuery);
      if (!slugSnap.empty) {
        const d = slugSnap.docs[0];
        return { id: d.id, ...d.data() } as PackageData;
      }

      const snap = await getDoc(doc(db, "packages", rawSlug));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as PackageData;
      }
    } catch (e) {
      console.error("Error fetching package by slug from Firestore:", e);
    }
  }

  return null;
}

// ── Media uploads ──────────────────────────────────────────────────────────

export async function uploadFeaturedImage(
  file: File,
  packageId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const storage = await getFirebaseStorage();
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!storage || !db || !modules.storage || !modules.firestore) throw new Error("Storage not initialized");

  const { ref, uploadBytesResumable, getDownloadURL } = modules.storage;
  const { doc, updateDoc, serverTimestamp } = modules.firestore;

  const storageRef = ref(storage, `packages/${packageId}/featured-image`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    uploadTask.on(
      "state_changed",
      (snapshot: any) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({ progress, status: "uploading", fileName: file.name });
      },
      (error: any) => {
        onProgress?.({ progress: 0, status: "error", error: error.message, fileName: file.name });
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await updateDoc(doc(db, "packages", packageId), {
          featuredImageURL: downloadURL,
          updatedAt: serverTimestamp(),
        });
        onProgress?.({ progress: 100, status: "complete", downloadURL, fileName: file.name });
        resolve(downloadURL);
      }
    );
  });
}

export async function uploadGalleryImage(
  file: File,
  packageId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const storage = await getFirebaseStorage();
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!storage || !db || !modules.storage || !modules.firestore) throw new Error("Storage not initialized");

  const { ref, uploadBytesResumable, getDownloadURL } = modules.storage;
  const { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } = modules.firestore;

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageRef = ref(storage, `packages/${packageId}/gallery/${timestamp}_${safeName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    uploadTask.on(
      "state_changed",
      (snapshot: any) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({ progress, status: "uploading", fileName: file.name });
      },
      (error: any) => {
        onProgress?.({ progress: 0, status: "error", error: error.message, fileName: file.name });
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await updateDoc(doc(db, "packages", packageId), {
          galleryImageURLs: arrayUnion(downloadURL),
          updatedAt: serverTimestamp(),
        });
        onProgress?.({ progress: 100, status: "complete", downloadURL, fileName: file.name });
        resolve(downloadURL);
      }
    );
  });
}

export async function uploadVideo(
  file: File,
  packageId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const storage = await getFirebaseStorage();
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!storage || !db || !modules.storage || !modules.firestore) throw new Error("Storage not initialized");

  const { ref, uploadBytesResumable, getDownloadURL } = modules.storage;
  const { doc, updateDoc, serverTimestamp } = modules.firestore;

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageRef = ref(storage, `packages/${packageId}/video/${timestamp}_${safeName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    uploadTask.on(
      "state_changed",
      (snapshot: any) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({ progress, status: "uploading", fileName: file.name });
      },
      (error: any) => {
        onProgress?.({ progress: 0, status: "error", error: error.message, fileName: file.name });
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await updateDoc(doc(db, "packages", packageId), {
          videoURL: downloadURL,
          updatedAt: serverTimestamp(),
        });
        onProgress?.({ progress: 100, status: "complete", downloadURL, fileName: file.name });
        resolve(downloadURL);
      }
    );
  });
}

export async function removeGalleryImage(packageId: string, imageURL: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, arrayRemove, serverTimestamp } = modules.firestore;
  await updateDoc(doc(db, "packages", packageId), {
    galleryImageURLs: arrayRemove(imageURL),
    updatedAt: serverTimestamp(),
  });
}

// ── Validation ─────────────────────────────────────────────────────────────

export function validatePackageForPublish(pkg: Partial<PackageData>): string[] {
  const errors: string[] = [];
  if (!pkg.title?.trim()) errors.push("Title is required");
  if (!pkg.slug?.trim()) errors.push("Slug is required");
  if (!pkg.shortDescription?.trim()) errors.push("Short description is required");
  if (!pkg.fullDescription?.trim()) errors.push("Full description is required");
  if (!pkg.singlePrice || pkg.singlePrice <= 0) errors.push("Valid single price is required");
  if (!pkg.sharingPrice || pkg.sharingPrice <= 0) errors.push("Valid sharing price is required");
  if (!pkg.duration || pkg.duration <= 0) errors.push("Valid duration is required");
  if (!pkg.location?.trim()) errors.push("Location is required");
  if (!pkg.category?.trim()) errors.push("Category is required");
  if (!pkg.featuredImageURL?.trim()) errors.push("Featured image is required");
  return errors;
}
