import type { InvoiceRow } from "@/app/invoices/actions";

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

    if (isUnpaid) {
      unpaidCount++;
      if (inv.currency === defaultCurrency) {
        unpaidSumCents += Number(inv.amount_cents);
      }
    }

    if (isPaid && inv.paid_at && inv.paid_at >= thisMonthStart.toISOString()) {
      paidThisMonthCount++;
      if (inv.currency === defaultCurrency) {
        paidThisMonthCents += Number(inv.amount_cents);
      }
    }

    if (inv.status === "overdue" || (isUnpaid && duePast)) {
      overdueCount++;
      if (inv.currency === defaultCurrency) {
        overdueSumCents += Number(inv.amount_cents);
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
