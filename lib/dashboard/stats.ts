import type { InvoiceRow } from "@/app/invoices/actions";
import { getDisplayAmountCents } from "@/lib/invoices/utils";

export type DashboardStats = {
  unpaidSumCents: number;
  unpaidCount: number;
  paidThisMonthCents: number;
  paidThisMonthCount: number;
  overdueCount: number;
  overdueSumCents: number;
};

/** Compute dashboard stats from invoice list. Uses defaultCurrency for summing (only invoices in that currency). */
export function computeDashboardStats(
  invoices: InvoiceRow[],
  defaultCurrency: string
): DashboardStats {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = now.toISOString().slice(0, 10);

  let unpaidSumCents = 0;
  let unpaidCount = 0;
  let paidThisMonthCents = 0;
  let paidThisMonthCount = 0;
  let overdueCount = 0;
  let overdueSumCents = 0;

  for (const inv of invoices) {
    const isPaid = inv.status === "paid" && inv.paid_at;
    const isVoid = inv.status === "void";
    const isUnpaid = !isPaid && !isVoid;
    const duePast = inv.due_date && inv.due_date < today;

    const displayCents = getDisplayAmountCents(
      Number(inv.amount_cents),
      inv.vat_included
    );

    if (isUnpaid) {
      unpaidCount++;
      if (inv.currency === defaultCurrency) {
        unpaidSumCents += displayCents;
      }
    }

    if (isPaid && inv.paid_at && inv.paid_at >= thisMonthStart.toISOString()) {
      paidThisMonthCount++;
      if (inv.currency === defaultCurrency) {
        paidThisMonthCents += displayCents;
      }
    }

    if (inv.status === "overdue" || (isUnpaid && duePast)) {
      overdueCount++;
      if (inv.currency === defaultCurrency) {
        overdueSumCents += displayCents;
      }
    }
  }

  return {
    unpaidSumCents,
    unpaidCount,
    paidThisMonthCents,
    paidThisMonthCount,
    overdueCount,
    overdueSumCents,
  };
}
