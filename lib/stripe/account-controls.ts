import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { NEW_SELLER_PAYOUT_HOLD_DAYS } from "@/lib/risk/constants";

export function computePayoutHoldUntil(from = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + NEW_SELLER_PAYOUT_HOLD_DAYS);
  return d.toISOString();
}

/** New Connect accounts: manual payouts + metadata until review period ends. */
export function newAccountStripeSettings(): Stripe.AccountCreateParams["settings"] {
  return {
    payouts: {
      schedule: {
        interval: "manual",
      },
    },
  };
}

export async function applyNewSellerStripeRestrictions(
  accountId: string,
  userId: string
): Promise<void> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return;

  const stripe = new (await import("stripe")).default(secret);
  const holdUntil = computePayoutHoldUntil();

  await stripe.accounts.update(accountId, {
    settings: newAccountStripeSettings(),
    metadata: {
      supabase_user_id: userId,
      puyer_payout_hold: "true",
      puyer_payout_hold_until: holdUntil,
    },
  });

  const admin = createAdminClient();
  await admin.rpc("set_seller_payment_risk", {
    p_user_id: userId,
    p_status: "pending_verification",
    p_payments_enabled: false,
    p_note: null,
    p_payout_hold_until: holdUntil,
  });
}

export async function pauseSellerStripeAccount(
  accountId: string,
  reason: string
): Promise<void> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return;

  const stripe = new (await import("stripe")).default(secret);
  await stripe.accounts.update(accountId, {
    settings: {
      payouts: {
        schedule: {
          interval: "manual",
        },
      },
    },
    metadata: {
      puyer_payments_paused: "true",
      puyer_payments_paused_at: new Date().toISOString(),
      puyer_payments_paused_reason: reason.slice(0, 500),
    },
  });
}

export async function releaseSellerStripePayouts(accountId: string): Promise<void> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return;

  const stripe = new (await import("stripe")).default(secret);
  await stripe.accounts.update(accountId, {
    settings: {
      payouts: {
        schedule: {
          interval: "daily",
        },
      },
    },
    metadata: {
      puyer_payments_paused: "",
      puyer_payout_hold: "",
    },
  });
}

export async function releaseDuePayoutHolds(): Promise<{ released: number; errors: string[] }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const errors: string[] = [];
  let released = 0;

  const { data: rows } = await admin
    .from("profiles")
    .select("id, stripe_connect_account_id, payout_hold_until, payment_risk_status, payments_enabled")
    .not("stripe_connect_account_id", "is", null)
    .not("payout_hold_until", "is", null)
    .lte("payout_hold_until", now)
    .eq("payment_risk_status", "active")
    .eq("payments_enabled", true);

  for (const row of rows ?? []) {
    const accountId = row.stripe_connect_account_id;
    if (!accountId) continue;
    try {
      await releaseSellerStripePayouts(accountId);
      await admin
        .from("profiles")
        .update({ payout_hold_until: null, updated_at: now })
        .eq("id", row.id);
      released += 1;
    } catch (e) {
      errors.push(
        `${row.id}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  return { released, errors };
}
