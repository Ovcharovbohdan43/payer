import type Stripe from "stripe";

/** Default country for Connect accounts. Use GB for UK Stripe, US for US Stripe. */
export function getConnectCountry(_profileBusinessName?: string | null): string {
  const env = process.env.STRIPE_CONNECT_COUNTRY?.trim().toUpperCase();
  if (env === "GB" || env === "US" || env === "DE" || env === "FR") return env;
  return "GB";
}

/**
 * Create an Express connected account.
 *
 * Express accounts use fees.payer `application_express`. With **direct charges**
 * (Checkout created on the connected account), Stripe payment processing fees
 * are billed to the connected account, not the platform.
 *
 * Note: `controller.fees.payer = account` is incompatible with Express Dashboard
 * per Stripe API rules. Direct charges are the supported way for Express SaaS.
 */
export function buildConnectAccountParams(
  userId: string,
  email: string | undefined,
  country: string
): Stripe.AccountCreateParams {
  return {
    type: "express",
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { supabase_user_id: userId },
  };
}

/** Shown on invoice pay page and Stripe Checkout before payment. */
export const CHECKOUT_FEE_DISCLAIMER =
  "Card processing fees are deducted from the seller's payout by Stripe. Puyer does not pay transaction fees on behalf of sellers.";

export type InvoiceCheckoutInput = {
  publicId: string;
  invoiceId: string;
  amountCents: number;
  currency: string;
  businessName?: string | null;
  paymentProcessingFeeIncluded?: boolean | null;
  paymentProcessingFeeCents?: number | null;
  successUrl: string;
  cancelUrl: string;
};

/** Build Checkout line items and disclaimer for a direct charge (no platform transfer). */
export function buildInvoiceCheckoutSessionParams(
  input: InvoiceCheckoutInput
): Stripe.Checkout.SessionCreateParams {
  const currency = input.currency.toLowerCase();
  const feeCents =
    input.paymentProcessingFeeIncluded &&
    typeof input.paymentProcessingFeeCents === "number" &&
    input.paymentProcessingFeeCents > 0
      ? input.paymentProcessingFeeCents
      : 0;
  const subtotalCents = Math.max(0, input.amountCents - feeCents);
  const seller = input.businessName?.trim() || "the seller";

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    feeCents > 0
      ? [
          {
            price_data: {
              currency,
              unit_amount: subtotalCents,
              product_data: {
                name: "Invoice payment",
                description: `Invoice ${input.publicId}`,
              },
            },
            quantity: 1,
          },
          {
            price_data: {
              currency,
              unit_amount: feeCents,
              product_data: {
                name: "Card processing fee",
                description: "Covers Stripe transaction costs for the seller",
              },
            },
            quantity: 1,
          },
        ]
      : [
          {
            price_data: {
              currency,
              unit_amount: input.amountCents,
              product_data: {
                name: "Invoice payment",
                description: `Invoice ${input.publicId}`,
              },
            },
            quantity: 1,
          },
        ];

  return {
    mode: "payment",
    line_items: lineItems,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.invoiceId,
    metadata: { invoice_public_id: input.publicId },
    custom_text: {
      submit: {
        message: `Stripe card fees are paid by ${seller}, not by Puyer. ${CHECKOUT_FEE_DISCLAIMER}`,
      },
    },
  };
}

/**
 * Invoice Checkout as a direct charge on the connected account.
 * Funds and Stripe processing fees stay on the connected account — the platform
 * balance is not debited (unlike destination charges with transfer_data).
 */
export async function createDirectChargeCheckoutSession(
  stripe: Stripe,
  connectedAccountId: string,
  params: Stripe.Checkout.SessionCreateParams
): Promise<Stripe.Checkout.Session> {
  if (params.payment_intent_data?.transfer_data) {
    throw new Error("Destination charges (transfer_data) are not allowed — use direct charges.");
  }

  return stripe.checkout.sessions.create(params, {
    stripeAccount: connectedAccountId,
  });
}
