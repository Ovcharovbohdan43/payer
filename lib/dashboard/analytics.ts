import type { InvoiceRow } from "@/app/invoices/actions";
import { getDisplayAmountCents } from "@/lib/invoices/utils";

export type AnalyticsData = {
  revenueThisWeekCents: number;
  revenueThisMonthCents: number;
  revenueAllTimeCents: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  paidSumCents: number;
  unpaidSumCents: number;
  overdueSumCents: number;
  clientCount: number;
  offerCount: number;
  offerAcceptedCount: number;
  offerDeclinedCount: number;
  paymentSuccessRate: number | null;
  payouts: { amount_cents: number; currency: string; created_at: string; arrival_date: string | null }[];
};

export function computeAnalytics(
  invoices: InvoiceRow[],
  clientCount: number,
  offerCount: number,
  offerAcceptedCount: number,
  offerDeclinedCount: number,
  payouts: { amount_cents: number; currency: string; created_at: string; arrival_date: string | null }[],
  defaultCurrency: string
): AnalyticsData {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const today = now.toISOString().slice(0, 10);

  let revenueThisWeekCents = 0;
  let revenueThisMonthCents = 0;
  let revenueAllTimeCents = 0;
  let paidCount = 0;
  let unpaidCount = 0;
  let overdueCount = 0;
  let paidSumCents = 0;
  let unpaidSumCents = 0;
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
    const inCurrency = inv.currency === defaultCurrency;

    if (isPaid && inv.paid_at) {
      paidCount++;
      if (inCurrency) {
        paidSumCents += displayCents;
        revenueAllTimeCents += displayCents;
        const paidAt = new Date(inv.paid_at);
        if (paidAt >= thisMonthStart) revenueThisMonthCents += displayCents;
        if (paidAt >= thisWeekStart) revenueThisWeekCents += displayCents;
      }
    }

    if (isUnpaid) {
      unpaidCount++;
      if (inCurrency) unpaidSumCents += displayCents;
    }

    if (inv.status === "overdue" || (isUnpaid && duePast)) {
      overdueCount++;
      if (inCurrency) overdueSumCents += displayCents;
    }
  }

  const totalRelevant = paidCount + unpaidCount;
  const paymentSuccessRate =
    totalRelevant > 0 ? Math.round((paidCount / totalRelevant) * 100) : null;

  return {
    revenueThisWeekCents,
    revenueThisMonthCents,
    revenueAllTimeCents,
    paidCount,
    unpaidCount,
    overdueCount,
    paidSumCents,
    unpaidSumCents,
    overdueSumCents,
    clientCount,
    offerCount,
    offerAcceptedCount,
    offerDeclinedCount,
    paymentSuccessRate,
    payouts,
  };
}
