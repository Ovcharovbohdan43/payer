import type { InvoiceRow } from "@/app/invoices/actions";
import { formatAmount, getDisplayAmountCents } from "@/lib/invoices/utils";

export type ActivityItem = {
  type: "paid" | "sent" | "viewed" | "overdue" | "currency_changed" | "payout";
  label: string;
  invoiceId?: string;
  sortAt: string;
  href?: string;
};

export type CurrencyChangeAudit = {
  created_at: string;
  meta: { from?: string; to?: string } | null;
};

export type PayoutRow = {
  amount_cents: number;
  currency: string;
  created_at: string;
  arrival_date: string | null;
};

/**
 * Build activity feed from invoice events + currency change audits + payouts.
 * One most-relevant event per invoice: paid > overdue > viewed > sent.
 * Merges with currency_changed events from audit_logs.
 * Sorted by most recent first.
 */
export function buildActivityFromInvoices(
  invoices: InvoiceRow[],
  _currency: string,
  currencyChanges: CurrencyChangeAudit[] = [],
  payouts: PayoutRow[] = []
): ActivityItem[] {
  const items: ActivityItem[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const inv of invoices) {
    const isPaid = inv.status === "paid" && inv.paid_at;
    const isVoid = inv.status === "void";
    const isOverdue =
      inv.status === "overdue" ||
      (!isPaid && !isVoid && inv.due_date && inv.due_date < today);

    if (isVoid) continue;

    if (isPaid && inv.paid_at) {
      items.push({
        type: "paid",
        invoiceId: inv.id,
        label: `${inv.client_name} paid ${formatAmount(
          getDisplayAmountCents(Number(inv.amount_cents), inv.vat_included),
          inv.currency
        )}`,
        sortAt: inv.paid_at,
      });
    } else if (isOverdue) {
      items.push({
        type: "overdue",
        invoiceId: inv.id,
        label: `${inv.client_name} overdue`,
        sortAt: inv.due_date ?? inv.created_at,
      });
    } else if (inv.viewed_at) {
      items.push({
        type: "viewed",
        invoiceId: inv.id,
        label: `${inv.client_name} viewed invoice`,
        sortAt: inv.viewed_at,
      });
    } else if (inv.sent_at) {
      items.push({
        type: "sent",
        invoiceId: inv.id,
        label: `Invoice sent to ${inv.client_name}`,
        sortAt: inv.sent_at,
      });
    }
  }

  for (const a of currencyChanges) {
    const from = a.meta?.from ?? "?";
    const to = a.meta?.to ?? "?";
    items.push({
      type: "currency_changed",
      label: `Currency changed ${from} → ${to}. Counters reset.`,
      sortAt: a.created_at,
      href: "/settings",
    });
  }

  for (const p of payouts) {
    const amt = formatAmount(p.amount_cents, p.currency);
    const when = p.arrival_date
      ? `arrived ${new Date(p.arrival_date).toLocaleDateString("en-US")}`
      : "sent to bank";
    items.push({
      type: "payout",
      label: `Payout ${amt} ${when}`,
      sortAt: p.created_at,
      href: "/settings",
    });
  }

  items.sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());
  return items.slice(0, 8);
}
