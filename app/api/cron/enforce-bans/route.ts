import { NextResponse } from "next/server";
import { processPendingStripeRevocations } from "@/lib/auth/process-ban-stripe";
import { releaseDuePayoutHolds } from "@/lib/stripe/account-controls";

/**
 * Cron: revoke Stripe Connect for banned users + release payout holds after review period.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [revoke, payouts] = await Promise.all([
    processPendingStripeRevocations(),
    releaseDuePayoutHolds(),
  ]);

  return NextResponse.json({
    ok: true,
    revoke,
    payoutHolds: payouts,
  });
}
