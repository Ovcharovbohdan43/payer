import { NextResponse } from "next/server";
import { processPendingStripeRevocations } from "@/lib/auth/process-ban-stripe";

/**
 * Cron: revoke Stripe Connect accounts for banned users.
 * Secured by CRON_SECRET. Runs once daily on Vercel Hobby (see vercel.json).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { processed, errors } = await processPendingStripeRevocations();
  return NextResponse.json({ ok: true, processed, errors });
}
