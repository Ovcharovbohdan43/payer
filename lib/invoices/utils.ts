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

/** Stripe-like fee: 1.5% + fixed. Fixed in smallest unit: GBP 20p, USD 30¢, EUR 30¢. */
const FIXED_FEE_CENTS: Record<string, number> = {
  GBP: 20,
  USD: 30,
  EUR: 30,
};

export function calcPaymentProcessingFeeCents(
  amountBeforeFeeCents: number,
  currency: string
): number {
  const fixed = FIXED_FEE_CENTS[currency.toUpperCase()] ?? 30;
  const fee = (amountBeforeFeeCents * 0.015 + fixed) / 0.985;
  return Math.max(0, Math.ceil(fee));
}

/** Total amount to display/charge. invoices.amount_cents already stores the final total (with VAT when vat_included=false). */
export function getDisplayAmountCents(
  amountCents: number,
  _vatIncluded?: boolean | null
): number {
  return amountCents;
}
