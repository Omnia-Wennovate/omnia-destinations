/**
 * Omnia Loyalty Program — Core Service (v2)
<<<<<<< HEAD
 * ...(see original header for full design notes)
=======
 *
 * Single source of truth for all coin calculation, tier evaluation,
 * referral logic, expiry, redemption, and admin overrides.
 *
 * Design principles:
 * - All writes go through writeCoinTransaction() — NEVER direct
 * - writeCoinTransaction mirrors every entry to loyaltyTransactions (top-level)
 * - awardBookingCoins / reverseBookingCoins are idempotent
 * - Tier can only be UPGRADED automatically; downgrades require admin action
 * - Referral coins have affectsTier=false and are excluded from tier math
 * - Coins expire 24 months after createdAt (status="expired", not deleted)
 * - Redemption is capped at 30% of the Omnia service fee — FIFO deduction
 * - Every admin action writes to auditLogs with actionType + details
 *
 * Coin rate: 1,000 coins per ETB 100,000 of Omnia service value
 *   → coins = floor(value / 100_000) × 1_000
 *   → equivalent to 1 coin per 100 ETB (same ratio as before, different constants)
>>>>>>> f4026fc (fix package)
 */

import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";
import { logger } from "@/lib/logger";

// ── Constants ─────────────────────────────────────────────────────────────────

export const ETB_PER_100K = 100_000;         // ETB per coin-block
export const COINS_PER_100K = 1_000;          // coins awarded per coin-block
export const COINS_EXPIRY_MONTHS = 24;
export const REDEMPTION_CAP_PERCENT = 0.30;   // 30% of Omnia service fee

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
} as const;
export type ReferralType = keyof typeof REFERRAL_COINS;

// ── Transaction types ─────────────────────────────────────────────────────────

export type CoinTransactionType =
  | "booking"
  | "referral"
  | "bonus"
  | "welcome_bonus"
  | "admin_adjustment"
  | "manual"          // kept for backward-compat reads
  | "reversal"
  | "redemption"
  | "expiry";

export type CoinTransactionStatus = "active" | "expired" | "reversed";

export interface CoinTransaction {
  id: string;
  userId: string;
  coins: number;       // canonical field per spec
  amount: number;      // alias kept for backward compat
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
 * Base coins = floor(omniaServiceValue / 100,000) × 1,000
 * e.g. ETB 200,000 → 2,000 coins (before tier multiplier)
 */
export function calculateBaseCoins(omniaServiceValue: number): number {
  return Math.floor(omniaServiceValue / ETB_PER_100K) * COINS_PER_100K;
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
 */
export function evaluateTier(params: {
  totalPackages: number;
  tierCoins: number;    // coins excluding referral
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
 */
export function validateRedemption(params: {
  requestedCoins: number;
  userBalance: number;
  omniaServiceFee: number;
}): { valid: boolean; maxRedeemable: number; error?: string } {
  const { requestedCoins, userBalance, omniaServiceFee } = params;
  // 30% of Omnia service fee, converted at 1 coin = 100 ETB (same ratio)
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
 *   1. users/{uid}/coinsHistory  (existing subcollection — dashboard history)
 *   2. loyaltyTransactions        (top-level collection — admin cross-user queries)
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
  /** Override affectsTier (default derived from type) */
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

  // Derive affectsTier from type unless explicitly overridden
  const NON_TIER_TYPES: CoinTransactionType[] = ["referral", "redemption", "expiry", "reversal"];
  const affectsTier =
    params.affectsTier !== undefined
      ? params.affectsTier
      : !NON_TIER_TYPES.includes(params.type);

  const isEarnType =
    params.amount > 0 &&
    params.type !== "reversal" &&
    params.type !== "redemption" &&
    params.type !== "expiry";

  // Calculate expiresAt — only for positive earn transactions
  let expiresAt: string | null = null;
  if (isEarnType) {
    const exp = new Date();
    exp.setMonth(exp.getMonth() + COINS_EXPIRY_MONTHS);
    expiresAt = exp.toISOString();
  }

  const txData = {
    userId: params.userId,
    coins: params.amount,
    amount: params.amount,          // backward compat alias
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
    // Only count positive earn transactions toward lifetime total
    if (isEarnType) {
      userUpdate.totalCoinsEarned = increment(params.amount);
    }
    // Maintain a running tierCoins aggregate to avoid O(n) subcollection scans
    if (affectsTier && params.amount > 0) {
      userUpdate.tierCoins = increment(params.amount);
    }
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
 */
export async function awardWelcomeBonus(userId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return;

  try {
    const { collection, query, where, getDocs, addDoc, setDoc, doc, serverTimestamp, increment } = modules.firestore;

    // Idempotency guard — prevent double welcome bonus
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
 * Also increments totalPackages, totalSpend, and annualOmniaValue on the user doc.
 * Requires: paymentStatus === "paid"
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

  // Idempotency guard
  if (booking.coinsStatus === "awarded") {
    console.log("[awardBookingCoins] Coins already awarded for:", bookingId);
    return;
  }

  const userId: string = booking.userId;
  const value: number = booking.omniaServiceValue || 0;

  if (!userId) { logger.log("[awardBookingCoins] Missing userId"); return; }
  if (booking.paymentStatus !== "paid") {
    logger.log("[awardBookingCoins] Payment not paid:", booking.paymentStatus);
    return;
  }

  // Resolve current tier for multiplier
  const userSnap = await getDoc(doc(db, "users", userId));
  const userData = userSnap.exists() ? (userSnap.data() as any) : {};
  const currentTier: TierName = userData.tier ?? "Hope";

  // Calculate coins with correct rate + tier multiplier
  const coins = calculateBookingCoins(value, currentTier);
  console.log("[awardBookingCoins] Coins to award:", coins, "tier:", currentTier, "value:", value);

  // Write coin transaction (coinsHistory + loyaltyTransactions mirror)
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

  // Update user aggregates (totalPackages, totalSpend, annualOmniaValue)
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

  // Auto-evaluate and upgrade tier after awarding
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

  // Clamp to prevent negative balance
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

  // Prefer the pre-aggregated tierCoins field (avoids O(n) subcollection scan).
  // Falls back to summing coinsHistory for accounts created before this field existed.
  let tierCoins: number;
  if (typeof data.tierCoins === "number") {
    tierCoins = data.tierCoins;
  } else {
    // Legacy path — only runs once per old account until tierCoins is backfilled
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

  if (newIdx <= currentIdx) return; // no upgrade needed

  await setDoc(
    userRef,
    {
      tier: newTier,
      tierUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Write tierHistory entry
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

  // Idempotency key
  const idempotencyKey = `${params.referrerId}_${params.referredUserId}_${params.relatedBookingId}`;
  const referralRef = doc(db, "referrals", idempotencyKey);
  const existing = await getDoc(referralRef);
  if (existing.exists() && existing.data()?.status === "completed") return;

  const coins =
    params.referralType === "corporate" && params.corporateCoins !== undefined
      ? Math.min(params.corporateCoins, REFERRAL_COINS.corporate)
      : REFERRAL_COINS[params.referralType];

  // Get referrer tier (for record only — multiplier NOT applied to referral coins)
  const referrerSnap = await getDoc(doc(db, "users", params.referrerId));
  const referrerTier: TierName = referrerSnap.exists()
    ? ((referrerSnap.data() as any).tier ?? "Hope")
    : "Hope";

  // affectsTier = false — referral coins excluded from tier progression
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

  // Write referral record
  await setDoc(referralRef, {
    referrerId: params.referrerId,
    referredUserId: params.referredUserId,
    relatedBookingId: params.relatedBookingId,
    referralType: params.referralType,
    rewardAmount: coins,
    status: "completed",
    awardedAt: serverTimestamp(),
  });

  // NOTE: Do NOT call evaluateAndUpgradeTier for referral coins
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

  // Get current balance
  const userSnap = await getDoc(doc(db, "users", params.userId));
  if (!userSnap.exists()) return { success: false, error: "User not found.", etbValue: 0 };
  const userData = userSnap.data() as any;
  const balance: number = userData.loyaltyPoints ?? 0;

  // Validate
  const validation = validateRedemption({
    requestedCoins: params.coinsToRedeem,
    userBalance: balance,
    omniaServiceFee: params.omniaServiceFee,
  });
  if (!validation.valid) {
    return { success: false, error: validation.error, etbValue: 0 };
  }

  // Fetch active coin transactions ordered by createdAt ASC (oldest first = FIFO)
  const historySnap = await getDocs(
    query(
      collection(db, "users", params.userId, "coinsHistory"),
      where("status", "==", "active"),
      orderBy("createdAt", "asc")
    )
  );

  // FIFO deduction — mark individual transactions as consumed
  let remaining = params.coinsToRedeem;
  const updatePromises: Promise<void>[] = [];

  historySnap.forEach((d: any) => {
    if (remaining <= 0) return;
    const data = d.data();
    if (data.amount <= 0) return; // skip deduction entries

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

  // Write single redemption transaction (negative amount, affectsTier=false)
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

  const etbValue = params.coinsToRedeem * 100; // 1 coin = 100 ETB
  return { success: true, etbValue };
}

// ── Coin expiry ───────────────────────────────────────────────────────────────

/**
 * Expire coins that are past their expiresAt date.
 * Marks status="expired" — does NOT delete records.
 * Should be triggered by a scheduled Cloud Function or admin action.
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
      // Write a single expiry deduction transaction (affectsTier=false)
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

/** Get coin history for a user from coinsHistory subcollection */
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

/**
 * Get loyalty transactions from top-level loyaltyTransactions collection.
 * Admin-friendly — supports cross-user queries without collectionGroup index.
 */
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

/**
 * Get all loyalty transactions (admin — all users).
 */
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

/**
 * Admin manual coin adjustment with full audit log.
 * type = "admin_adjustment" — affectsTier=true so it counts toward tier.
 */
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

  // Audit log
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

  // Re-evaluate tier after admin adjustment
  await evaluateAndUpgradeTier(params.targetUserId);
}

/**
 * Admin manual tier override with audit log.
 */
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

/**
 * Admin assign Travel Family recognition with audit log.
 */
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

/**
 * Get audit log entries (admin only).
 */
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
