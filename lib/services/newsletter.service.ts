import emailjs from "@emailjs/browser";
import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";

// ---- Subscribers ----

export async function addSubscriber(email: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } = modules.firestore;

  const snap = await getDocs(query(collection(db, "subscribers"), where("email", "==", email)));
  if (!snap.empty) {
    const existing = snap.docs[0].data();
    if (existing.status === "active") throw new Error("already-subscribed");
    await updateDoc(snap.docs[0].ref, { status: "active", updatedAt: serverTimestamp() });
    return;
  }

  await addDoc(collection(db, "subscribers"), {
    email,
    status: "active",
    createdAt: serverTimestamp(),
  });
}

export async function getActiveSubscribers(): Promise<{ id: string; email: string }[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, where, getDocs } = modules.firestore;
  const snap = await getDocs(query(collection(db, "subscribers"), where("status", "==", "active")));
  return snap.docs.map((d: any) => ({ id: d.id, email: d.data().email }));
}

export async function getAllSubscribers() {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, orderBy, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(query(collection(db, "subscribers"), orderBy("createdAt", "desc")));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  } catch (error: any) {
    const code = error?.code || "";
    const msg = error?.message || "";
    if (code === "permission-denied" || msg.includes("insufficient permissions")) return [];
    return [];
  }
}

export async function unsubscribe(subscriberId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, serverTimestamp } = modules.firestore;
  await updateDoc(doc(db, "subscribers", subscriberId), {
    status: "inactive",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSubscriber(subscriberId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, deleteDoc } = modules.firestore;
  await deleteDoc(doc(db, "subscribers", subscriberId));
}

// ---- Newsletters ----

export interface Newsletter {
  id: string;
  title: string;
  subject: string;
  content: string;
  status: "draft" | "published";
  createdAt: any;
  publishedAt?: any;
  totalSent?: number;
}

export async function getNewsletters(): Promise<Newsletter[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, orderBy, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(query(collection(db, "newsletters"), orderBy("createdAt", "desc")));
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Newsletter));
  } catch (error: any) {
    const code = error?.code || "";
    const msg = error?.message || "";
    if (code === "permission-denied" || msg.includes("insufficient permissions")) return [];
    return [];
  }
}

export async function getNewsletter(id: string): Promise<Newsletter | null> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return null;

  const { doc, getDoc } = modules.firestore;
  const snap = await getDoc(doc(db, "newsletters", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Newsletter;
}

export async function saveNewsletterDraft(data: {
  title: string;
  subject: string;
  content: string;
}): Promise<string> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { collection, addDoc, serverTimestamp } = modules.firestore;
  const docRef = await addDoc(collection(db, "newsletters"), {
    ...data,
    status: "draft",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateNewsletter(
  id: string,
  data: Partial<{ title: string; subject: string; content: string }>
): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, serverTimestamp } = modules.firestore;
  await updateDoc(doc(db, "newsletters", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteNewsletter(id: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, deleteDoc } = modules.firestore;
  await deleteDoc(doc(db, "newsletters", id));
}

export async function publishNewsletter(
  id: string,
  subject: string,
  content: string,
  onProgress?: (sent: number, total: number) => void
): Promise<number> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, updateDoc, serverTimestamp } = modules.firestore;

  const subscribers = await getActiveSubscribers();
  if (subscribers.length === 0) throw new Error("no-subscribers");

  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID;
  const publicId = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicId) {
    throw new Error("EmailJS configuration missing");
  }

  let sentCount = 0;
  const batchSize = 5;

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    const promises = batch.map((sub) =>
      emailjs
        .send(
          serviceId,
          templateId,
          {
            to_email: sub.email,
            subject,
            message: content,
            from_name: "OMNIA Travel",
          },
          publicId
        )
        .then(() => {
          sentCount++;
          onProgress?.(sentCount, subscribers.length);
        })
        .catch((err) => {
          console.error("Email failed for:", sub.email, err?.text || err?.message || err);
        })
    );

    await Promise.all(promises);

    if (i + batchSize < subscribers.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  await updateDoc(doc(db, "newsletters", id), {
    status: "published",
    publishedAt: serverTimestamp(),
    totalSent: sentCount,
  });

  return sentCount;
}