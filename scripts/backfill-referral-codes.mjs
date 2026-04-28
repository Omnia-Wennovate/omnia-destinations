/**
 * One-time backfill script — generates referralCode for all users missing one.
 * Run: node scripts/backfill-referral-codes.mjs
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Load .env.local manually (no dotenv needed) ──────────────────────────────
const envPath = resolve(process.cwd(), ".env.local");
const envLines = readFileSync(envPath, "utf-8").split("\n");
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

// ── Init Firebase Admin ──────────────────────────────────────────────────────
const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "";
const privateKey = rawKey.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = getFirestore();

// ── CSPRNG referral code generator ──────────────────────────────────────────
function genCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(6);
  return "OM" + Array.from(bytes).map(b => chars[b % chars.length]).join("");
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function backfill() {
  console.log("🔍 Fetching all users...");
  const snap = await db.collection("users").get();

  const missing = snap.docs.filter(d => !d.data().referralCode);
  console.log(`📊 Total users: ${snap.size} | Missing referralCode: ${missing.length}`);

  if (missing.length === 0) {
    console.log("✅ All users already have a referralCode. Nothing to do.");
    return;
  }

  const BATCH_SIZE = 400;
  let processed = 0;

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const chunk = missing.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const docSnap of chunk) {
      const code = genCode();
      batch.update(docSnap.ref, {
        referralCode: code,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`  ✍️  ${docSnap.id} → ${code}`);
    }

    await batch.commit();
    processed += chunk.length;
    console.log(`✅ Committed batch: ${processed}/${missing.length}`);
  }

  console.log(`\n🎉 Done! ${missing.length} users now have a referralCode.`);
}

backfill().catch(err => {
  console.error("❌ Backfill failed:", err);
  process.exit(1);
});
