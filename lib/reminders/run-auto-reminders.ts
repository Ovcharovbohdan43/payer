import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail, sendEscalationCopyToOwnerEmail } from "@/lib/email/send";
import { formatAmount, getDisplayAmountCents } from "@/lib/invoices/utils";
import { getScheduledDaysDue, isEscalationDue, SCHEDULE_DAYS } from "./reminder-schedule";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";
const ESCALATION_DAYS_PAST_DUE = 7;

const SENT_COLUMN: Record<string, string> = {
  "1": "reminder_1d_sent_at",
  "2": "reminder_2d_sent_at",
  "3": "reminder_3d_sent_at",
  "5": "reminder_5d_sent_at",
  "7": "reminder_7d_sent_at",
  "10": "reminder_10d_sent_at",
  "14": "reminder_14d_sent_at",
};

const VALID_DAYS = new Set(SCHEDULE_DAYS);

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
      "id, user_id, number, public_id, client_name, client_email, amount_cents, currency, vat_included, due_date, sent_at, status, auto_remind_enabled, auto_remind_days, escalation_sent_at, reminder_1d_sent_at, reminder_2d_sent_at, reminder_3d_sent_at, reminder_5d_sent_at, reminder_7d_sent_at, reminder_10d_sent_at, reminder_14d_sent_at"
    )
    .eq("auto_remind_enabled", true)
    .not("client_email", "is", null)
    .not("sent_at", "is", null)
    .in("status", ["sent", "viewed", "overdue"]);

  if (fetchError || !invoices) {
    console.error("[auto-remind] fetch error:", fetchError?.message);
    return { sent: 0, errors: 1 };
  }

  for (const inv of invoices) {
    if (inv.status === "paid" || inv.status === "void") continue;

    const sentAt = new Date(inv.sent_at);
    const schedule = (inv.auto_remind_days ?? "1,3,7")
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => SENT_COLUMN[s] != null);

    const daysDue = getScheduledDaysDue(sentAt, now, schedule, VALID_DAYS);

    for (const dayStr of daysDue) {
      const sentCol = SENT_COLUMN[dayStr];
      if (!sentCol) continue;
      const alreadySent = (inv as Record<string, unknown>)[sentCol];
      if (alreadySent) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name, escalation_cc_owner")
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

  // Escalation: overdue invoices ≥ ESCALATION_DAYS_PAST_DUE days past due_date — send one overdue reminder to client and optionally copy to owner
  for (const inv of invoices) {
    if (inv.status !== "overdue" || inv.escalation_sent_at != null || !inv.due_date) continue;
    const dueDate = new Date(inv.due_date);
    if (!isEscalationDue(dueDate, now, ESCALATION_DAYS_PAST_DUE)) continue;

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, escalation_cc_owner")
      .eq("id", inv.user_id)
      .single();

    const publicUrl = `${BASE_URL.replace(/\/$/, "")}/i/${inv.public_id}`;
    const dashboardUrl = `${BASE_URL.replace(/\/$/, "")}/dashboard`;
    const amountFormatted = formatAmount(
      getDisplayAmountCents(Number(inv.amount_cents), inv.vat_included),
      inv.currency
    );
    const dueDateFormatted = new Date(inv.due_date).toLocaleDateString("en-US", { dateStyle: "medium" });

    const result = await sendReminderEmail({
      to: inv.client_email!,
      businessName: profile?.business_name ?? "Business",
      clientName: inv.client_name,
      amountFormatted,
      invoiceNumber: inv.number,
      publicUrl,
      dueDate: dueDateFormatted,
      subjectOverride: `Overdue reminder: Invoice ${inv.number} from ${profile?.business_name ?? "Business"}`,
    });
    if (!result.ok) {
      console.error("[auto-remind] escalation send to client failed:", inv.id, result.error);
      errors++;
      continue;
    }

    if (profile?.escalation_cc_owner !== false) {
      const { data: authUser } = await supabase.auth.admin.getUserById(inv.user_id);
      const ownerEmail = authUser?.user?.email;
      if (ownerEmail) {
        const copyResult = await sendEscalationCopyToOwnerEmail({
          to: ownerEmail,
          invoiceNumber: inv.number,
          clientName: inv.client_name,
          amountFormatted,
          publicUrl,
          dashboardUrl,
        });
        if (!copyResult.ok) {
          console.error("[auto-remind] escalation copy to owner failed:", inv.id, copyResult.error);
          errors++;
        }
      }
    }

    const { error: updateErr } = await supabase
      .from("invoices")
      .update({
        escalation_sent_at: new Date().toISOString(),
        last_reminder_at: new Date().toISOString(),
      })
      .eq("id", inv.id);
    if (updateErr) {
      console.error("[auto-remind] escalation update failed:", inv.id, updateErr.message);
      errors++;
      continue;
    }
    console.log("[auto-remind] escalation sent invoiceId=", inv.id);
    sent++;
  }

  return { sent, errors };
}
