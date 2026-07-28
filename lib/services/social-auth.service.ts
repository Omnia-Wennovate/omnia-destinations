import { getFirebaseAuth, getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";

function generateReferralCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return "OM" + Array.from(array).map(b => chars[b % chars.length]).join("");
}

export interface SocialAuthResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

async function handleSocialUser(firebaseUser: any): Promise<SocialAuthResult> {
  const uid = firebaseUser.uid;
  const email = firebaseUser.email || "";
  const displayName = firebaseUser.displayName || "";
  const firstName = displayName.split(" ")[0] || "";
  const lastName = displayName.split(" ").slice(1).join(" ") || "";

  console.log("[social-auth] handleSocialUser START — uid:", uid, "email:", email);

  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();

  if (!db || !modules.firestore) {
    // PRODUCTION DEBUG: Firebase client SDK failed to initialize.
    // This early-return path skips Firestore doc creation, welcome bonus,
    // and referral initialization entirely — logging it surfaces the issue.
    console.error(
      "[social-auth] CRITICAL: Firebase db/modules unavailable — " +
      "skipping Firestore doc creation, welcome bonus, and referral. " +
      "db:", !!db, "modules.firestore:", !!modules.firestore
    );
    return { id: uid, email, firstName, lastName, role: "USER" };
  }

  console.log("[social-auth] Firebase db/modules ready — checking if user doc exists");

  const { doc, getDoc, setDoc, serverTimestamp } = modules.firestore;
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    console.log("[social-auth] Existing user — doc found, returning early. uid:", uid);
    // Backfill missing referralCode for existing social-auth users
    if (!data.referralCode) {
      try {
        const { updateDoc } = modules.firestore;
        await updateDoc(userDocRef, { referralCode: generateReferralCode() });
      } catch {
        // Non-fatal
      }
    }
    return {
      id: uid,
      email,
      firstName: data.name?.split(" ")[0] || firstName,
      lastName: data.name?.split(" ").slice(1).join(" ") || lastName,
      role: data.role || "USER",
    };
  }

  console.log("[social-auth] New user — creating Firestore doc. uid:", uid);

  // Create user document FIRST (so /api/referral/process can find it)
  // Read referral code from localStorage before creating the doc
  const refCode = typeof window !== "undefined" ? localStorage.getItem("refCode") : null;
  const usedCode = refCode ? refCode.toUpperCase().trim() : "";

  await setDoc(userDocRef, {
    name: displayName,
    email,
    phone: firebaseUser.phoneNumber || "",
    role: "USER",
    tier: "Hope",
    loyaltyPoints: 0,
    totalCoinsEarned: 0,
    totalPackages: 0,
    totalSpend: 0,
    annualOmniaValue: 0,
    referralCode: generateReferralCode(),
    referralCodeUsed: usedCode,
    referredBy: "",          // server-side API sets this after validating the code
    totalReferrals: 0,
    createdAt: serverTimestamp(),
    authProvider: firebaseUser.providerData?.[0]?.providerId || "unknown",
  });

  console.log("[social-auth] Firestore doc created successfully. uid:", uid);

  // Apply referral from localStorage (set when user visited /signup?ref=CODE)
  // Called AFTER user doc exists so the API can update it server-side.
  if (usedCode) {
    console.log("[social-auth] Calling referral API with code:", usedCode, "for uid:", uid);
    try {
      const res = await fetch("/api/referral/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: usedCode, newUserId: uid }),
      });
      if (!res.ok) {
        // PRODUCTION FIX: fetch() resolves (does NOT throw) on HTTP 4xx/5xx.
        // Previously this was silently swallowed. Now we surface the actual error.
        const body = await res.text().catch(() => "(unreadable)");
        console.error(
          "[social-auth] Referral API returned HTTP", res.status,
          "for uid:", uid, "— body:", body
        );
      } else {
        const result = await res.json();
        if (result.referrerId) {
          console.log("[social-auth] ReferredBy set:", result.referrerId, "for uid:", uid);
        } else {
          console.log("[social-auth] Referral API response:", result);
        }
      }
    } catch (e) {
      console.error("[social-auth] Referral API network error (non-fatal):", e);
    }
    if (typeof window !== "undefined") localStorage.removeItem("refCode");
  }

  // ── Award 100 welcome bonus coins (server-side, idempotent) ──────────────
  // Mirrors the exact call in the email signup flow.
  // awardWelcomeBonusAdmin checks for an existing welcome_bonus transaction
  // before writing, so duplicate calls are always safe.
  console.log("[social-auth] Calling welcome-bonus API for uid:", uid);
  try {
    const res = await fetch("/api/auth/welcome-bonus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: uid }),
    });
    if (!res.ok) {
      // PRODUCTION FIX: fetch() resolves (does NOT throw) on HTTP 4xx/5xx.
      // Previously a 500 from the Admin SDK was silently treated as success,
      // causing the welcome bonus to be permanently skipped with no trace.
      const body = await res.text().catch(() => "(unreadable)");
      console.error(
        "[social-auth] Welcome bonus API returned HTTP", res.status,
        "for uid:", uid, "— body:", body
      );
    } else {
      const result = await res.json().catch(() => ({}));
      console.log("[social-auth] Welcome bonus API success for uid:", uid, "— result:", result);
    }
  } catch (e) {
    console.error("[social-auth] Welcome bonus API network error (non-fatal):", e);
  }

  console.log("[social-auth] handleSocialUser COMPLETE — uid:", uid);
  return { id: uid, email, firstName, lastName, role: "USER" };
}

export async function signInWithGoogle(): Promise<SocialAuthResult> {
  const auth = await getFirebaseAuth();
  const modules = await getFirebaseModules();
  if (!auth || !modules.auth) throw new Error("Authentication not initialized");

  const { GoogleAuthProvider, signInWithPopup } = modules.auth;
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  console.log("[social-auth] signInWithGoogle — calling signInWithPopup");
  const result = await signInWithPopup(auth, provider);
  if (!result.user) throw new Error("No user returned from Google sign-in");
  console.log("[social-auth] signInWithPopup SUCCESS — uid:", result.user.uid);
  return handleSocialUser(result.user);
}

export async function signInWithApple(): Promise<SocialAuthResult> {
  const auth = await getFirebaseAuth();
  const modules = await getFirebaseModules();
  if (!auth || !modules.auth) throw new Error("Authentication not initialized");

  const { OAuthProvider, signInWithPopup } = modules.auth;
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  const result = await signInWithPopup(auth, provider);
  if (!result.user) throw new Error("No user returned from Apple sign-in");
  return handleSocialUser(result.user);
}
