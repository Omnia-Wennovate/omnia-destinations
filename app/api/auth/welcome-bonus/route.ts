import { NextRequest, NextResponse } from "next/server";
import { awardWelcomeBonusAdmin } from "@/lib/services/loyalty.admin";

/**
 * POST /api/auth/welcome-bonus
 *
 * Awards 100 welcome coins to a newly signed-up user.
 * Called from the signup page immediately after user doc creation.
 *
 * Idempotent — awardWelcomeBonusAdmin checks for an existing
 * welcome_bonus transaction before writing, so duplicate calls
 * (e.g. signup retry or later first-booking flow) are harmless.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid userId" },
        { status: 400 }
      );
    }

    console.log("[welcome-bonus] Awarding signup welcome bonus for userId:", userId);

    const awarded = await awardWelcomeBonusAdmin(userId);

    console.log("[welcome-bonus] Result:", awarded ? "awarded" : "skipped (already exists)");

    return NextResponse.json({ success: true, awarded });
  } catch (error: any) {
    console.error("[welcome-bonus] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to award welcome bonus" },
      { status: 500 }
    );
  }
}
