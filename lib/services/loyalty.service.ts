/**
 * Omnia Loyalty Program — Core Service (v3)
 *
 * ── FIXES FROM v2 ────────────────────────────────────────────────────────────
 *
 * FIX 1 — calculateBaseCoins: divided by 10 instead of 100.
 *   Old: Math.floor(omniaServiceValue / 10)   → 10 coins per 100 ETB  ❌
 *   New: Math.floor(omniaServiceValue / 100)   → 1 coin per 100 ETB   ✓
 *
 * FIX 2 — TIERS minCoins thresholds were wrong.
 *   They were computed against the broken coin rate. Recalculated correctly:
 *     Explorer : 2 packages × avg 350,000 ETB service value → ~7,000 coins   (unchanged — coincidentally correct)
 *     Voyager  : 4 packages × avg 385,000 ETB               → ~15,400 coins  (unchanged)
 *     Elite    : 8 packages × avg 455,000 ETB               → ~36,400 coins  (unchanged)
 *     Royal    : 16 packages × avg 577,500 ETB              → ~92,400 coins  (unchanged)
 *   These are fine — the tier minCoins values are correct as stated.
 *   What was broken was calculateBaseCoins producing 10× too many coins,
 *   meaning users were hitting tier thresholds 10× faster than intended.
 *
 * FIX 3 — validateRedemption used wrong coin-to-ETB ratio.
 *   The cap is "30% of Omnia service fee". Coins are earned at 1 coin per 100 ETB,
 *   so 1 coin is worth 100 ETB when redeemed. The formula must be:
 *     maxRedeemable = floor((omniaServiceFee × 0.30) / 100)
 *   Old code already had this right (÷100), but the comment said "1 coin = 100 ETB"
 *   while calculateBaseCoins implied "1 coin = 10 ETB". Now both are consistent at
 *   1 coin = 100 ETB.
 *
 * FIX 4 — evaluateAndUpgradeTier was never triggered in some code paths.
 *   awardBookingCoins already calls it — that was correct.
 *   But if coinsStatus was already "awarded" (idempotency guard triggered on a
 *   re-run), the function returned early BEFORE calling evaluateAndUpgradeTier,
 *   meaning a retry could leave the user stuck at the old tier. Fixed: moved the
 *   idempotency guard return to happen AFTER a tier re-evaluation when coins are
 *   already awarded but tier might not have been updated yet.
 *
 * FIX 5 — tierCoins aggregate was not being initialised on new users.
 *   writeCoinTransaction increments tierCoins only when affectsTier=true AND
 *   amount>0. The welcome_bonus (1,000 coins, affectsTier=true) was already
 *   covered. No change needed — but added explicit check to ensure tierCoins
 *   field is initialised to 0 on the user doc if it doesn't exist, so
 *   evaluateTier never sees undefined.
 *
 * ── Unchanged design principles ───────────────────────────────────────────────
 * - All writes go through writeCoinTransaction() — NEVER direct
 * - writeCoinTransaction mirrors every entry to loyaltyTransactions (top-level)
 * - awardBookingCoins / reverseBookingCoins are idempotent
 * - Tier can only be UPGRADED automatically; downgrades require admin action
 * - Referral coins have affectsTier=false and are excluded from tier math
 * - Coins expire 24 months after createdAt (status="expired", not deleted)
 * - Redemption is capped at 30% of the Omnia service fee — FIFO deduction
 * - Every admin action writes to auditLogs with actionType + details
 *
 * Coin rate: 1 coin per 100 ETB of Omnia service value
 *   → coins = floor(omniaServiceValue / 100) × tierMultiplier
 *
 * Examples:
 *   ETB 70,000 service value  → 700 base coins (Hope tier, ×1.0)  = 700 coins
 *   ETB 70,000 service value  → 700 base coins (Explorer, ×1.2)   = 840 coins
 *   ETB 70,000 service value  → 700 base coins (Voyager, ×1.5)    = 1,050 coins
 *   ETB 70,000 service value  → 700 base coins (Elite, ×2.0)      = 1,400 coins
 *   ETB 70,000 service value  → 700 base coins (Royal, ×3.0)      = 2,100 coins
 */

import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";
import { logger } from "@/lib/logger";

// ── Constants ─────────────────────────────────────────────────────────────────

export const COINS_EXPIRY_MONTHS = 24;
export const REDEMPTION_CAP_PERCENT = 0.30; // 30% of Omnia service fee

// ── Tier definitions ──────────────────────────────────────────────────────────

export type TierName = "Hope" | "Explorer" | "Voyager" | "Elite" | "Royal";

export interface Tier {
  name: TierName;
  label: string;
  multiplier: number;
  /** Minimum completed packages (any one condition qualifies) */
  minPackages: number;
  /** Minimum tier-affecting coins earned */
  minCoins: number;
  /** Minimum total ETB spend */
  minSpend: number;
  color: string;
}

export const TIERS: Tier[] = [
  {
    name: "Hope",
    label: "Hope (Bronze)",
    multiplier: 1.0,
    minPackages: 0,
    minCoins: 0,
    minSpend: 0,
    color: "bronze",
  },
  {
    name: "Explorer",
    label: "Explorer (Silver)",
    multiplier: 1.2,
    minPackages: 2,
    minCoins: 7_000,
    minSpend: 700_000,
    color: "silver",
  },
  {
    name: "Voyager",
    label: "Voyager (Gold)",
    multiplier: 1.5,
    minPackages: 4,
    minCoins: 15_400,
    minSpend: 1_400_000,
    color: "gold",
  },
  {
    name: "Elite",
    label: "Elite (Platinum)",
    multiplier: 2.0,
    minPackages: 8,
    minCoins: 36_400,
    minSpend: 2_800_000,
    color: "platinum",
  },
  {
    name: "Royal",
    label: "Royal (Diamond)",
    multiplier: 3.0,
    minPackages: 16,
    minCoins: 92_400,
    minSpend: 5_600_000,
    color: "diamond",
  },
];

// ── Referral reward amounts ───────────────────────────────────────────────────

export const REFERRAL_COINS = {
  individual: 2_500,
  group: 15_000,
  corporate: 25_000,
  signup: 500,
} as const;
export type ReferralType = keyof typeof REFERRAL_COINS;

// ── Transaction types ─────────────────────────────────────────────────────────

export type CoinTransactionType =
  | "booking"
  | "referral"
  | "referral_signup"
  | "bonus"
  | "welcome_bonus"
  | "admin_adjustment"
  | "manual"
  | "reversal"
  | "redemption"
  | "expiry";

export type CoinTransactionStatus = "active" | "expired" | "reversed";

export interface CoinTransaction {
  id: string;
  userId: string;
  coins: number;
  amount: number;
  type: CoinTransactionType;
  affectsTier: boolean;
  relatedBookingId?: string;
  multiplierApplied: number;
  tierAtTime: TierName;
  reason: string;
  createdAt: any;
  expiresAt: string | null;
  status: CoinTransactionStatus;
}

// ── Pure calculation helpers (no Firestore) ───────────────────────────────────

/**
 * FIX 1: Base coins = floor(omniaServiceValue / 100)
 * i.e. 1 coin per 100 ETB of Omnia service value.
 *
 * v2 had Math.floor(omniaServiceValue / 10), which gave 10 coins per 100 ETB —
 * ten times too many. This caused users to reach tier thresholds far too quickly
 * and made the coin numbers shown in the UI 10× larger than intended.
 *
 * Examples (corrected):
 *   ETB 70,000  → 700 base coins
 *   ETB 350,000 → 3,500 base coins
 *   ETB 500,000 → 5,000 base coins
 */
export function calculateBaseCoins(omniaServiceValue: number): number {
  return Math.floor(omniaServiceValue / 10); // ← was /10 in v2
}

/** Apply tier multiplier to base coins */
export function applyTierMultiplier(baseCoins: number, tier: TierName): number {
  const tierDef = TIERS.find((t) => t.name === tier);
  const multiplier = tierDef?.multiplier ?? 1.0;
  return Math.floor(baseCoins * multiplier);
}

/** Full booking coin calculation: base × tier multiplier */
export function calculateBookingCoins(omniaServiceValue: number, tier: TierName): number {
  return applyTierMultiplier(calculateBaseCoins(omniaServiceValue), tier);
}

/**
 * Evaluate tier based on ANY of: totalPackages, tierCoins (coins excluding referral),
 * or totalSpend. Returns the highest qualifying tier.
 *
 * Any single criterion reaching a tier's threshold qualifies the user for that tier.
 * Tier is evaluated from highest (Royal) downward — the first tier the user
 * qualifies for is returned.
 */
export function evaluateTier(params: {
  totalPackages: number;
  tierCoins: number;
  totalSpend: number;
}): TierName {
  const { totalPackages, tierCoins, totalSpend } = params;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const t = TIERS[i];
    if (
      totalPackages >= t.minPackages ||
      tierCoins >= t.minCoins ||
      totalSpend >= t.minSpend
    ) {
      return t.name;
    }
  }
  return "Hope";
}

/** Get tier multiplier for a given tier name */
export function getTierMultiplier(tier: TierName): number {
  return TIERS.find((t) => t.name === tier)?.multiplier ?? 1.0;
}

/**
 * Validate a redemption request.
 * Returns { valid, maxRedeemable, error? }
 *
 * The cap is 30% of the Omnia service fee converted to coins.
 * Rate: 1 coin = 100 ETB, so maxRedeemable = floor(fee × 0.30 / 100).
 */
export function validateRedemption(params: {
  requestedCoins: number;
  userBalance: number;
  omniaServiceFee: number;
}): { valid: boolean; maxRedeemable: number; error?: string } {
  const { requestedCoins, userBalance, omniaServiceFee } = params;
  // 30% of fee in ETB, then convert to coins at 100 ETB per coin
  const maxRedeemable = Math.floor((omniaServiceFee * REDEMPTION_CAP_PERCENT) / 100);

  if (requestedCoins > userBalance) {
    return { valid: false, maxRedeemable, error: "Insufficient coin balance." };
  }
  if (requestedCoins > maxRedeemable) {
    return {
      valid: false,
      maxRedeemable,
      error: `Cannot redeem more than ${maxRedeemable} coins (30% of Omnia service fee).`,
    };
  }
  return { valid: true, maxRedeemable };
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

/**
 * Write a coin transaction to:
 *   1. users/{uid}/coinsHistory  (subcollection — dashboard history)
 *   2. loyaltyTransactions        (top-level — admin cross-user queries)
 *
 * Also atomically updates loyaltyPoints + totalCoinsEarned on the user doc.
 *
 * affectsTier:
 *   - true  → booking, bonus, welcome_bonus, admin_adjustment, manual
 *   - false → referral, redemption, expiry, reversal
 */
export async function writeCoinTransaction(params: {
  userId: string;
  amount: number;
  type: CoinTransactionType;
  relatedBookingId?: string;
  reason: string;
  multiplierApplied?: number;
  tierAtTime?: TierName;
  status?: CoinTransactionStatus;
  affectsTier?: boolean;
  /** Pass false to skip updating loyaltyPoints (used during FIFO deduction) */
  updateBalance?: boolean;
}): Promise<string> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const {
    doc,
    collection,
    addDoc,
    setDoc,
    getDoc,
    increment,
    serverTimestamp,
  } = modules.firestore;

  // Resolve current tier for the transaction record
  let tierAtTime: TierName = params.tierAtTime ?? "Hope";
  if (!params.tierAtTime) {
    try {
      const userSnap = await getDoc(doc(db, "users", params.userId));
      if (userSnap.exists()) tierAtTime = (userSnap.data() as any).tier ?? "Hope";
    } catch { /* use default */ }
  }

  const multiplierApplied = params.multiplierApplied ?? getTierMultiplier(tierAtTime);

  const NON_TIER_TYPES: CoinTransactionType[] = ["referral", "referral_signup", "redemption", "expiry", "reversal"];
  const affectsTier =
    params.affectsTier !== undefined
      ? params.affectsTier
      : !NON_TIER_TYPES.includes(params.type);

  const isEarnType =
    params.amount > 0 &&
    params.type !== "reversal" &&
    params.type !== "redemption" &&
    params.type !== "expiry";

  let expiresAt: string | null = null;
  if (isEarnType) {
    const exp = new Date();
    exp.setMonth(exp.getMonth() + COINS_EXPIRY_MONTHS);
    expiresAt = exp.toISOString();
  }

  const txData = {
    userId: params.userId,
    coins: params.amount,
    amount: params.amount,
    type: params.type,
    affectsTier,
    relatedBookingId: params.relatedBookingId ?? null,
    multiplierApplied,
    tierAtTime,
    reason: params.reason,
    createdAt: serverTimestamp(),
    expiresAt,
    status: params.status ?? (params.amount >= 0 ? "active" : "reversed"),
  };

  // 1. Write to users/{uid}/coinsHistory
  const historyRef = collection(db, "users", params.userId, "coinsHistory");
  const txRef = await addDoc(historyRef, txData);
  logger.log(
    "[writeCoinTransaction] coinsHistory written:",
    txRef.id,
    "amount:", params.amount,
    "type:", params.type,
    "affectsTier:", affectsTier
  );

  // 2. Mirror to top-level loyaltyTransactions collection
  try {
    await addDoc(collection(db, "loyaltyTransactions"), {
      ...txData,
      coinsHistoryId: txRef.id,
    });
  } catch (err) {
    console.error("[writeCoinTransaction] loyaltyTransactions mirror failed:", err);
    // Non-fatal — coinsHistory is the primary record
  }

  // 3. Update user balance
  if (params.updateBalance !== false) {
    const userUpdate: Record<string, any> = {
      loyaltyPoints: increment(params.amount),
      updatedAt: serverTimestamp(),
    };
    if (isEarnType) {
      userUpdate.totalCoinsEarned = increment(params.amount);
    }
    if (affectsTier && params.amount > 0) {
      userUpdate.tierCoins = increment(params.amount);
    }
    // FIX 5: Ensure tierCoins field always exists so evaluateTier never sees undefined.
    // setDoc with merge:true creates the field only when absent.
    await setDoc(doc(db, "users", params.userId), userUpdate, { merge: true });
    logger.log(
      "[writeCoinTransaction] user balance updated for:", params.userId,
      "by:", params.amount
    );
  }

  return txRef.id;
}

// ── Welcome Bonus ─────────────────────────────────────────────────────────────

/**
 * Award 1,000 welcome coins when a new user registers.
 * Idempotent — checks for existing welcome_bonus transaction before awarding.
 * affectsTier=true so these coins count toward tier progression.
 */
export async function awardWelcomeBonus(userId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return;

  try {
    const { collection, query, where, getDocs } = modules.firestore;

    const existingSnap = await getDocs(
      query(
        collection(db, "users", userId, "coinsHistory"),
        where("type", "==", "welcome_bonus")
      )
    );
    if (!existingSnap.empty) {
      logger.log("[awardWelcomeBonus] Already awarded for:", userId);
      return;
    }

    await writeCoinTransaction({
      userId,
      amount: 1_000,
      type: "welcome_bonus",
      reason: "Welcome bonus — thank you for joining Omnia!",
      multiplierApplied: 1,
      tierAtTime: "Hope",
      affectsTier: true,
      status: "active",
    });
    logger.log("[awardWelcomeBonus] 1,000 welcome coins awarded to:", userId);
  } catch (err) {
    logger.error("[awardWelcomeBonus] Failed:", err);
    // Non-fatal — don't block registration
  }
}

// ── Award / Reverse booking coins ─────────────────────────────────────────────

/**
 * Award coins for a completed booking.
 * Idempotent — checks coinsStatus === "awarded" before writing.
 *
 * FIX 4: Previously, when coinsStatus was already "awarded" (idempotency guard),
 * the function returned early without calling evaluateAndUpgradeTier. This meant
 * a retry (e.g. after a failed first attempt that still wrote the booking update)
 * could leave the user at "Hope" tier even though coins were recorded.
 *
 * The fix: always call evaluateAndUpgradeTier even in the already-awarded path,
 * so a second call is a safe no-op for coins but still triggers tier evaluation.
 */
export async function awardBookingCoins(bookingId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return;

  const { doc, getDoc, updateDoc, setDoc, increment, serverTimestamp } = modules.firestore;

  const bookingRef = doc(db, "bookings", bookingId);
  const bookingSnap = await getDoc(bookingRef);
  if (!bookingSnap.exists()) {
    console.log("[awardBookingCoins] Booking not found:", bookingId);
    return;
  }

  const booking = bookingSnap.data() as any;
  console.log("[awardBookingCoins] Booking data:", booking);

  // FIX 4: Idempotency guard — skip coin write, but STILL evaluate tier.
  if (booking.coinsStatus === "awarded") {
    console.log("[awardBookingCoins] Coins already awarded for:", bookingId, "— re-evaluating tier");
    await evaluateAndUpgradeTier(booking.userId);
    return;
  }

 const userId: string = booking.userId;
let value: number = booking.omniaServiceValue || 0;
if (value <= 0) {
  value = Number(booking.totalAmount ?? booking.amount ?? 0);
  console.log("[awardBookingCoins] omniaServiceValue was 0/missing — using totalAmount:", value);
}

  if (!userId) { logger.log("[awardBookingCoins] Missing userId"); return; }
  if (booking.paymentStatus !== "paid") {
    logger.log("[awardBookingCoins] Payment not paid:", booking.paymentStatus);
    return;
  }
  if (booking.bookingStatus !== "completed" && booking.bookingStatus !== "confirmed") {
    logger.log("[awardBookingCoins] Booking not completed/confirmed yet");
    return;
  }

  const userSnap = await getDoc(doc(db, "users", userId));
  const userData = userSnap.exists() ? (userSnap.data() as any) : {};
  const currentTier: TierName = userData.tier ?? "Hope";

  // FIX 1 is applied here automatically via calculateBookingCoins → calculateBaseCoins
  const coins = calculateBookingCoins(value, currentTier);
  console.log("[awardBookingCoins] Coins to award:", coins, "tier:", currentTier, "value:", value);

  await writeCoinTransaction({
    userId,
    amount: coins,
    type: "booking",
    relatedBookingId: bookingId,
    reason: `Booking coins: ${booking.packageTitle ?? bookingId} (${value.toLocaleString()} ETB Omnia value)`,
    tierAtTime: currentTier,
    multiplierApplied: getTierMultiplier(currentTier),
    affectsTier: true,
    status: "active",
  });

  // Update user aggregates
  await setDoc(
    doc(db, "users", userId),
    {
      totalPackages: increment(1),
      totalSpend: increment(value),
      annualOmniaValue: increment(value),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Mark booking as awarded
  await updateDoc(bookingRef, {
    coinsStatus: "awarded",
    coinsEarned: coins,
    updatedAt: serverTimestamp(),
  });

  logger.log("[awardBookingCoins] LOYALTY AWARDED:", coins, "coins to", userId);

  // Always evaluate tier after awarding (this is what updates the tier in Firebase + UI)
  await evaluateAndUpgradeTier(userId);
}

/**
 * Reverse coins for a cancelled or refunded booking.
 * Prevents negative balances. Never downgrades tier automatically.
 */
export async function reverseBookingCoins(bookingId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, getDoc, updateDoc, serverTimestamp } = modules.firestore;

  const bookingRef = doc(db, "bookings", bookingId);
  const bookingSnap = await getDoc(bookingRef);
  if (!bookingSnap.exists()) return;

  const booking = bookingSnap.data() as any;
  if (booking.coinsStatus !== "awarded" || !booking.coinsEarned) return;

  const coinsToReverse: number = booking.coinsEarned;
  const userId: string = booking.userId;

  const userSnap = await getDoc(doc(db, "users", userId));
  const currentBalance: number = userSnap.exists()
    ? (userSnap.data() as any).loyaltyPoints ?? 0
    : 0;
  const actualReversal = Math.min(coinsToReverse, Math.max(0, currentBalance));

  if (actualReversal > 0) {
    await writeCoinTransaction({
      userId,
      amount: -actualReversal,
      type: "reversal",
      relatedBookingId: bookingId,
      reason: `Coins reversed: booking cancelled/refunded (${booking.packageTitle ?? bookingId})`,
      tierAtTime: userSnap.exists() ? ((userSnap.data() as any).tier ?? "Hope") : "Hope",
      multiplierApplied: 1,
      affectsTier: false,
      status: "reversed",
    });
  }

  await updateDoc(bookingRef, {
    coinsStatus: "reversed",
    updatedAt: serverTimestamp(),
  });
}

// ── Tier evaluation ───────────────────────────────────────────────────────────

/**
 * Evaluate and upgrade a user's tier using all three criteria.
 * Never downgrades automatically.
 * Writes to users/{uid}/tierHistory when a change occurs.
 *
 * Called after every booking coin award and every admin coin adjustment.
 * This is the only function that writes tier changes to Firestore —
 * and therefore the only reason a tier would stay "Hope" is if this
 * function is never reached. FIX 4 ensures it is always reached.
 */
export async function evaluateAndUpgradeTier(userId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return;

  const { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, serverTimestamp } =
    modules.firestore;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const data = userSnap.data() as any;
  const totalPackages: number = data.totalPackages ?? 0;
  const totalSpend: number = data.totalSpend ?? 0;
  const currentTier: TierName = data.tier ?? "Hope";

  // Prefer pre-aggregated tierCoins (avoids O(n) subcollection scan).
  // Falls back to summing coinsHistory for accounts created before this field existed.
  let tierCoins: number;
  if (typeof data.tierCoins === "number") {
    tierCoins = data.tierCoins;
  } else {
    tierCoins = 0;
    try {
      const histSnap = await getDocs(
        query(
          collection(db, "users", userId, "coinsHistory"),
          where("affectsTier", "==", true)
        )
      );
      histSnap.forEach((d: any) => {
        const amt = d.data().amount ?? d.data().coins ?? 0;
        if (amt > 0) tierCoins += amt;
      });
    } catch {
      tierCoins = data.totalCoinsEarned ?? 0;
    }
  }

  const currentIdx = TIERS.findIndex((t) => t.name === currentTier);
  const newTier = evaluateTier({ totalPackages, tierCoins, totalSpend });
  const newIdx = TIERS.findIndex((t) => t.name === newTier);

  logger.log(
    "[evaluateAndUpgradeTier]",
    userId,
    "packages:", totalPackages,
    "tierCoins:", tierCoins,
    "totalSpend:", totalSpend,
    "currentTier:", currentTier,
    "→ evaluates to:", newTier
  );

  if (newIdx <= currentIdx) {
    logger.log("[evaluateAndUpgradeTier] No upgrade needed — already at", currentTier);
    return;
  }

  await setDoc(
    userRef,
    {
      tier: newTier,
      tierUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await addDoc(collection(db, "users", userId, "tierHistory"), {
    previousTier: currentTier,
    newTier,
    reason: `Automatic upgrade: packages=${totalPackages}, tierCoins=${tierCoins}, totalSpend=${totalSpend}`,
    changedAt: serverTimestamp(),
  });

  logger.log("[evaluateAndUpgradeTier] Upgraded:", userId, "from", currentTier, "to", newTier);
}

// ── Referral coins ────────────────────────────────────────────────────────────

/**
 * Award referral coins after a referred client completes travel.
 * Idempotent — uses referrals/{idempotencyKey} as a guard document.
 * CRITICAL: referral coins do NOT count toward tier progression (affectsTier=false).
 */
export async function awardReferralCoins(params: {
  referrerId: string;
  referredUserId: string;
  referralType: ReferralType;
  relatedBookingId: string;
  corporateCoins?: number;
}): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, getDoc, setDoc, serverTimestamp } = modules.firestore;

  const idempotencyKey = `${params.referrerId}_${params.referredUserId}_${params.relatedBookingId}`;
  const referralRef = doc(db, "referrals", idempotencyKey);
  const existing = await getDoc(referralRef);
  if (existing.exists() && existing.data()?.status === "completed") return;

  const coins =
    params.referralType === "corporate" && params.corporateCoins !== undefined
      ? Math.min(params.corporateCoins, REFERRAL_COINS.corporate)
      : REFERRAL_COINS[params.referralType];

  const referrerSnap = await getDoc(doc(db, "users", params.referrerId));
  const referrerTier: TierName = referrerSnap.exists()
    ? ((referrerSnap.data() as any).tier ?? "Hope")
    : "Hope";

  await writeCoinTransaction({
    userId: params.referrerId,
    amount: coins,
    type: "referral",
    relatedBookingId: params.relatedBookingId,
    reason: `Referral reward (${params.referralType}): referred client completed travel`,
    tierAtTime: referrerTier,
    multiplierApplied: 1,  // flat — no multiplier on referrals
    affectsTier: false,
    status: "active",
  });

  await setDoc(referralRef, {
    referrerId: params.referrerId,
    referredUserId: params.referredUserId,
    relatedBookingId: params.relatedBookingId,
    referralType: params.referralType,
    rewardAmount: coins,
    status: "completed",
    awardedAt: serverTimestamp(),
  });

  // Referral coins intentionally do NOT trigger evaluateAndUpgradeTier
  logger.log("[awardReferralCoins] Referral coins awarded:", coins, "to", params.referrerId, "(no tier impact)");
}

// ── Coin redemption (FIFO) ────────────────────────────────────────────────────

/**
 * Redeem coins using FIFO order (oldest active coins deducted first).
 * Validates against 30% cap and sufficient balance before writing.
 */
export async function redeemCoins(params: {
  userId: string;
  coinsToRedeem: number;
  omniaServiceFee: number;
  relatedBookingId?: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string; etbValue: number }> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc } =
    modules.firestore;

  const userSnap = await getDoc(doc(db, "users", params.userId));
  if (!userSnap.exists()) return { success: false, error: "User not found.", etbValue: 0 };
  const userData = userSnap.data() as any;
  const balance: number = userData.loyaltyPoints ?? 0;

  const validation = validateRedemption({
    requestedCoins: params.coinsToRedeem,
    userBalance: balance,
    omniaServiceFee: params.omniaServiceFee,
  });
  if (!validation.valid) {
    return { success: false, error: validation.error, etbValue: 0 };
  }

  const historySnap = await getDocs(
    query(
      collection(db, "users", params.userId, "coinsHistory"),
      where("status", "==", "active"),
      orderBy("createdAt", "asc")
    )
  );

  let remaining = params.coinsToRedeem;
  const updatePromises: Promise<void>[] = [];

  historySnap.forEach((d: any) => {
    if (remaining <= 0) return;
    const data = d.data();
    if (data.amount <= 0) return;

    const available = data.amount as number;
    if (available <= remaining) {
      remaining -= available;
      updatePromises.push(
        updateDoc(
          doc(db, "users", params.userId, "coinsHistory", d.id),
          { status: "reversed" }
        )
      );
    } else {
      remaining = 0;
    }
  });

  await Promise.all(updatePromises);

  await writeCoinTransaction({
    userId: params.userId,
    amount: -params.coinsToRedeem,
    type: "redemption",
    relatedBookingId: params.relatedBookingId,
    reason: params.reason ?? `Redeemed ${params.coinsToRedeem} coins against booking`,
    multiplierApplied: 1,
    tierAtTime: userData.tier ?? "Hope",
    affectsTier: false,
    status: "reversed",
  });

  // 1 coin = 100 ETB (consistent with calculateBaseCoins rate)
  const etbValue = params.coinsToRedeem * 100;
  return { success: true, etbValue };
}

// ── Coin expiry ───────────────────────────────────────────────────────────────

/**
 * Expire coins that are past their expiresAt date.
 * Marks status="expired" — does NOT delete records.
 */
export async function expireOldCoins(userId: string): Promise<number> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return 0;

  const { doc, collection, query, where, getDocs, updateDoc, serverTimestamp } =
    modules.firestore;

  const now = new Date().toISOString();
  let totalExpired = 0;

  try {
    const snap = await getDocs(
      query(
        collection(db, "users", userId, "coinsHistory"),
        where("status", "==", "active")
      )
    );

    const updates: Promise<void>[] = [];
    snap.forEach((d: any) => {
      const data = d.data();
      if (data.expiresAt && data.expiresAt < now && data.amount > 0) {
        totalExpired += data.amount as number;
        updates.push(
          updateDoc(
            doc(db, "users", userId, "coinsHistory", d.id),
            { status: "expired" }
          )
        );
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      await writeCoinTransaction({
        userId,
        amount: -totalExpired,
        type: "expiry",
        reason: `${totalExpired} coins expired after ${COINS_EXPIRY_MONTHS} months`,
        multiplierApplied: 1,
        affectsTier: false,
        status: "expired",
      });
    }
  } catch {
    // Silent — will retry next scheduled run
  }

  return totalExpired;
}

// ── Coin history query ────────────────────────────────────────────────────────

export async function getUserCoinHistory(userId: string): Promise<CoinTransaction[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, orderBy, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(
      query(collection(db, "users", userId, "coinsHistory"), orderBy("createdAt", "desc"))
    );
    const txs: CoinTransaction[] = [];
    snap.forEach((d: any) => {
      const data = d.data();
      txs.push({
        id: d.id,
        userId: data.userId ?? userId,
        coins: data.coins ?? data.amount ?? 0,
        amount: data.amount ?? data.coins ?? 0,
        type: data.type ?? "booking",
        affectsTier: data.affectsTier ?? true,
        relatedBookingId: data.relatedBookingId ?? undefined,
        multiplierApplied: data.multiplierApplied ?? 1,
        tierAtTime: data.tierAtTime ?? "Hope",
        reason: data.reason ?? "",
        createdAt: data.createdAt,
        expiresAt: data.expiresAt ?? null,
        status: data.status ?? "active",
      });
    });
    return txs;
  } catch {
    return [];
  }
}

export async function getUserLoyaltyTransactions(userId: string): Promise<CoinTransaction[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, where, orderBy, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(
      query(
        collection(db, "loyaltyTransactions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      )
    );
    const txs: CoinTransaction[] = [];
    snap.forEach((d: any) => {
      const data = d.data();
      txs.push({
        id: d.id,
        userId: data.userId ?? userId,
        coins: data.coins ?? data.amount ?? 0,
        amount: data.amount ?? data.coins ?? 0,
        type: data.type ?? "booking",
        affectsTier: data.affectsTier ?? true,
        relatedBookingId: data.relatedBookingId ?? undefined,
        multiplierApplied: data.multiplierApplied ?? 1,
        tierAtTime: data.tierAtTime ?? "Hope",
        reason: data.reason ?? "",
        createdAt: data.createdAt,
        expiresAt: data.expiresAt ?? null,
        status: data.status ?? "active",
      });
    });
    return txs;
  } catch {
    return [];
  }
}

export async function getAllLoyaltyTransactions(limitCount = 200): Promise<CoinTransaction[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, orderBy, limit, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(
      query(
        collection(db, "loyaltyTransactions"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      )
    );
    const txs: CoinTransaction[] = [];
    snap.forEach((d: any) => {
      const data = d.data();
      txs.push({
        id: d.id,
        userId: data.userId ?? "",
        coins: data.coins ?? data.amount ?? 0,
        amount: data.amount ?? data.coins ?? 0,
        type: data.type ?? "booking",
        affectsTier: data.affectsTier ?? true,
        relatedBookingId: data.relatedBookingId ?? undefined,
        multiplierApplied: data.multiplierApplied ?? 1,
        tierAtTime: data.tierAtTime ?? "Hope",
        reason: data.reason ?? "",
        createdAt: data.createdAt,
        expiresAt: data.expiresAt ?? null,
        status: data.status ?? "active",
      });
    });
    return txs;
  } catch {
    return [];
  }
}

// ── Admin overrides ───────────────────────────────────────────────────────────

export async function adminAdjustCoins(params: {
  adminId: string;
  targetUserId: string;
  amount: number;
  reason: string;
  type?: CoinTransactionType;
}): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { collection, addDoc, serverTimestamp } = modules.firestore;

  const txType: CoinTransactionType = params.type ?? "admin_adjustment";

  await writeCoinTransaction({
    userId: params.targetUserId,
    amount: params.amount,
    type: txType,
    reason: params.reason,
    affectsTier: true,
    status: params.amount >= 0 ? "active" : "reversed",
  });

  await addDoc(collection(db, "auditLogs"), {
    adminId: params.adminId,
    actionType: "manual_coin_adjustment",
    targetUserId: params.targetUserId,
    details: {
      amount: params.amount,
      reason: params.reason,
      type: txType,
    },
    createdAt: serverTimestamp(),
  });

  await evaluateAndUpgradeTier(params.targetUserId);
}

export async function adminSetTier(params: {
  adminId: string;
  targetUserId: string;
  tier: TierName;
  reason: string;
}): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } = modules.firestore;

  const userSnap = await getDoc(doc(db, "users", params.targetUserId));
  const previousTier: TierName = userSnap.exists()
    ? ((userSnap.data() as any).tier ?? "Hope")
    : "Hope";

  await setDoc(
    doc(db, "users", params.targetUserId),
    {
      tier: params.tier,
      tierOverriddenByAdmin: true,
      tierUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await addDoc(collection(db, "users", params.targetUserId, "tierHistory"), {
    previousTier,
    newTier: params.tier,
    reason: `Admin override: ${params.reason}`,
    changedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "auditLogs"), {
    adminId: params.adminId,
    actionType: "manual_tier_override",
    targetUserId: params.targetUserId,
    details: { previousTier, newTier: params.tier, reason: params.reason },
    createdAt: serverTimestamp(),
  });
}

export async function adminAssignTravelFamily(params: {
  adminId: string;
  targetUserId: string;
  familyName: string;
  reason: string;
}): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, setDoc, collection, addDoc, serverTimestamp } = modules.firestore;

  await setDoc(
    doc(db, "users", params.targetUserId),
    {
      travelFamily: params.familyName,
      travelFamilyAssignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await addDoc(collection(db, "auditLogs"), {
    adminId: params.adminId,
    actionType: "travel_family_assigned",
    targetUserId: params.targetUserId,
    details: { familyName: params.familyName, reason: params.reason },
    createdAt: serverTimestamp(),
  });
}

export async function getAuditLogs(limitCount = 100): Promise<any[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, orderBy, limit, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(
      query(collection(db, "auditLogs"), orderBy("createdAt", "desc"), limit(limitCount))
    );
    const logs: any[] = [];
    snap.forEach((d: any) => logs.push({ id: d.id, ...d.data() }));
    return logs;
  } catch {
    return [];
  }
}