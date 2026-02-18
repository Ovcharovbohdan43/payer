/**
 * Invoice helpers: status labels, formatting, public URL.
 */

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "paid",
  "overdue",
  "void",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

export function getPublicInvoiceUrl(publicId: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/i/${publicId}`;
}

export function amountToCents(amountMajor: number): number {
  return Math.round(amountMajor * 100);
}
