import { NextResponse } from "next/server";
import { runAutoReminders } from "@/lib/reminders/run-auto-reminders";

/**
 * Cron endpoint: run auto-reminders for invoices with auto_remind_enabled.
 * Secured by CRON_SECRET (Vercel Cron or external scheduler).
 * Vercel Cron: set CRON_SECRET in env, cron calls this URL.
 * Manual: GET /api/cron/reminders with header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sent, errors } = await runAutoReminders();
  return NextResponse.json({ ok: true, sent, errors });
}
