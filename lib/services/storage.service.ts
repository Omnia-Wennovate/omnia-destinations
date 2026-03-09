import { getFirebaseDb, getFirebaseStorage, getFirebaseModules } from "@/lib/firebase/config";

export interface UploadProgress {
  progress: number;
  status: "uploading" | "complete" | "error";
  downloadURL?: string;
  error?: string;
  fileName: string;
  fileType: "image" | "video";
}

function getFileType(file: File): "image" | "video" {
  return file.type.startsWith("video/") ? "video" : "image";
}

export async function uploadTourMedia(
  file: File,
  tourId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const storage = await getFirebaseStorage();
  const modules = await getFirebaseModules();
  if (!storage || !modules.storage) throw new Error("Storage not initialized");

  const { ref, uploadBytesResumable, getDownloadURL } = modules.storage;
  const fileType = getFileType(file);
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `tours/${tourId}/${fileType}s/${timestamp}_${safeName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    uploadTask.on(
      "state_changed",
      (snapshot: any) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({ progress, status: "uploading", fileName: file.name, fileType });
      },
      (error: any) => {
        onProgress?.({ progress: 0, status: "error", error: error.message, fileName: file.name, fileType });
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onProgress?.({ progress: 100, status: "complete", downloadURL, fileName: file.name, fileType });
        resolve(downloadURL);
      }
    );
  });
}

export async function saveTourMedia(
  tourId: string,
  media: { images: string[]; videos: string[] }
): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc } = modules.firestore;
  await updateDoc(doc(db, "tours", tourId), { media });
}

export async function addMediaURLToTour(tourId: string, url: string, type: "image" | "video"): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, arrayUnion } = modules.firestore;
  const field = type === "image" ? "media.images" : "media.videos";
  await updateDoc(doc(db, "tours", tourId), { [field]: arrayUnion(url) });
}

export async function removeMediaURLFromTour(tourId: string, url: string, type: "image" | "video"): Promise<void> {
  const db = await getFirebaseDb();
  const storage = await getFirebaseStorage();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, arrayRemove } = modules.firestore;
  const field = type === "image" ? "media.images" : "media.videos";
  await updateDoc(doc(db, "tours", tourId), { [field]: arrayRemove(url) });

  if (storage && modules.storage) {
    try {
      const { ref, deleteObject } = modules.storage;
      await deleteObject(ref(storage, url));
    } catch {
      // File may not exist in storage
    }
  }
}

export function getAcceptedFileTypes(): string {
  return "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime";
}

export function validateFile(file: File): string | null {
  const maxImageSize = 10 * 1024 * 1024;
  const maxVideoSize = 100 * 1024 * 1024;
  const fileType = getFileType(file);

  if (fileType === "image" && file.size > maxImageSize) return `Image "${file.name}" exceeds 10MB limit`;
  if (fileType === "video" && file.size > maxVideoSize) return `Video "${file.name}" exceeds 100MB limit`;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "video/quicktime"];
  if (!allowedTypes.includes(file.type)) return `File type "${file.type}" is not supported`;

  return null;
}
