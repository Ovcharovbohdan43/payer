/** Free plan: max 3 invoices. Paid plan: unlimited. */
export const FREE_INVOICE_LIMIT = 3;

export type SubscriptionStatus =
  | "free"
  | "active"
  | "canceled"
  | "past_due"
  | "trialing";

export function canCreateInvoice(
  subscriptionStatus: SubscriptionStatus | null,
  invoiceCount: number
): boolean {
  if (!subscriptionStatus || subscriptionStatus === "free") {
    return invoiceCount < FREE_INVOICE_LIMIT;
  }
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    return true;
  }
  return invoiceCount < FREE_INVOICE_LIMIT;
}

export function getInvoiceLimitText(
  subscriptionStatus: SubscriptionStatus | null,
  invoiceCount: number
): string {
  if (!subscriptionStatus || subscriptionStatus === "free") {
    return `${invoiceCount}/${FREE_INVOICE_LIMIT} invoices used`;
  }
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    return "Unlimited invoices";
  }
  return `${invoiceCount}/${FREE_INVOICE_LIMIT} invoices used`;
}
