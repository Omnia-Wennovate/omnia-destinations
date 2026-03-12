import { getFirebaseDb, getFirebaseStorage, getFirebaseModules } from "@/lib/firebase/config";

export interface PackageData {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  duration: number;
  location: string;
  category: string;
  includedServices: string[];
  excludedServices: string[];
  status: "draft" | "published";
  featuredImageURL: string;
  galleryImageURLs: string[];
  videoURL?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface PackageListItem {
  id: string;
  title: string;
  slug?: string;
  shortDescription: string;
  price: number;
  duration: number;
  featuredImageURL?: string;
  location: string;
  category: string;
}

export interface CreatePackageData {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  duration: number;
  location: string;
  category: string;
  includedServices: string[];
  excludedServices: string[];
  status: "draft" | "published";
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
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, where, orderBy, getDocs } = modules.firestore;

  try {
   const snap = await getDocs(
  query(
    collection(db, "packages"),
    where("status", "==", "published"),
    orderBy("createdAt", "desc")
  )
);

console.log("🔥 Firestore snapshot:", snap.docs);

snap.docs.forEach((doc) => {
  console.log("📦 Package:", doc.id, doc.data());
});
    return snap.docs.map((d: any) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        price: data.price,
        duration: data.duration,
        featuredImageURL: data.featuredImageURL,
        location: data.location,
        category: data.category,
      } as PackageListItem;
    });
  } catch (error: any) {
    const code = error?.code || "";
    const msg = error?.message || "";
    if (code === "permission-denied" || msg.includes("insufficient permissions")) return [];
    throw error;
  }
}

// Fetch full package by ID (used on detail page)
export async function getPackageById(packageId: string): Promise<PackageData | null> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return null;

  const { doc, getDoc } = modules.firestore;
  const snap = await getDoc(doc(db, "packages", packageId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PackageData;
}

// Fetch full package by slug (used on detail page - lazy loaded)
export async function getPackageBySlug(slug: string): Promise<PackageData | null> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return null;

  const { collection, query, where, limit, getDocs } = modules.firestore;
  const snap = await getDocs(query(collection(db, "packages"), where("slug", "==", slug), limit(1)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as PackageData;
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
  if (!pkg.price || pkg.price <= 0) errors.push("Valid price is required");
  if (!pkg.duration || pkg.duration <= 0) errors.push("Valid duration is required");
  if (!pkg.location?.trim()) errors.push("Location is required");
  if (!pkg.category?.trim()) errors.push("Category is required");
  if (!pkg.featuredImageURL?.trim()) errors.push("Featured image is required");
  return errors;
}
