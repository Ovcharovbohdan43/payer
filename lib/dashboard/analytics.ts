import type { InvoiceRow } from "@/app/invoices/actions";
import { getDisplayAmountCents } from "@/lib/invoices/utils";

export type RevenueByWeek = {
  week: string;
  label: string;
  /** Paid revenue in currency units. */
  revenue: number;
  /** Unpaid (sent/viewed) with sent_at in this week, in currency units. */
  expected: number;
};
export type PayoutByPeriod = { period: string; label: string; amount: number };

/** Per-client totals in default currency (all time). */
export type ClientAmounts = {
  clientName: string;
  paidCents: number;
  unpaidCents: number;
};

export type AnalyticsData = {
  revenueThisWeekCents: number;
  revenueThisMonthCents: number;
  revenueAllTimeCents: number;
  revenueByWeek: RevenueByWeek[];
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  /** Unpaid with status sent or viewed (expected inflows). */
  expectedCount: number;
  expectedSumCents: number;
  paidSumCents: number;
  unpaidSumCents: number;
  overdueSumCents: number;
  clientCount: number;
  offerCount: number;
  offerAcceptedCount: number;
  offerDeclinedCount: number;
  paymentSuccessRate: number | null;
  payouts: { amount_cents: number; currency: string; created_at: string; arrival_date: string | null }[];
  payoutsByPeriod: PayoutByPeriod[];
  /** Sum of payouts not yet arrived (arrival_date null or in future). */
  payoutsInTransitCents: number;
  /** Per-client paid/unpaid in default currency, sorted by total amount desc. */
  revenueByClient: ClientAmounts[];
  /** When period filter is active (7/30/90 days). */
  periodDays?: number;
  /** Revenue (paid) in the selected period; set when periodDays is set. */
  revenueInPeriodCents?: number;
};

export function computeAnalytics(
  invoices: InvoiceRow[],
  clientCount: number,
  offerCount: number,
  offerAcceptedCount: number,
  offerDeclinedCount: number,
  payouts: { amount_cents: number; currency: string; created_at: string; arrival_date: string | null }[],
  defaultCurrency: string,
  periodDays?: number
): AnalyticsData {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const today = now.toISOString().slice(0, 10);

  const rangeStart =
    periodDays !== undefined && [7, 30, 90].includes(periodDays)
      ? (() => {
          const d = new Date(now);
          d.setDate(d.getDate() - periodDays);
          d.setHours(0, 0, 0, 0);
          return d;
        })()
      : null;
  const rangeEnd = rangeStart ? new Date(now) : null;

  let revenueThisWeekCents = 0;
  let revenueThisMonthCents = 0;
  let revenueAllTimeCents = 0;
  let revenueInPeriodCents = 0;
  let paidCount = 0;
  let unpaidCount = 0;
  let overdueCount = 0;
  let expectedCount = 0;
  let paidSumCents = 0;
  let unpaidSumCents = 0;
  let overdueSumCents = 0;
  let expectedSumCents = 0;
  for (const inv of invoices) {
    const isPaid = inv.status === "paid" && inv.paid_at;
    const isVoid = inv.status === "void";
    const isUnpaid = !isPaid && !isVoid;
    const duePast = inv.due_date && inv.due_date < today;
    const isExpected = isUnpaid && (inv.status === "sent" || inv.status === "viewed");

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
        if (rangeStart && rangeEnd && paidAt >= rangeStart && paidAt <= rangeEnd) {
          revenueInPeriodCents += displayCents;
        }
      }
    }

    if (isUnpaid) {
      unpaidCount++;
      if (inCurrency) unpaidSumCents += displayCents;
    }

    if (isExpected && inCurrency) {
      expectedCount++;
      expectedSumCents += displayCents;
    }

    if (inv.status === "overdue" || (isUnpaid && duePast)) {
      overdueCount++;
      if (inCurrency) overdueSumCents += displayCents;
    }
  }

  const totalRelevant = paidCount + unpaidCount;
  const paymentSuccessRate =
    totalRelevant > 0 ? Math.round((paidCount / totalRelevant) * 100) : null;

  // Revenue by week (last 8 weeks): paid revenue + expected (unpaid with sent_at in week)
  const revenueByWeek: RevenueByWeek[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    let weekRevenue = 0;
    let weekExpected = 0;
    for (const inv of invoices) {
      if (inv.currency !== defaultCurrency) continue;
      const displayCents = getDisplayAmountCents(
        Number(inv.amount_cents),
        inv.vat_included
      );
      if (inv.status === "paid" && inv.paid_at) {
        const paidAt = new Date(inv.paid_at);
        if (paidAt >= weekStart && paidAt < weekEnd) {
          weekRevenue += displayCents;
        }
      } else if (
        (inv.status === "sent" || inv.status === "viewed") &&
        inv.sent_at
      ) {
        const sentAt = new Date(inv.sent_at);
        if (sentAt >= weekStart && sentAt < weekEnd) {
          weekExpected += displayCents;
        }
      }
    }
    const weekKey = weekStart.toISOString().slice(0, 10);
    const label =
      weekStart.getMonth() === weekEnd.getMonth()
        ? `${weekStart.getDate()}–${weekEnd.getDate()} ${weekStart.toLocaleDateString("en-GB", { month: "short" })}`
        : `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    revenueByWeek.push({
      week: weekKey,
      label,
      revenue: weekRevenue / 100,
      expected: weekExpected / 100,
    });
  }
  const revenueByWeekFiltered =
    rangeStart && rangeEnd
      ? revenueByWeek.filter((w) => {
          const weekStart = new Date(w.week);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          return weekStart < rangeEnd && weekEnd > rangeStart;
        })
      : revenueByWeek;

  // Payouts by period (last 8 weeks, same structure)
  const payoutMap = new Map<string, number>();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    payoutMap.set(weekStart.toISOString().slice(0, 10), 0);
  }
  for (const p of payouts) {
    if (p.currency !== defaultCurrency) continue;
    const d = new Date(p.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().slice(0, 10);
    if (payoutMap.has(key)) {
      payoutMap.set(key, payoutMap.get(key)! + Number(p.amount_cents) / 100);
    }
  }
  const payoutsByPeriod: PayoutByPeriod[] = [];
  const sortedWeeks = Array.from(payoutMap.keys()).sort();
  for (const period of sortedWeeks) {
    const weekStart = new Date(period);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const label =
      weekStart.getMonth() === weekEnd.getMonth()
        ? `${weekStart.getDate()}–${weekEnd.getDate()} ${weekStart.toLocaleDateString("en-GB", { month: "short" })}`
        : `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    payoutsByPeriod.push({
      period,
      label,
      amount: payoutMap.get(period) ?? 0,
    });
  }

  const todayDate = now.toISOString().slice(0, 10);
  let payoutsInTransitCents = 0;
  for (const p of payouts) {
    if (p.currency !== defaultCurrency) continue;
    const arrival = p.arrival_date;
    if (arrival == null || arrival > todayDate) {
      payoutsInTransitCents += Number(p.amount_cents);
    }
  }

  // Per-client aggregates (default currency; when period set, paid filtered by period)
  const clientMap = new Map<string, { paidCents: number; unpaidCents: number }>();
  for (const inv of invoices) {
    const inCurrency = inv.currency === defaultCurrency;
    if (!inCurrency) continue;
    if (inv.status === "void") continue;
    const displayCents = getDisplayAmountCents(
      Number(inv.amount_cents),
      inv.vat_included
    );
    const name = inv.client_name?.trim() || "—";
    if (!clientMap.has(name)) {
      clientMap.set(name, { paidCents: 0, unpaidCents: 0 });
    }
    const row = clientMap.get(name)!;
    if (inv.status === "paid" && inv.paid_at) {
      if (!rangeStart || !rangeEnd) {
        row.paidCents += displayCents;
      } else {
        const paidAt = new Date(inv.paid_at);
        if (paidAt >= rangeStart && paidAt <= rangeEnd) {
          row.paidCents += displayCents;
        }
      }
    } else {
      row.unpaidCents += displayCents;
    }
  }
  const revenueByClient: ClientAmounts[] = Array.from(clientMap.entries())
    .map(([clientName, { paidCents, unpaidCents }]) => ({
      clientName,
      paidCents,
      unpaidCents,
    }))
    .filter((c) => c.paidCents > 0 || c.unpaidCents > 0)
    .sort((a, b) => b.paidCents + b.unpaidCents - (a.paidCents + a.unpaidCents));

  return {
    revenueThisWeekCents,
    revenueThisMonthCents,
    revenueAllTimeCents,
    revenueByWeek: revenueByWeekFiltered,
    paidCount,
    unpaidCount,
    overdueCount,
    expectedCount,
    expectedSumCents,
    paidSumCents,
    unpaidSumCents,
    overdueSumCents,
    clientCount,
    offerCount,
    offerAcceptedCount,
    offerDeclinedCount,
    paymentSuccessRate,
    payouts,
    payoutsByPeriod,
    payoutsInTransitCents,
    revenueByClient,
    ...(rangeStart && rangeEnd && periodDays !== undefined
      ? { periodDays, revenueInPeriodCents }
      : {}),
  };
}
