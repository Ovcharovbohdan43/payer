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

/** Invoice Checkout as a direct charge on the connected account (connected account pays Stripe fees). */
export async function createDirectChargeCheckoutSession(
  stripe: Stripe,
  connectedAccountId: string,
  params: Stripe.Checkout.SessionCreateParams
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create(params, {
    stripeAccount: connectedAccountId,
  });
}
