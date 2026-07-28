/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║           OMNIA — PRE-LAUNCH PRODUCTION DATA RESET                      ║
 * ║                                                                          ║
 * ║  ONE-TIME USE ONLY. Irreversible. Take a Firestore backup first.        ║
 * ║                                                                          ║
 * ║  DELETES:                                                                ║
 * ║    • All bookings                                                        ║
 * ║    • All referrals                                                       ║
 * ║    • All loyaltyTransactions                                             ║
 * ║    • All rewards                                                         ║
 * ║    • All non-admin user documents + their subcollections                 ║
 * ║    • Firebase Auth accounts for all non-admin users                      ║
 * ║                                                                          ║
 * ║  PRESERVES:                                                              ║
 * ║    • packages, tours, destinations                                       ║
 * ║    • admins collection + admin Auth accounts                             ║
 * ║    • subscribers, newsletters, news, auditLogs                           ║
 * ║    • All app code, config, payment settings                              ║
 * ║                                                                          ║
 * ║  Usage:                                                                  ║
 * ║    Dry run (preview only, no writes):                                    ║
 * ║      node scripts/pre-launch-reset.mjs --dry-run                        ║
 * ║                                                                          ║
 * ║    Live run (permanently deletes data):                                  ║
 * ║      node scripts/pre-launch-reset.mjs                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── CLI flags ─────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");

// ── Load .env.local manually (same approach as backfill-referral-codes.mjs) ──
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

// ── Init Firebase Admin ───────────────────────────────────────────────────────
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
const auth = getAuth();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Delete all docs in a collection in batches of 400 */
async function deleteCollection(collectionName) {
  const snap = await db.collection(collectionName).get();
  if (snap.empty) {
    console.log(`  ℹ️  ${collectionName}: empty — nothing to delete`);
    return 0;
  }

  console.log(`  📋 ${collectionName}: found ${snap.size} document(s) to delete`);

  if (DRY_RUN) {
    snap.docs.forEach(d => console.log(`     [DRY-RUN] would delete ${collectionName}/${d.id}`));
    return snap.size;
  }

  const BATCH_SIZE = 400;
  let deleted = 0;
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
    deleted += chunk.length;
    console.log(`     ✅ Deleted batch: ${deleted}/${snap.docs.length}`);
  }
  return deleted;
}

/** Delete all docs in a subcollection of a given parent doc ref */
async function deleteSubcollection(parentRef, subcollectionName) {
  const snap = await parentRef.collection(subcollectionName).get();
  if (snap.empty) return 0;

  if (DRY_RUN) {
    console.log(`       [DRY-RUN] would delete ${snap.size} docs from ${subcollectionName}`);
    return snap.si
    ze;
  }

  const BATCH_SIZE = 400;
  let deleted = 0;
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
    deleted += chunk.length;
  }
  return deleted;
}

// ── Main reset logic ──────────────────────────────────────────────────────────
async function reset() {
  console.log("\n" + "═".repeat(70));
  if (DRY_RUN) {
    console.log("  🔍  DRY-RUN MODE — No data will be deleted");
  } else {
    console.log("  🚨  LIVE MODE — Data will be permanently deleted from Firestore");
  }
  console.log("═".repeat(70) + "\n");

  // ── Step 1: Identify admin UIDs to preserve ────────────────────────────────
  console.log("STEP 1 — Loading admin accounts to protect...");
  const adminsSnap = await db.collection("admins").get();
  const adminUids = new Set(adminsSnap.docs.map(d => d.id));
  console.log(`  🛡️  Found ${adminUids.size} admin account(s) to preserve: [${[...adminUids].join(", ")}]\n`);

  // ── Step 2: Delete all bookings ────────────────────────────────────────────
  console.log("STEP 2 — Deleting all bookings...");
  const deletedBookings = await deleteCollection("bookings");
  console.log(`  ✅ Bookings cleared: ${deletedBookings}\n`);

  // ── Step 3: Delete all referrals ───────────────────────────────────────────
  console.log("STEP 3 — Deleting all referrals...");
  const deletedReferrals = await deleteCollection("referrals");
  console.log(`  ✅ Referrals cleared: ${deletedReferrals}\n`);

  // ── Step 4: Delete all loyaltyTransactions ─────────────────────────────────
  console.log("STEP 4 — Deleting all loyaltyTransactions...");
  const deletedLoyalty = await deleteCollection("loyaltyTransactions");
  console.log(`  ✅ LoyaltyTransactions cleared: ${deletedLoyalty}\n`);

  // ── Step 5: Delete all rewards ─────────────────────────────────────────────
  console.log("STEP 5 — Deleting all rewards...");
  const deletedRewards = await deleteCollection("rewards");
  console.log(`  ✅ Rewards cleared: ${deletedRewards}\n`);

  // ── Step 6: Delete non-admin users (Firestore docs + subcollections) ────────
  console.log("STEP 6 — Deleting non-admin user documents and subcollections...");
  const usersSnap = await db.collection("users").get();
  console.log(`  📋 Found ${usersSnap.size} user doc(s) in Firestore`);

  const usersToDelete = usersSnap.docs.filter(d => !adminUids.has(d.id));
  const usersToPreserve = usersSnap.docs.filter(d => adminUids.has(d.id));

  console.log(`  🛡️  Preserving: ${usersToPreserve.length} admin user(s)`);
  console.log(`  🗑️  Deleting:   ${usersToDelete.length} non-admin user(s)\n`);

  const USER_SUBCOLLECTIONS = ["coinsHistory", "tierHistory", "favorites", "passport"];
  let deletedUserDocs = 0;

  for (const userDoc of usersToDelete) {
    const uid = userDoc.id;
    const data = userDoc.data();
    console.log(`  👤 Processing user: ${uid} (${data.email || "no email"})`);

    // Delete each subcollection first
    for (const sub of USER_SUBCOLLECTIONS) {
      const count = await deleteSubcollection(userDoc.ref, sub);
      if (count > 0) {
        console.log(`       🗑️  Deleted ${count} doc(s) from ${sub}`);
      }
    }

    // Delete the user document itself
    if (DRY_RUN) {
      console.log(`       [DRY-RUN] would delete users/${uid}`);
    } else {
      await userDoc.ref.delete();
      console.log(`       ✅ Deleted users/${uid}`);
    }
    deletedUserDocs++;
  }
  console.log(`\n  ✅ User documents processed: ${deletedUserDocs}\n`);

  // ── Step 7: Delete Firebase Auth accounts for non-admin users ───────────────
  console.log("STEP 7 — Deleting Firebase Auth accounts for non-admin users...");

  const uidsToDeleteAuth = usersToDelete.map(d => d.id);
  let deletedAuthCount = 0;

  if (uidsToDeleteAuth.length === 0) {
    console.log("  ℹ️  No non-admin users to delete from Auth\n");
  } else {
    // deleteUsers accepts up to 1000 UIDs at a time
    const AUTH_BATCH = 1000;
    for (let i = 0; i < uidsToDeleteAuth.length; i += AUTH_BATCH) {
      const chunk = uidsToDeleteAuth.slice(i, i + AUTH_BATCH);

      if (DRY_RUN) {
        console.log(`  [DRY-RUN] would delete ${chunk.length} Auth account(s):`);
        chunk.forEach(uid => console.log(`    - ${uid}`));
        deletedAuthCount += chunk.length;
      } else {
        const result = await auth.deleteUsers(chunk);
        deletedAuthCount += result.successCount;

        if (result.failureCount > 0) {
          console.warn(`  ⚠️  ${result.failureCount} Auth deletion(s) failed:`);
          result.errors.forEach(e =>
            console.warn(`     UID ${e.index}: ${e.error.message}`)
          );
        }
        console.log(`  ✅ Deleted ${result.successCount} Auth account(s) from this batch`);
      }
    }
    console.log(`\n  ✅ Firebase Auth accounts deleted: ${deletedAuthCount}\n`);
  }

  // ── Final Summary ────────────────────────────────────────────────────────────
  console.log("═".repeat(70));
  console.log(DRY_RUN ? "  🔍  DRY-RUN COMPLETE — Nothing was changed" : "  🎉  PRODUCTION RESET COMPLETE");
  console.log("═".repeat(70));
  console.log(`
  Summary:
    Bookings deleted:            ${deletedBookings}
    Referrals deleted:           ${deletedReferrals}
    Loyalty transactions deleted:${deletedLoyalty}
    Rewards deleted:             ${deletedRewards}
    User documents deleted:      ${deletedUserDocs}
    Auth accounts deleted:       ${deletedAuthCount}
    Admin accounts preserved:    ${adminUids.size}
  `);

  if (DRY_RUN) {
    console.log("  👉  Run without --dry-run to apply these changes.\n");
  } else {
    console.log("  ✅  The admin dashboard will now show 0 bookings and 0 non-admin users.");
    console.log("  ✅  All packages, destinations, and admin accounts are intact.\n");
  }
}

// ── Run ───────────────────────────────────────────────────────────────────────
reset().catch(err => {
  console.error("\n❌ Reset failed:", err);
  process.exit(1);
});
