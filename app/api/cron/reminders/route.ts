import { NextResponse } from "next/server";
import { setOverdueStatus } from "@/lib/reminders/set-overdue-status";
import { runAutoReminders } from "@/lib/reminders/run-auto-reminders";

/**
 * Cron endpoint: (1) set overdue status, (2) run auto-reminders.
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

  const { updated: overdueUpdated } = await setOverdueStatus();
  const { sent, errors } = await runAutoReminders();

  return NextResponse.json({
    ok: true,
    overdueUpdated,
    sent,
    errors,
  });
}
