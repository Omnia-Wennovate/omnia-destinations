import { getFirebaseDb, getFirebaseStorage, getFirebaseModules } from '@/lib/firebase/config'

export interface PassportData {
  fileUrl: string
  fileName: string
  expiryDate: string   // ISO date string e.g. "2027-05-10"
  uploadedAt: any      // Firestore Timestamp
}

/**
 * Upload a passport file (JPG / PNG / PDF) to Firebase Storage.
 * Path: passports/{userId}/{timestamp}_{safeName}
 * Returns the public download URL.
 */
export async function uploadPassportFile(
  userId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const storage = await getFirebaseStorage()
  const modules = await getFirebaseModules()
  if (!storage || !modules.storage) throw new Error('Storage not initialized')

  const { ref, uploadBytesResumable, getDownloadURL } = modules.storage
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `passports/${userId}/${timestamp}_${safeName}`
  const storageRef = ref(storage, storagePath)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type })

    task.on(
      'state_changed',
      (snapshot: any) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress?.(pct)
      },
      (err: any) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve(url)
      }
    )
  })
}

/**
 * Save passport metadata to Firestore at:
 * users/{userId}/passport/main
 */
export async function savePassportData(
  userId: string,
  data: { fileUrl: string; fileName: string; expiryDate: string }
): Promise<void> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()
  if (!db || !modules.firestore) throw new Error('Database not initialized')

  const { doc, setDoc, serverTimestamp } = modules.firestore
  const ref = doc(db, 'users', userId, 'passport', 'main')
  await setDoc(ref, {
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    expiryDate: data.expiryDate,
    uploadedAt: serverTimestamp(),
  })
}

/**
 * Fetch passport metadata from Firestore.
 * Returns PassportData or null if not yet uploaded.
 */
export async function getPassportData(userId: string): Promise<PassportData | null> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()
  if (!db || !modules.firestore) return null

  const { doc, getDoc } = modules.firestore
  const ref = doc(db, 'users', userId, 'passport', 'main')
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as PassportData
}

/**
 * Calculate days remaining until passport expiry.
 * Negative means already expired.
 */
export function calcDaysLeft(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export type PassportStatus = {
  label: string
  color: string
  bg: string
  border: string
  emoji: string
}

/**
 * Return a status descriptor based on days remaining.
 */
export function getPassportStatus(daysLeft: number): PassportStatus {
  if (daysLeft <= 0) {
    return {
      label: 'Expired',
      color: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-950/60',
      border: 'border-red-300 dark:border-red-700',
      emoji: '⛔',
    }
  }
  if (daysLeft < 30) {
    return {
      label: 'Urgent: Expiring Soon',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-300 dark:border-red-700',
      emoji: '🚨',
    }
  }
  if (daysLeft <= 90) {
    return {
      label: 'Expiring Soon',
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      border: 'border-amber-300 dark:border-amber-700',
      emoji: '⚠️',
    }
  }
  return {
    label: 'Valid',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/50',
    border: 'border-green-300 dark:border-green-700',
    emoji: '✅',
  }
}
