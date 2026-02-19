import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "@/lib/email/send";
import { formatAmount, getDisplayAmountCents } from "@/lib/invoices/utils";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

type DayKey = "1" | "3" | "7";
const SENT_COLUMN: Record<DayKey, string> = {
  "1": "reminder_1d_sent_at",
  "3": "reminder_3d_sent_at",
  "7": "reminder_7d_sent_at",
};

/**
 * Find invoices due for auto-reminder and send them.
 * Only invoices with status sent/viewed/overdue (not paid/void).
 * Stops when status becomes paid (webhook sets that before we run).
 */
export async function runAutoReminders(): Promise<{ sent: number; errors: number }> {
  const supabase = createAdminClient();
  const now = new Date();
  let sent = 0;
  let errors = 0;

  const { data: invoices, error: fetchError } = await supabase
    .from("invoices")
    .select(
      "id, user_id, number, public_id, client_name, client_email, amount_cents, currency, vat_included, due_date, sent_at, status, auto_remind_enabled, auto_remind_days, reminder_1d_sent_at, reminder_3d_sent_at, reminder_7d_sent_at"
    )
    .eq("auto_remind_enabled", true)
    .not("client_email", "is", null)
    .not("sent_at", "is", null)
    .in("status", ["sent", "viewed", "overdue"]);

  if (fetchError || !invoices) {
    console.error("[auto-remind] fetch error:", fetchError?.message);
    return { sent: 0, errors: 1 };
  }

  const days = [1, 3, 7] as const;

  for (const inv of invoices) {
    if (inv.status === "paid" || inv.status === "void") continue;

    const sentAt = new Date(inv.sent_at);
    const schedule = (inv.auto_remind_days ?? "1,3,7")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => ["1", "3", "7"].includes(s)) as DayKey[];

    for (const day of days) {
      const dayStr = String(day) as DayKey;
      if (!schedule.includes(dayStr)) continue;

      const sentCol = SENT_COLUMN[dayStr];
      const alreadySent = (inv as Record<string, unknown>)[sentCol];
      if (alreadySent) continue;

      const dueAt = new Date(sentAt);
      dueAt.setDate(dueAt.getDate() + day);
      dueAt.setHours(0, 0, 0, 0);

      if (now < dueAt) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("id", inv.user_id)
        .single();

      const publicUrl = `${BASE_URL.replace(/\/$/, "")}/i/${inv.public_id}`;
      const amountFormatted = formatAmount(
        getDisplayAmountCents(Number(inv.amount_cents), inv.vat_included),
        inv.currency
      );
      const dueDateFormatted = inv.due_date
        ? new Date(inv.due_date).toLocaleDateString("en-US", { dateStyle: "medium" })
        : null;

      const result = await sendReminderEmail({
        to: inv.client_email!,
        businessName: profile?.business_name ?? "Business",
        clientName: inv.client_name,
        amountFormatted,
        invoiceNumber: inv.number,
        publicUrl,
        dueDate: dueDateFormatted,
      });

      if (!result.ok) {
        console.error("[auto-remind] send failed:", inv.id, result.error);
        errors++;
        continue;
      }

      await supabase
        .from("invoices")
        .update({
          [sentCol]: new Date().toISOString(),
          last_reminder_at: new Date().toISOString(),
        })
        .eq("id", inv.id);

      sent++;
    }
  }

  return { sent, errors };
}
