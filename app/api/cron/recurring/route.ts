import { NextResponse } from "next/server";
import { runRecurringInvoices } from "@/lib/recurring/run-recurring-invoices";

/**
 * Cron endpoint: generate and send recurring invoices at their interval.
 * Secured by CRON_SECRET. Runs every minute for testing (minutes interval).
 * Manual: GET /api/cron/recurring with header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { generated, errors } = await runRecurringInvoices();
  return NextResponse.json({ ok: true, generated, errors });
}
