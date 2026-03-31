import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId)
const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
type FirebaseServices = {
  app: any
  auth: any
  db: any
  storage: any
  authModule: any
  firestoreModule: any
  storageModule: any
}

let _services: FirebaseServices | null = null
let _initPromise: Promise<FirebaseServices | null> | null = null

function getFirebaseServices(): Promise<FirebaseServices | null> {
  if (_services) return Promise.resolve(_services)
  if (_initPromise) return _initPromise

  _initPromise = (async (): Promise<FirebaseServices | null> => {
    if (typeof window === 'undefined') return null
    if (!isFirebaseConfigured) return null

    try {
      // Step 1: import firebase/app and initialize the app FIRST.
      // The app instance must exist before any service module is imported,
      // because service modules register themselves against the app registry
      // on import — they need the app to already be there.
      const { initializeApp, getApps, getApp } = await import('firebase/app')
      const app = getApps().length === 0
        ? initializeApp(firebaseConfig)
        : getApp()

      // Step 2: import service modules AFTER the app is initialized.
      // Each await ensures the previous module's registration is complete
      // before the next one loads.
      const authMod      = await import('firebase/auth')
      const firestoreMod = await import('firebase/firestore')
      const storageMod   = await import('firebase/storage')

      // Step 3: now it is safe to call the service getters.
      const auth    = authMod.getAuth(app)
      const db      = firestoreMod.getFirestore(app)
      const storage = storageMod.getStorage(app)

      const authModule = {
        onAuthStateChanged:            (a: any, cb: any)                   => authMod.onAuthStateChanged(a, cb),
        signInWithEmailAndPassword:    (a: any, email: string, pw: string) => authMod.signInWithEmailAndPassword(a, email, pw),
        createUserWithEmailAndPassword:(a: any, email: string, pw: string) => authMod.createUserWithEmailAndPassword(a, email, pw),
        signInWithPopup:               (a: any, provider: any)             => authMod.signInWithPopup(a, provider),
        signOut:                       (a: any)                            => authMod.signOut(a),
        updateProfile:                 (user: any, profile: any)           => authMod.updateProfile(user, profile),
        GoogleAuthProvider:   authMod.GoogleAuthProvider,
        FacebookAuthProvider: (authMod as any).FacebookAuthProvider,
      }

      const firestoreModule = {
        doc:             (...args: any[])              => (firestoreMod.doc as any)(...args),
        collection:      (...args: any[])              => (firestoreMod.collection as any)(...args),
        getDoc:          (ref: any)                    => firestoreMod.getDoc(ref),
        getDocs:         (q: any)                      => firestoreMod.getDocs(q),
        setDoc:          (ref: any, data: any, o?: any)=> o ? firestoreMod.setDoc(ref, data, o) : firestoreMod.setDoc(ref, data),
        addDoc:          (col: any, data: any)         => firestoreMod.addDoc(col, data),
        updateDoc:       (ref: any, data: any)         => firestoreMod.updateDoc(ref, data),
        deleteDoc:       (ref: any)                    => firestoreMod.deleteDoc(ref),
        query:           (...args: any[])              => (firestoreMod.query as any)(...args),
        where:           (...args: any[])              => (firestoreMod.where as any)(...args),
        orderBy:         (...args: any[])              => (firestoreMod.orderBy as any)(...args),
        limit:           (n: number)                   => firestoreMod.limit(n),
        onSnapshot:      (...args: any[])              => (firestoreMod.onSnapshot as any)(...args),
        serverTimestamp: ()                            => firestoreMod.serverTimestamp(),
        arrayUnion:      (...items: any[])             => (firestoreMod.arrayUnion as any)(...items),
        arrayRemove:     (...items: any[])             => (firestoreMod.arrayRemove as any)(...items),
        increment:       (n: number)                   => firestoreMod.increment(n),
        Timestamp:       firestoreMod.Timestamp,
        FieldValue:      null, // not used in modular SDK
      }

      const storageModule = {
        ref:                  (...args: any[])      => (storageMod.ref as any)(...args),
        uploadBytesResumable: (ref: any, file: any) => storageMod.uploadBytesResumable(ref, file),
        getDownloadURL:       (ref: any)            => storageMod.getDownloadURL(ref),
        deleteObject:         (ref: any)            => storageMod.deleteObject(ref),
      }

      _services = { app, auth, db, storage, authModule, firestoreModule, storageModule }
      return _services
    } catch (err) {
      console.error('[Firebase] init failed:', err)
      _initPromise = null
      return null
    }
  })()

  return _initPromise
}

async function getFirebaseApp()     { return (await getFirebaseServices())?.app     ?? null }
async function getFirebaseAuth()    { return (await getFirebaseServices())?.auth    ?? null }
async function getFirebaseDb()      { return (await getFirebaseServices())?.db      ?? null }
async function getFirebaseStorage() { return (await getFirebaseServices())?.storage ?? null }

async function getFirebaseModules() {
  const svc = await getFirebaseServices()
  return {
    app:       null as any,
    auth:      svc?.authModule      ?? null,
    firestore: svc?.firestoreModule ?? null,
    storage:   svc?.storageModule   ?? null,
  }
}

const getFirebase = getFirebaseApp

export {
  isFirebaseConfigured,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
  getFirebaseModules,
  getFirebase,
}
