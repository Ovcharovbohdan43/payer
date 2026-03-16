import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Set status to 'overdue' for all invoices that are still sent/viewed
 * and have due_date < today (UTC).
 * Idempotent: only updates sent/viewed; paid/void/overdue are left as-is.
 * Called by cron before runAutoReminders so reminder logic sees correct status.
 */
export async function setOverdueStatus(): Promise<{ updated: number }> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC

  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .in("status", ["sent", "viewed"])
    .not("due_date", "is", null)
    .lt("due_date", today)
    .select("id");

  if (error) {
    console.error("[set-overdue] error:", error.message);
    return { updated: 0 };
  }

  const updated = data?.length ?? 0;
  if (updated > 0) {
    console.log("[set-overdue] marked", updated, "invoice(s) as overdue");
  }
  return { updated };
}
