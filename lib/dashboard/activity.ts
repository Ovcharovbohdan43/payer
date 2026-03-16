import type { InvoiceRow } from "@/app/invoices/actions";
import { formatAmount, getDisplayAmountCents } from "@/lib/invoices/utils";

const REMINDER_DAY_COLUMNS: { key: keyof InvoiceRow; day: string }[] = [
  { key: "reminder_1d_sent_at", day: "1d" },
  { key: "reminder_2d_sent_at", day: "2d" },
  { key: "reminder_3d_sent_at", day: "3d" },
  { key: "reminder_5d_sent_at", day: "5d" },
  { key: "reminder_7d_sent_at", day: "7d" },
  { key: "reminder_10d_sent_at", day: "10d" },
  { key: "reminder_14d_sent_at", day: "14d" },
];

export type ActivityItem = {
  type:
    | "paid"
    | "sent"
    | "viewed"
    | "overdue"
    | "reminder_sent"
    | "escalation"
    | "currency_changed"
    | "payout"
    | "offer_accepted"
    | "offer_declined";
  label: string;
  invoiceId?: string;
  offerId?: string;
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

export type OfferAuditRow = {
  created_at: string;
  entity_id: string;
  action: string;
  meta: { client_name?: string; comment?: string } | null;
};

/**
 * Build activity feed from invoice events + currency change audits + payouts + offer audits.
 * One most-relevant event per invoice: paid > overdue > viewed > sent.
 * Merges with currency_changed events from audit_logs.
 * Sorted by most recent first.
 */
export function buildActivityFromInvoices(
  invoices: InvoiceRow[],
  _currency: string,
  currencyChanges: CurrencyChangeAudit[] = [],
  payouts: PayoutRow[] = [],
  offerAudits: OfferAuditRow[] = []
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
    }

    if (inv.escalation_sent_at) {
      items.push({
        type: "escalation",
        invoiceId: inv.id,
        label: `Overdue reminder sent to ${inv.client_name}`,
        sortAt: inv.escalation_sent_at,
      });
    }

    for (const { key, day } of REMINDER_DAY_COLUMNS) {
      const sentAt = inv[key] as string | null | undefined;
      if (sentAt) {
        items.push({
          type: "reminder_sent",
          invoiceId: inv.id,
          label: `Reminder sent (${day}) to ${inv.client_name}`,
          sortAt: sentAt,
        });
      }
    }

    if (!isPaid && isOverdue) {
      items.push({
        type: "overdue",
        invoiceId: inv.id,
        label: `${inv.client_name} overdue`,
        sortAt: inv.due_date ?? inv.created_at,
      });
    } else if (!isPaid && inv.viewed_at) {
      items.push({
        type: "viewed",
        invoiceId: inv.id,
        label: `${inv.client_name} viewed invoice`,
        sortAt: inv.viewed_at,
      });
    } else if (!isPaid && inv.sent_at) {
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

  for (const a of offerAudits) {
    const clientName = a.meta?.client_name ?? "Client";
    if (a.action === "accepted") {
      items.push({
        type: "offer_accepted",
        offerId: a.entity_id,
        label: `${clientName} accepted your offer`,
        sortAt: a.created_at,
        href: `/offers/${a.entity_id}`,
      });
    } else if (a.action === "declined") {
      items.push({
        type: "offer_declined",
        offerId: a.entity_id,
        label: `${clientName} declined your offer`,
        sortAt: a.created_at,
        href: `/offers/${a.entity_id}`,
      });
    }
  }

  items.sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());
  return items;
}
