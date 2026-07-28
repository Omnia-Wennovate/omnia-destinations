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

  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();

  if (!db || !modules.firestore) {
    return { id: uid, email, firstName, lastName, role: "USER" };
  }

  const { doc, getDoc, setDoc, serverTimestamp } = modules.firestore;
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
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

  // Apply referral from localStorage (set when user visited /signup?ref=CODE)
  // Called AFTER user doc exists so the API can update it server-side.
  if (usedCode) {
    try {
      const res = await fetch("/api/referral/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: usedCode, newUserId: uid }),
      });
      const result = await res.json();
      if (result.referrerId) {
        console.log("ReferredBy set:", result.referrerId);
      }
    } catch {
      // Non-fatal
    }
    if (typeof window !== "undefined") localStorage.removeItem("refCode");
  }

  // ── Award 100 welcome bonus coins (server-side, idempotent) ──────────────
  // Mirrors the exact call in the email signup flow.
  // awardWelcomeBonusAdmin checks for an existing welcome_bonus transaction
  // before writing, so duplicate calls are always safe.
  try {
    await fetch("/api/auth/welcome-bonus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: uid }),
    });
    console.log("[social-auth] Welcome bonus awarded for:", uid);
  } catch (e) {
    console.error("[social-auth] Welcome bonus API failed (non-fatal):", e);
  }

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
  const result = await signInWithPopup(auth, provider);
  if (!result.user) throw new Error("No user returned from Google sign-in");
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
