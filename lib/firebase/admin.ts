/**
 * Firebase Admin SDK — server-only module.
 * Used exclusively inside Next.js API routes (/app/api/**).
 * Bypasses Firestore security rules with full privilege.
 * NEVER import this file in any client component ('use client').
 */

import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === "admin-app");
  if (existing) return existing;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "[Firebase Admin] Missing env vars: FIREBASE_ADMIN_CLIENT_EMAIL or FIREBASE_ADMIN_PRIVATE_KEY"
    );
  }

  return initializeApp(
    {
      credential: cert({ projectId, clientEmail, privateKey }),
    },
    "admin-app"
  );
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
