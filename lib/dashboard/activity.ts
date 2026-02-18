import type { InvoiceRow } from "@/app/invoices/actions";
import { formatAmount } from "@/lib/invoices/utils";

export type ActivityItem = {
  type: "paid" | "sent" | "viewed" | "overdue";
  label: string;
  invoiceId: string;
  sortAt: string;
};

/**
 * Build activity feed from invoice events.
 * One most-relevant event per invoice: paid > overdue > viewed > sent.
 * Sorted by most recent first.
 */
export function buildActivityFromInvoices(
  invoices: InvoiceRow[],
  _currency: string
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
        label: `${inv.client_name} paid ${formatAmount(inv.amount_cents, inv.currency)}`,
        invoiceId: inv.id,
        sortAt: inv.paid_at,
      });
    } else if (isOverdue) {
      items.push({
        type: "overdue",
        label: `${inv.client_name} overdue`,
        invoiceId: inv.id,
        sortAt: inv.due_date ?? inv.created_at,
      });
    } else if (inv.viewed_at) {
      items.push({
        type: "viewed",
        label: `${inv.client_name} viewed invoice`,
        invoiceId: inv.id,
        sortAt: inv.viewed_at,
      });
    } else if (inv.sent_at) {
      items.push({
        type: "sent",
        label: `Invoice sent to ${inv.client_name}`,
        invoiceId: inv.id,
        sortAt: inv.sent_at,
      });
    }
  }

  items.sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());
  return items.slice(0, 10);
}
