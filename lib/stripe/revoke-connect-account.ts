import Stripe from "stripe";

export type RevokeConnectResult =
  | { ok: true; mode: "deleted" }
  | {
      ok: true;
      mode: "pending_balance";
      warning: string;
      currencies: string[];
    }
  | { ok: false; error: string };

function parseNonZeroBalanceCurrencies(message: string): string[] {
  const match = message.match(/non-zero balances:\s*(.+)$/i);
  if (!match?.[1]) return [];
  return match[1]
    .split(",")
    .map((c) => c.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

function isNonZeroBalanceError(message: string): boolean {
  return /non-zero balance/i.test(message);
}

async function markConnectAccountBanned(
  stripe: Stripe,
  accountId: string
): Promise<void> {
  await stripe.accounts.update(accountId, {
    metadata: {
      puyer_banned: "true",
      puyer_banned_at: new Date().toISOString(),
    },
  });
}

async function getNonZeroBalanceCurrencies(
  stripe: Stripe,
  accountId: string
): Promise<string[]> {
  try {
    const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
    return (balance.available ?? [])
      .concat(balance.pending ?? [])
      .filter((b) => b.amount !== 0)
      .map((b) => b.currency.toUpperCase());
  } catch {
    return [];
  }
}

/**
 * Delete a connected Express account on Stripe when a user is banned.
 * If Stripe refuses deletion (non-zero balance in live mode), mark metadata
 * and return pending_balance — Puyer checkout is already disabled via profile.
 */
export async function revokeStripeConnectAccount(
  accountId: string
): Promise<RevokeConnectResult> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: false, error: "Stripe is not configured" };
  }

  const stripe = new Stripe(secret);

  try {
    await stripe.accounts.del(accountId);
    return { ok: true, mode: "deleted" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe revoke failed";

    if (!isNonZeroBalanceError(message)) {
      console.error("[stripe revoke connect]", accountId, message);
      return { ok: false, error: message };
    }

    const parsed = parseNonZeroBalanceCurrencies(message);
    const currencies =
      parsed.length > 0
        ? parsed
        : await getNonZeroBalanceCurrencies(stripe, accountId);

    try {
      await markConnectAccountBanned(stripe, accountId);
    } catch (metaErr) {
      console.error("[stripe revoke connect] metadata update", accountId, metaErr);
    }

    const currencyList = currencies.length > 0 ? currencies.join(", ") : "unknown";
    const warning =
      `Stripe cannot delete this Connect account yet because it has a non-zero balance (${currencyList}). ` +
      `Puyer is already disconnected — no new invoice payments via the platform. ` +
      `After Stripe pays out the balance, run revoke again or wait for the daily cron.`;

    console.warn("[stripe revoke connect] pending balance", accountId, currencyList);
    return { ok: true, mode: "pending_balance", warning, currencies };
  }
}
