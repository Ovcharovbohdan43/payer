import Stripe from "stripe";

/**
 * Delete a connected Express account on Stripe when a user is banned.
 * Clears the account from Stripe so they cannot receive new Connect payouts via Puyer.
 */
export async function revokeStripeConnectAccount(
  accountId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: false, error: "Stripe is not configured" };
  }

  try {
    const stripe = new Stripe(secret);
    await stripe.accounts.del(accountId);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe revoke failed";
    console.error("[stripe revoke connect]", accountId, message);
    return { ok: false, error: message };
  }
}
