/**
 * Cron job: for each enabled calendar_invoice_reminders, fetch events that ended
 * in [now - delay - CRON_WINDOW_MINUTES, now - delay], send "Issue invoice?" email to owner, record in calendar_reminder_sent.
 * On Vercel Hobby (1 run/day) use 24h window; on Pro you can run every 15 min with 15min window.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getValidAccessToken,
  listGoogleCalendarEvents,
  type IntegrationConnectionRow,
} from "@/lib/integrations/calendar/google";
import {
  getValidMicrosoftAccessToken,
  listMicrosoftCalendarEvents,
} from "@/lib/integrations/calendar/microsoft";
import { sendCalendarSessionReminderEmail } from "@/lib/email/send";

export type CalendarEventLike = {
  id: string;
  summary: string | null;
  endDateTime: Date | null;
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";
/** Window of events to process. Use 1440 (24h) when cron runs once/day (Vercel Hobby); 15 when every 15 min. */
const CRON_WINDOW_MINUTES = 1440;

type ReminderWithConnection = {
  id: string;
  user_id: string;
  connection_id: string;
  calendar_id: string;
  reminder_delay_minutes: number;
  integration_connections: IntegrationConnectionRow | IntegrationConnectionRow[] | null;
};

export async function runCalendarReminderJob(): Promise<{ sent: number; errors: number }> {
  const supabase = createAdminClient();
  let sent = 0;
  let errors = 0;

  const { data: reminders, error: fetchErr } = await supabase
    .from("calendar_invoice_reminders")
    .select(
      `
      id,
      user_id,
      connection_id,
      calendar_id,
      reminder_delay_minutes,
      integration_connections!inner (
        id,
        provider,
        access_token_encrypted,
        refresh_token_encrypted,
        token_expires_at
      )
    `
    )
    .eq("enabled", true);

  if (fetchErr || !reminders?.length) {
    if (fetchErr) console.error("[calendar-reminder] fetch reminders:", fetchErr.message);
    return { sent: 0, errors: fetchErr ? 1 : 0 };
  }

  const now = new Date();

  for (const row of reminders as unknown as ReminderWithConnection[]) {
    const conn = Array.isArray(row.integration_connections)
      ? row.integration_connections[0]
      : row.integration_connections;
    if (!conn) continue;

    const provider = conn.provider ?? "google_calendar";
    const delayMs = row.reminder_delay_minutes * 60 * 1000;
    const windowMs = CRON_WINDOW_MINUTES * 60 * 1000;
    const timeMax = new Date(now.getTime() - delayMs);
    const timeMin = new Date(timeMax.getTime() - windowMs);
    const timeMinIso = timeMin.toISOString();
    const timeMaxIso = timeMax.toISOString();

    let accessToken: string;
    try {
      if (provider === "microsoft_calendar") {
        accessToken = await getValidMicrosoftAccessToken(supabase, conn);
      } else {
        accessToken = await getValidAccessToken(supabase, conn);
      }
    } catch (e) {
      console.error("[calendar-reminder] token for connection", conn.id, (e as Error).message);
      errors += 1;
      continue;
    }

    let events: CalendarEventLike[];
    try {
      if (provider === "microsoft_calendar") {
        events = await listMicrosoftCalendarEvents(
          accessToken,
          row.calendar_id,
          timeMinIso,
          timeMaxIso
        );
      } else {
        events = await listGoogleCalendarEvents(
          accessToken,
          row.calendar_id,
          timeMinIso,
          timeMaxIso
        );
      }
    } catch (e) {
      console.error("[calendar-reminder] list events", (e as Error).message);
      errors += 1;
      continue;
    }

    // Only events that actually ended in [timeMin, timeMax]
    const eventsInWindow = events.filter(
      (e) =>
        e.endDateTime &&
        e.endDateTime.getTime() >= timeMin.getTime() &&
        e.endDateTime.getTime() <= timeMax.getTime()
    );

    for (const event of eventsInWindow) {
      const { data: alreadySent } = await supabase
        .from("calendar_reminder_sent")
        .select("id")
        .eq("connection_id", row.connection_id)
        .eq("event_id", event.id)
        .maybeSingle();

      if (alreadySent) continue;

      const { data: authUser } = await supabase.auth.admin.getUserById(row.user_id);
      const toEmail = authUser?.user?.email;
      if (!toEmail) {
        errors += 1;
        continue;
      }

      const dashboardUrl = `${BASE_URL.replace(/\/$/, "")}/dashboard`;
      let newInvoiceUrl = `${BASE_URL.replace(/\/$/, "")}/invoices/new`;
      const { data: eventLink } = await supabase
        .from("calendar_event_links")
        .select("client_id")
        .eq("connection_id", row.connection_id)
        .eq("event_id", event.id)
        .maybeSingle();
      if (eventLink?.client_id) {
        newInvoiceUrl += `?client_id=${eventLink.client_id}`;
      }

      const result = await sendCalendarSessionReminderEmail({
        to: toEmail,
        sessionTitle: event.summary ?? "Session",
        newInvoiceUrl,
        dashboardUrl,
      });

      if (!result.ok) {
        console.error("[calendar-reminder] send failed:", result.error);
        errors += 1;
        continue;
      }

      await supabase.from("calendar_reminder_sent").insert({
        user_id: row.user_id,
        connection_id: row.connection_id,
        event_id: event.id,
        event_end_at: event.endDateTime!.toISOString(),
      });
      sent += 1;
    }
  }

  return { sent, errors };
}
