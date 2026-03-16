import { NextResponse } from "next/server";
import { runCalendarReminderJob } from "@/lib/integrations/calendar/reminder-job";

/**
 * Cron: send "Issue invoice?" after calendar session ends.
 * Secured by CRON_SECRET. Run every 15 min (e.g. Vercel Cron).
 * GET /api/cron/calendar-reminders with header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sent, errors } = await runCalendarReminderJob();
  return NextResponse.json({ ok: true, sent, errors });
}
