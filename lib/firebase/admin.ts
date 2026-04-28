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
  // Normalize the private key to handle all Vercel/local env var formats:
  //  - Local .env:  literal \n in the string (Node dotenv parses them as real newlines)
  //  - Vercel UI:   may store as \\n (double-escaped) or as a single-line with literal "\n"
  // We strip surrounding quotes first (if any), then replace every variant of \n with a real newline.
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "";
  const privateKey = rawKey
    .replace(/^["']|["']$/g, "")   // strip accidental surrounding quotes
    .replace(/\\n/g, "\n");         // convert escaped \n → real newline

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
