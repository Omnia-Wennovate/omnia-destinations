"use server";

import { awardBookingCoinsAdmin } from "@/lib/services/loyalty.admin";

/**
 * Server Action to securely trigger loyalty rewards.
 * Safely bridges client-side components to the Firebase Admin SDK.
 */
export async function triggerLoyaltyCoinsAdmin(bookingId: string) {
  try {
    await awardBookingCoinsAdmin(bookingId);
  } catch (error) {
    console.error("[triggerLoyaltyCoinsAdmin] Failed to award coins:", error);
  }
}
