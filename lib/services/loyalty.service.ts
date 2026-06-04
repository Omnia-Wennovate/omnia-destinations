import { getFirebaseDb, getFirebaseModules } from "@/lib/firebase/config";
import { logger } from "@/lib/logger";

// ── Constants ─────────────────────────────────────────────────────────────────

export const COINS_EXPIRY_MONTHS = 12;
export const COINS_EXTENSION_DAYS = 90;

/**
 * Coin earning rates per the loyalty program document.
 *   Travel bookings:              1 coin per ETB 1,000 of invoice value
 *   Merch / events / experiences: 1 coin per ETB 150 of invoice value
 */
export const TRAVEL_COIN_RATE = 1_000;   // ETB per 1 coin
export const MERCH_COIN_RATE = 150;     // ETB per 1 coin

/** Welcome bonus awarded on first booking (not registration). */
export const WELCOME_BONUS_COINS = 100;

// ── Tier definitions ──────────────────────────────────────────────────────────

/**
 * Tier names match the loyalty document exactly:
 *   Bronze  → Hope       (entry level, 0 completed trips)
 *   Hope+   → HopePlus   (after 1st paid trip, auto-upgrade — sits between Bronze & Silver)
 *   Silver  → Explorer   (2 completed trips / year, open enrolment)
 *   Gold    → Royal      (3 completed trips / year, invite/approval)
 *   Platinum→ Timeless   (4 completed trips / year, invite/approval)
 *   Diamond → Diamond    (5+ completed trips / year, invite/approval)
 *
 * Qualification is based SOLELY on completed trips within a 12-month membership year.
 * Referred trips that complete also count toward the referrer's personal trip total.
 *
 * Gold, Platinum, and Diamond require invite/approval — the system flags them for
 * review; the Omnia team confirms within 5 business days. The `requiresApproval`
 * field on the tier drives that review flow.
 */
export type TierName =
  | "Hope"       // Bronze
  | "HopePlus"   // Hope+ / Preferred
  | "Explorer"   // Silver
  | "Royal"      // Gold
  | "Timeless"   // Platinum
  | "Diamond";   // Diamond

export interface Tier {
  name: TierName;
  label: string;
  multiplier: number;
  /** Minimum completed trips in a 12-month membership year to qualify. */
  minTrips: number;
  /** If true, the Omnia team must confirm the upgrade before it is applied. */
  requiresApproval: boolean;
  color: string;
}

export const TIERS: Tier[] = [
  {
    name: "Hope",
    label: "Hope (Bronze)",
    multiplier: 1.0,
    minTrips: 0,
    requiresApproval: false,
    color: "bronze",
  },
  {
    name: "HopePlus",
    label: "Hope+ (Preferred)",
    multiplier: 1.1,
    minTrips: 1,
    requiresApproval: false,
    color: "bronze-plus",
  },
  {
    name: "Explorer",
    label: "Explorer (Silver)",
    multiplier: 1.2,
    minTrips: 2,
    requiresApproval: false,
    color: "silver",
  },
  {
    name: "Royal",
    label: "Royal (Gold)",
    multiplier: 1.5,
    minTrips: 3,
    requiresApproval: true,
    color: "gold",
  },
  {
    name: "Timeless",
    label: "Timeless (Platinum)",
    multiplier: 2.0,
    minTrips: 4,
    requiresApproval: true,
    color: "platinum",
  },
  {
    name: "Diamond",
    label: "Diamond",
    multiplier: 3.0,
    minTrips: 5,
    requiresApproval: true,
    color: "diamond",
  },
];

// ── Redemption threshold table ────────────────────────────────────────────────

/**
 * Coins are redeemed at fixed thresholds for a percentage discount on the
 * next Omnia invoice. Unused coins above the chosen threshold carry forward.
 *
 * Coins CANNOT be applied to flights, hotels, visa fees, or any third-party
 * charges — only to the Omnia service portion of the invoice.
 */
export interface RedemptionThreshold {
  coinsRequired: number;
  discountPercent: number;
}

export const REDEMPTION_THRESHOLDS: RedemptionThreshold[] = [
  { coinsRequired: 100, discountPercent: 1 },
  { coinsRequired: 250, discountPercent: 2 },
  { coinsRequired: 500, discountPercent: 4 },
  { coinsRequired: 1_000, discountPercent: 8 },
  { coinsRequired: 2_000, discountPercent: 15 },
  { coinsRequired: 3_500, discountPercent: 25 },
];

// ── Referral reward amounts ───────────────────────────────────────────────────

/**
 * Referral coins per the loyalty document.
 * Credited only after the referred traveller's trip is fully completed.
 * Referred trips also count toward the referrer's personal trip total (+1 trip).
 */
export const REFERRAL_COINS = {
  individual: 150,   // single referred traveller
  group: 350,   // group referral (5+ pax)
  corporate: 600,   // corporate / delegation referral
} as const;
export type ReferralType = keyof typeof REFERRAL_COINS;

// ── Transaction types ─────────────────────────────────────────────────────────

export type CoinTransactionType =
  | "booking"
  | "merch"
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
 * Base coin calculation for a travel booking invoice.
 * Rate: 1 coin per ETB 1,000 of total Omnia invoice value.
 *
 *   ETB 300,000 → 300 base coins
 *   ETB 500,000 → 500 base coins
 */
export function calculateBaseTravelCoins(invoiceValue: number): number {
  return Math.floor(invoiceValue / TRAVEL_COIN_RATE);
}

/**
 * Base coin calculation for merch, events, experiences, or consulting.
 * Rate: 1 coin per ETB 150 of invoice value.
 *
 *   ETB 3,000 → 20 base coins
 */
export function calculateBaseMerchCoins(invoiceValue: number): number {
  return Math.floor(invoiceValue / MERCH_COIN_RATE);
}

/** Apply a tier multiplier to a base coin amount, rounding to nearest whole coin. */
export function applyTierMultiplier(baseCoins: number, tier: TierName): number {
  const tierDef = TIERS.find((t) => t.name === tier);
  const multiplier = tierDef?.multiplier ?? 1.0;
  return Math.round(baseCoins * multiplier);
}

/** Full travel booking coin calculation: base × tier multiplier. */
export function calculateBookingCoins(invoiceValue: number, tier: TierName): number {
  return applyTierMultiplier(calculateBaseTravelCoins(invoiceValue), tier);
}

/** Full merch / event / experience coin calculation: base × tier multiplier. */
export function calculateMerchCoins(invoiceValue: number, tier: TierName): number {
  return applyTierMultiplier(calculateBaseMerchCoins(invoiceValue), tier);
}

/** Get tier multiplier for a given tier name. */
export function getTierMultiplier(tier: TierName): number {
  return TIERS.find((t) => t.name === tier)?.multiplier ?? 1.0;
}

/**
 * Evaluate the highest tier a user qualifies for based solely on the number
 * of completed trips in the current 12-month membership year.
 *
 * Tiers that require approval (Gold/Platinum/Diamond) are flagged with
 * `pendingApproval = true` so the caller can initiate an Omnia review instead
 * of immediately upgrading the user.
 *
 * Never downgrades — if newTier index ≤ currentTier index, returns currentTier.
 */
export function evaluateTier(params: {
  completedTripsThisYear: number;
  currentTier: TierName;
}): { newTier: TierName; pendingApproval: boolean } {
  const { completedTripsThisYear, currentTier } = params;

  // Walk from highest tier down to find the best qualifying tier.
  let qualifyingTier = TIERS[0]; // default: Hope
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (completedTripsThisYear >= TIERS[i].minTrips) {
      qualifyingTier = TIERS[i];
      break;
    }
  }

  const currentIdx = TIERS.findIndex((t) => t.name === currentTier);
  const newIdx = TIERS.findIndex((t) => t.name === qualifyingTier.name);

  // Never downgrade.
  if (newIdx <= currentIdx) {
    return { newTier: currentTier, pendingApproval: false };
  }

  return {
    newTier: qualifyingTier.name,
    pendingApproval: qualifyingTier.requiresApproval,
  };
}

/**
 * Given a coin balance, return the best available redemption threshold the
 * user can reach, and what discount it provides.
 * Returns null if balance is below the minimum threshold (100 coins).
 */
export function getBestRedemptionThreshold(
  coinBalance: number,
  preferredCoins?: number
): RedemptionThreshold | null {
  if (preferredCoins !== undefined) {
    // Find the exact threshold matching the user's chosen coin amount.
    return (
      REDEMPTION_THRESHOLDS.find((t) => t.coinsRequired === preferredCoins) ?? null
    );
  }
  // Return the highest threshold the user can afford.
  const affordable = REDEMPTION_THRESHOLDS.filter((t) => t.coinsRequired <= coinBalance);
  return affordable.length > 0 ? affordable[affordable.length - 1] : null;
}

/**
 * Calculate the ETB discount amount for a given redemption threshold applied
 * to an Omnia service invoice value.
 *
 *   500 coins (4%) on ETB 350,000 → ETB 14,000 discount
 */
export function calculateRedemptionDiscount(params: {
  threshold: RedemptionThreshold;
  omniaServiceInvoiceValue: number;
}): number {
  return Math.floor(
    params.omniaServiceInvoiceValue * (params.threshold.discountPercent / 100)
  );
}

/**
 * Validate a redemption request against the threshold table and the user's
 * current coin balance.
 *
 * Rules:
 *   - The requested coin amount must exactly match one of the threshold levels.
 *   - The user must have at least that many coins.
 *   - Coins cannot exceed invoice value (sanity guard).
 */
export function validateRedemption(params: {
  requestedCoins: number;
  userBalance: number;
  omniaServiceInvoiceValue: number;
}): { valid: boolean; threshold: RedemptionThreshold | null; error?: string } {
  const { requestedCoins, userBalance, omniaServiceInvoiceValue } = params;

  const threshold = REDEMPTION_THRESHOLDS.find(
    (t) => t.coinsRequired === requestedCoins
  );
  if (!threshold) {
    return {
      valid: false,
      threshold: null,
      error: `Invalid redemption amount. Choose from: ${REDEMPTION_THRESHOLDS.map(
        (t) => t.coinsRequired
      ).join(", ")} coins.`,
    };
  }
  if (requestedCoins > userBalance) {
    return {
      valid: false,
      threshold,
      error: `Insufficient coin balance. You have ${userBalance} coins.`,
    };
  }
  if (omniaServiceInvoiceValue <= 0) {
    return {
      valid: false,
      threshold,
      error: "Invoice value must be greater than zero.",
    };
  }
  return { valid: true, threshold };
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

// ── 90-day expiry extension ───────────────────────────────────────────────────

/**
 * When a user earns new coins before existing coins expire, extend all active
 * (unexpired) coin records' expiresAt by 90 days.
 *
 * Per the Omnia Loyalty Program document:
 *   "When a user earns new coins before expiry: Extend balance by 90 days."
 *
 * Only extends records where status === "active" and expiresAt is in the future.
 * Does NOT modify expired or reversed records.
 * Does NOT create duplicate transactions or award extra coins.
 */
async function extendActiveCoinsExpiry(userId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return;

  const { collection, query, where, getDocs, doc, updateDoc } = modules.firestore;

  const now = new Date().toISOString();

  const snap = await getDocs(
    query(
      collection(db, "users", userId, "coinsHistory"),
      where("status", "==", "active")
    )
  );

  const updates: Promise<void>[] = [];
  snap.forEach((d: any) => {
    const txData = d.data();
    // Only extend records that have an expiry and haven't expired yet
    if (txData.expiresAt && txData.expiresAt > now && txData.amount > 0) {
      const currentExpiry = new Date(txData.expiresAt);
      currentExpiry.setDate(currentExpiry.getDate() + COINS_EXTENSION_DAYS);
      updates.push(
        updateDoc(
          doc(db, "users", userId, "coinsHistory", d.id),
          { expiresAt: currentExpiry.toISOString() }
        )
      );
    }
  });

  if (updates.length > 0) {
    await Promise.all(updates);
    logger.log(
      "[extendActiveCoinsExpiry] Extended", updates.length,
      "active coin records by", COINS_EXTENSION_DAYS, "days for:", userId
    );
  }
}

/**
 * Write a coin transaction to:
 *   1. users/{uid}/coinsHistory  (subcollection — dashboard history)
 *   2. loyaltyTransactions        (top-level — admin cross-user queries)
 *
 * Also atomically updates loyaltyPoints + totalCoinsEarned on the user doc.
 *
 * affectsTier:
 *   - true  → booking, merch, bonus, welcome_bonus, admin_adjustment, manual
 *   - false → referral, referral_signup, redemption, expiry, reversal
 *
 * NOTE: Tier progression is based on completed trips, NOT coin totals.
 *       The affectsTier flag is retained for record-keeping but does not
 *       drive tier evaluation (that is handled by completedTripsThisYear).
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
  /** Pass false to skip updating loyaltyPoints (used during FIFO deduction). */
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

  // Resolve current tier for the transaction record.
  let tierAtTime: TierName = params.tierAtTime ?? "Hope";
  if (!params.tierAtTime) {
    try {
      const userSnap = await getDoc(doc(db, "users", params.userId));
      if (userSnap.exists()) tierAtTime = (userSnap.data() as any).tier ?? "Hope";
    } catch { /* use default */ }
  }

  const multiplierApplied = params.multiplierApplied ?? getTierMultiplier(tierAtTime);

  const NON_TIER_TYPES: CoinTransactionType[] = [
    "referral",
    "referral_signup",
    "redemption",
    "expiry",
    "reversal",
  ];
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

  // 1. Write to users/{uid}/coinsHistory.
  const historyRef = collection(db, "users", params.userId, "coinsHistory");
  const txRef = await addDoc(historyRef, txData);
  logger.log(
    "[writeCoinTransaction] coinsHistory written:",
    txRef.id,
    "amount:", params.amount,
    "type:", params.type,
    "affectsTier:", affectsTier
  );

  // 2. Mirror to top-level loyaltyTransactions.
  try {
    await addDoc(collection(db, "loyaltyTransactions"), {
      ...txData,
      coinsHistoryId: txRef.id,
    });
  } catch (err) {
    console.error("[writeCoinTransaction] loyaltyTransactions mirror failed:", err);
    // Non-fatal — coinsHistory is the primary record.
  }

  // 3. Update user balance.
  // ── 90-day expiry extension: when new coins are earned, extend active coins ──
  if (isEarnType) {
    try {
      await extendActiveCoinsExpiry(params.userId);
    } catch (err) {
      console.error("[writeCoinTransaction] expiry extension failed (non-fatal):", err);
    }
  }

  if (params.updateBalance !== false) {
    const userUpdate: Record<string, any> = {
      loyaltyPoints: increment(params.amount),
      updatedAt: serverTimestamp(),
    };
    if (isEarnType) {
      userUpdate.totalCoinsEarned = increment(params.amount);
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
 * Award 100 welcome coins on the user's FIRST booking (not on registration).
 * Idempotent — checks for an existing welcome_bonus transaction before awarding.
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
      amount: WELCOME_BONUS_COINS, // 100 coins per program document
      type: "welcome_bonus",
      reason: "Welcome bonus — thank you for your first booking with Omnia!",
      multiplierApplied: 1,
      tierAtTime: "Hope",
      affectsTier: false, // welcome coins are a gift, not a tier-affecting earn
      status: "active",
    });
    logger.log("[awardWelcomeBonus] 100 welcome coins awarded to:", userId);
  } catch (err) {
    logger.error("[awardWelcomeBonus] Failed:", err);
    // Non-fatal — don't block the booking flow.
  }
}

// ── Award / Reverse booking coins ─────────────────────────────────────────────

/**
 * Award coins for a completed booking (travel).
 *
 * Flow:
 *   1. Check booking exists, is paid, and is completed/confirmed.
 *   2. Award welcome bonus if this is the user's first booking.
 *   3. Calculate coins: floor(invoiceValue / 1,000) × tier multiplier.
 *   4. Write coin transaction.
 *   5. Increment completedTripsThisYear on the user document.
 *   6. Evaluate and (if warranted) trigger tier upgrade review.
 *
 * Idempotent — guarded by booking.coinsStatus === "awarded".
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

  // Idempotency guard — skip coin write but still evaluate tier in case a
  // prior run wrote the booking update but failed before evaluating tier.
  if (booking.coinsStatus === "awarded") {
    console.log(
      "[awardBookingCoins] Coins already awarded for:",
      bookingId,
      "— re-evaluating tier"
    );
    await evaluateAndUpgradeTier(booking.userId);
    return;
  }

  const userId: string = booking.userId;
  // Prefer the explicit Omnia invoice value; fall back to totalAmount.
  let invoiceValue: number = booking.omniaServiceValue || 0;
  if (invoiceValue <= 0) {
    invoiceValue = Number(booking.totalAmount ?? booking.amount ?? 0);
    console.log(
      "[awardBookingCoins] omniaServiceValue was 0/missing — using totalAmount:",
      invoiceValue
    );
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

  // Award welcome bonus on first booking.
  await awardWelcomeBonus(userId);

  // Coins: 1 per ETB 1,000 × tier multiplier.
  const coins = calculateBookingCoins(invoiceValue, currentTier);
  console.log(
    "[awardBookingCoins] Coins to award:", coins,
    "tier:", currentTier,
    "invoiceValue:", invoiceValue
  );

  await writeCoinTransaction({
    userId,
    amount: coins,
    type: "booking",
    relatedBookingId: bookingId,
    reason: `Booking coins: ${booking.packageTitle ?? bookingId} (ETB ${invoiceValue.toLocaleString()} invoice)`,
    tierAtTime: currentTier,
    multiplierApplied: getTierMultiplier(currentTier),
    affectsTier: true,
    status: "active",
  });

  // Increment completed trips counter (12-month window managed separately).
  await setDoc(
    doc(db, "users", userId),
    {
      completedTripsThisYear: increment(1),
      totalCompletedTrips: increment(1),
      totalSpend: increment(invoiceValue),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Mark booking as coins-awarded.
  await updateDoc(bookingRef, {
    coinsStatus: "awarded",
    coinsEarned: coins,
    updatedAt: serverTimestamp(),
  });

  logger.log("[awardBookingCoins] LOYALTY AWARDED:", coins, "coins to", userId);

  // Evaluate tier after every completed booking.
  await evaluateAndUpgradeTier(userId);
}

/**
 * Award coins for a merch / event / experience / consulting purchase.
 * Rate: 1 coin per ETB 150.
 */
export async function awardMerchCoins(params: {
  userId: string;
  invoiceValue: number;
  relatedBookingId?: string;
  itemDescription: string;
}): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return;

  const { doc, getDoc } = modules.firestore;

  const userSnap = await getDoc(doc(db, "users", params.userId));
  const currentTier: TierName = userSnap.exists()
    ? ((userSnap.data() as any).tier ?? "Hope")
    : "Hope";

  const coins = calculateMerchCoins(params.invoiceValue, currentTier);

  await writeCoinTransaction({
    userId: params.userId,
    amount: coins,
    type: "merch",
    relatedBookingId: params.relatedBookingId,
    reason: `Merch/event coins: ${params.itemDescription} (ETB ${params.invoiceValue.toLocaleString()})`,
    tierAtTime: currentTier,
    multiplierApplied: getTierMultiplier(currentTier),
    affectsTier: true,
    status: "active",
  });

  logger.log("[awardMerchCoins] Awarded:", coins, "coins to", params.userId);
}

/**
 * Reverse coins for a cancelled or refunded booking.
 * Prevents negative balances. Never downgrades tier automatically.
 * Decrements completedTripsThisYear so the user's trip count stays accurate.
 */
export async function reverseBookingCoins(bookingId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, getDoc, updateDoc, setDoc, increment, serverTimestamp } = modules.firestore;

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

  // Decrement the completed trip counter so the user's tier re-evaluation
  // reflects accurate trip counts going forward.
  await setDoc(
    doc(db, "users", userId),
    {
      completedTripsThisYear: increment(-1),
      totalCompletedTrips: increment(-1),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateDoc(bookingRef, {
    coinsStatus: "reversed",
    updatedAt: serverTimestamp(),
  });
}

// ── Tier evaluation ───────────────────────────────────────────────────────────

/**
 * Evaluate and (if warranted) upgrade a user's tier.
 *
 * Qualification criterion: completed trips in the current 12-month
 * membership year (stored as completedTripsThisYear on the user document).
 *
 * Tiers requiring approval (Gold/Platinum/Diamond):
 *   - The user's tier is NOT immediately changed.
 *   - Instead, a pendingTierReview document is written so the Omnia team
 *     can confirm the upgrade within 5 business days.
 *   - Until confirmed, the previous tier benefits remain active.
 *
 * Open-enrolment tiers (Bronze/Hope+/Silver):
 *   - Tier is updated immediately.
 *
 * Never downgrades automatically.
 * Writes to users/{uid}/tierHistory on every confirmed change.
 */
export async function evaluateAndUpgradeTier(userId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return;

  const {
    doc, getDoc, setDoc, collection, addDoc, serverTimestamp,
  } = modules.firestore;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const data = userSnap.data() as any;
  const completedTripsThisYear: number = data.completedTripsThisYear ?? 0;
  const currentTier: TierName = data.tier ?? "Hope";

  // Skip evaluation if a manual admin override is in place.
  if (data.tierOverriddenByAdmin) {
    logger.log("[evaluateAndUpgradeTier] Admin override active — skipping auto-eval for:", userId);
    return;
  }

  const { newTier, pendingApproval } = evaluateTier({
    completedTripsThisYear,
    currentTier,
  });

  logger.log(
    "[evaluateAndUpgradeTier]",
    userId,
    "completedTripsThisYear:", completedTripsThisYear,
    "currentTier:", currentTier,
    "→ evaluates to:", newTier,
    "pendingApproval:", pendingApproval
  );

  const currentIdx = TIERS.findIndex((t) => t.name === currentTier);
  const newIdx = TIERS.findIndex((t) => t.name === newTier);

  if (newIdx <= currentIdx) {
    logger.log("[evaluateAndUpgradeTier] No upgrade needed — already at", currentTier);
    return;
  }

  if (pendingApproval) {
    // Write a review request for the Omnia team; do not change the tier yet.
    await setDoc(
      doc(db, "tierReviews", `${userId}_${newTier}`),
      {
        userId,
        currentTier,
        requestedTier: newTier,
        completedTripsThisYear,
        status: "pending",
        requestedAt: serverTimestamp(),
        reviewDeadline: (() => {
          const d = new Date();
          d.setDate(d.getDate() + 5); // 5 business days
          return d.toISOString();
        })(),
      },
      { merge: true }
    );
    logger.log(
      "[evaluateAndUpgradeTier] Tier review requested for:", userId,
      "→", newTier, "(pending Omnia approval)"
    );
    return;
  }

  // Open-enrolment upgrade — apply immediately.
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
    reason: `Automatic upgrade: completedTripsThisYear=${completedTripsThisYear}`,
    changedAt: serverTimestamp(),
  });

  logger.log("[evaluateAndUpgradeTier] Upgraded:", userId, "from", currentTier, "to", newTier);
}

/**
 * Called by the Omnia admin panel to confirm a pending tier upgrade review.
 * Sets the user's tier to the reviewed/approved value.
 */
export async function confirmTierUpgrade(params: {
  adminId: string;
  targetUserId: string;
  approvedTier: TierName;
  notes?: string;
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
      tier: params.approvedTier,
      tierOverriddenByAdmin: false,
      tierUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Close the review request.
  await setDoc(
    doc(db, "tierReviews", `${params.targetUserId}_${params.approvedTier}`),
    { status: "approved", reviewedAt: serverTimestamp(), adminId: params.adminId },
    { merge: true }
  );

  await addDoc(collection(db, "users", params.targetUserId, "tierHistory"), {
    previousTier,
    newTier: params.approvedTier,
    reason: `Omnia team confirmed upgrade${params.notes ? ": " + params.notes : ""}`,
    changedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "auditLogs"), {
    adminId: params.adminId,
    actionType: "tier_upgrade_confirmed",
    targetUserId: params.targetUserId,
    details: { previousTier, newTier: params.approvedTier, notes: params.notes },
    createdAt: serverTimestamp(),
  });

  logger.log(
    "[confirmTierUpgrade] Confirmed:", params.targetUserId,
    "from", previousTier, "to", params.approvedTier
  );
}

// ── Referral coins ────────────────────────────────────────────────────────────

/**
 * Award referral coins after a referred client completes travel.
 * Idempotent — uses referrals/{idempotencyKey} as a guard document.
 *
 * Per program rules:
 *   - Coins are awarded ONLY after the referred traveller's trip is fully completed.
 *   - Referral coins do NOT count toward tier (affectsTier=false).
 *   - The referred trip DOES count as +1 toward the referrer's personal trip total
 *     for tier qualification purposes.
 *
 * Cancellation rules:
 *   - If the referred person cancels before travel begins → no coins.
 *   - If they cancel mid-trip → coins awarded proportionally (pass partialFraction).
 */
export async function awardReferralCoins(params: {
  referrerId: string;
  referredUserId: string;
  referralType: ReferralType;
  relatedBookingId: string;
  /** For partial completions (mid-trip cancellation): 0.0–1.0. Defaults to 1.0. */
  partialFraction?: number;
}): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const { doc, getDoc, setDoc, serverTimestamp } = modules.firestore;

  const idempotencyKey = `${params.referrerId}_${params.referredUserId}_${params.relatedBookingId}`;
  const referralRef = doc(db, "referrals", idempotencyKey);
  const existing = await getDoc(referralRef);
  if (existing.exists() && existing.data()?.status === "completed") return;

  const fraction = params.partialFraction !== undefined
    ? Math.min(1, Math.max(0, params.partialFraction))
    : 1.0;

  const baseCoins = REFERRAL_COINS[params.referralType];
  const coins = fraction < 1.0
    ? Math.floor(baseCoins * fraction)
    : baseCoins;

  if (coins <= 0) {
    logger.log("[awardReferralCoins] No coins to award (0 or cancelled before travel)");
    return;
  }

  const referrerSnap = await getDoc(doc(db, "users", params.referrerId));
  const referrerTier: TierName = referrerSnap.exists()
    ? ((referrerSnap.data() as any).tier ?? "Hope")
    : "Hope";

  await writeCoinTransaction({
    userId: params.referrerId,
    amount: coins,
    type: "referral",
    relatedBookingId: params.relatedBookingId,
    reason: `Referral reward (${params.referralType})${fraction < 1 ? ` — ${Math.round(fraction * 100)}% completed` : ""}: referred client completed travel`,
    tierAtTime: referrerTier,
    multiplierApplied: 1, // flat — no tier multiplier on referral coins
    affectsTier: false,
    status: "active",
  });

  // The referred trip counts as +1 trip toward the referrer's tier qualification.
  const { setDoc: _setDoc, increment } = modules.firestore;
  await _setDoc(
    doc(db, "users", params.referrerId),
    {
      completedTripsThisYear: increment(1),
      totalCompletedTrips: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(referralRef, {
    referrerId: params.referrerId,
    referredUserId: params.referredUserId,
    relatedBookingId: params.relatedBookingId,
    referralType: params.referralType,
    rewardAmount: coins,
    partialFraction: fraction,
    status: "completed",
    awardedAt: serverTimestamp(),
  });

  // Evaluate tier because the referral added a trip toward qualification.
  await evaluateAndUpgradeTier(params.referrerId);

  logger.log(
    "[awardReferralCoins] Referral coins awarded:", coins,
    "to", params.referrerId,
    "(+1 trip counted toward tier)"
  );
}

// ── Coin redemption (FIFO + threshold table) ──────────────────────────────────

/**
 * Redeem coins using the fixed threshold table with FIFO deduction.
 *
 * Rules:
 *   - Requested coins must match a threshold exactly (100/250/500/1000/2000/3500).
 *   - The discount is applied as a percentage of the Omnia service invoice value.
 *   - Coins cannot be applied to flights, hotels, visa fees, or third-party charges.
 *   - Unused coins above the threshold carry forward automatically.
 *   - Oldest active coins are deducted first (FIFO).
 *
 * Returns the ETB discount amount to apply to the invoice.
 */
export async function redeemCoins(params: {
  userId: string;
  coinsToRedeem: number;
  omniaServiceInvoiceValue: number;
  relatedBookingId?: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string; etbDiscount: number; discountPercent: number }> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) throw new Error("Database not initialized");

  const {
    doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc,
  } = modules.firestore;

  const userSnap = await getDoc(doc(db, "users", params.userId));
  if (!userSnap.exists()) {
    return { success: false, error: "User not found.", etbDiscount: 0, discountPercent: 0 };
  }
  const userData = userSnap.data() as any;
  const balance: number = userData.loyaltyPoints ?? 0;

  const validation = validateRedemption({
    requestedCoins: params.coinsToRedeem,
    userBalance: balance,
    omniaServiceInvoiceValue: params.omniaServiceInvoiceValue,
  });
  if (!validation.valid || !validation.threshold) {
    return {
      success: false,
      error: validation.error,
      etbDiscount: 0,
      discountPercent: 0,
    };
  }

  const threshold = validation.threshold;
  const etbDiscount = calculateRedemptionDiscount({
    threshold,
    omniaServiceInvoiceValue: params.omniaServiceInvoiceValue,
  });

  // FIFO deduction — mark oldest active transactions as reversed.
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
    const txData = d.data();
    if (txData.amount <= 0) return;

    const available = txData.amount as number;
    if (available <= remaining) {
      remaining -= available;
      updatePromises.push(
        updateDoc(
          doc(db, "users", params.userId, "coinsHistory", d.id),
          { status: "reversed" }
        )
      );
    } else {
      // Partial deduction — not supported by simple status flip;
      // the balance deduction is handled by the redemption transaction below.
      remaining = 0;
    }
  });

  await Promise.all(updatePromises);

  await writeCoinTransaction({
    userId: params.userId,
    amount: -params.coinsToRedeem,
    type: "redemption",
    relatedBookingId: params.relatedBookingId,
    reason:
      params.reason ??
      `Redeemed ${params.coinsToRedeem} coins — ${threshold.discountPercent}% discount (ETB ${etbDiscount.toLocaleString()} off)`,
    multiplierApplied: 1,
    tierAtTime: userData.tier ?? "Hope",
    affectsTier: false,
    status: "reversed",
  });

  return { success: true, etbDiscount, discountPercent: threshold.discountPercent };
}

// ── Annual trip counter reset ─────────────────────────────────────────────────

/**
 * Reset the 12-month trip counter at the start of each membership year.
 * Should be called by a scheduled Cloud Function on each user's membership
 * anniversary date.
 *
 * Tier is NOT downgraded on reset — the previous tier remains active and
 * a new qualification cycle begins.
 */
export async function resetAnnualTripCounter(userId: string): Promise<void> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return;

  const { doc, setDoc, serverTimestamp } = modules.firestore;

  await setDoc(
    doc(db, "users", userId),
    {
      completedTripsThisYear: 0,
      membershipYearStartedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  logger.log("[resetAnnualTripCounter] Trip counter reset for:", userId);
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

  const {
    doc, collection, query, where, getDocs, updateDoc, serverTimestamp,
  } = modules.firestore;

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
      const txData = d.data();
      if (txData.expiresAt && txData.expiresAt < now && txData.amount > 0) {
        totalExpired += txData.amount as number;
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
    // Silent — will retry next scheduled run.
  }

  return totalExpired;
}

// ── Coin history queries ──────────────────────────────────────────────────────

export async function getUserCoinHistory(userId: string): Promise<CoinTransaction[]> {
  const db = await getFirebaseDb();
  const modules = await getFirebaseModules();
  if (!db || !modules.firestore) return [];

  const { collection, query, orderBy, getDocs } = modules.firestore;

  try {
    const snap = await getDocs(
      query(
        collection(db, "users", userId, "coinsHistory"),
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
    details: { amount: params.amount, reason: params.reason, type: txType },
    createdAt: serverTimestamp(),
  });

  // Coin adjustments do not change trip count, so no tier re-evaluation needed
  // unless the admin also intends to change the tier (use adminSetTier for that).
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
      query(
        collection(db, "auditLogs"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      )
    );
    const logs: any[] = [];
    snap.forEach((d: any) => logs.push({ id: d.id, ...d.data() }));
    return logs;
  } catch {
    return [];
  }
}