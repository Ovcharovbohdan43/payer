import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export type StripeConnectDisplayStatus =
  | "not_connected"
  | "setup_incomplete"
  | "connected"
  | "restricted";

const STRIPE_REJECTION_PREFIX = "rejected.";

export function isStripeOnboardingIncomplete(account: Stripe.Account): boolean {
  if (account.charges_enabled && account.details_submitted) {
    return false;
  }

  const disabledReason = account.requirements?.disabled_reason ?? null;
  if (disabledReason?.startsWith(STRIPE_REJECTION_PREFIX)) {
    return false;
  }

  return !account.details_submitted || !account.charges_enabled;
}

export function shouldFlagStripeAccountRestrictions(account: Stripe.Account): boolean {
  if (isStripeOnboardingIncomplete(account)) {
    return false;
  }

  const disabledReason = account.requirements?.disabled_reason ?? null;
  if (disabledReason && disabledReason !== "requirements.past_due") {
    return true;
  }

  return account.details_submitted === true && account.charges_enabled === false;
}

export function getStripeConnectDisplayStatus(
  account: Stripe.Account
): StripeConnectDisplayStatus {
  if (isStripeOnboardingIncomplete(account)) {
    return "setup_incomplete";
  }

  if (account.charges_enabled && account.details_submitted) {
    return "connected";
  }

  const disabledReason = account.requirements?.disabled_reason ?? null;
  if (disabledReason?.startsWith(STRIPE_REJECTION_PREFIX)) {
    return "restricted";
  }

  if (account.details_submitted && !account.charges_enabled) {
    return "restricted";
  }

  return "setup_incomplete";
}

export function isInternalStripeWarningNote(note: string | null | undefined): boolean {
  if (!note) return false;
  return note.startsWith("stripe_account_warning");
}

/** User-safe copy — never expose raw JSON risk notes. */
export function getStripeConnectUserMessage(
  stripeConnectStatus: StripeConnectDisplayStatus,
  paymentRiskStatus?: string | null
): string | null {
  switch (stripeConnectStatus) {
    case "setup_incomplete":
      return "Your Stripe setup is not finished yet. Continue setup below so clients can pay invoices by card.";
    case "restricted":
      return "Stripe needs additional review before card payments can go live. Contact support@puyer.org if this persists.";
    case "connected":
      if (paymentRiskStatus === "paused" || paymentRiskStatus === "flagged") {
        return "Stripe is linked, but Puyer has temporarily paused invoice payments on your account.";
      }
      return null;
    default:
      return null;
  }
}

export async function clearIncompleteStripeOnboardingFlag(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("payment_risk_status, payment_risk_notes, payments_enabled")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const shouldClear =
    profile.payment_risk_status === "paused" &&
    isInternalStripeWarningNote(profile.payment_risk_notes);

  if (!shouldClear) return;

  await admin.rpc("set_seller_payment_risk", {
    p_user_id: userId,
    p_status: profile.payments_enabled ? "active" : "pending_verification",
    p_payments_enabled: profile.payments_enabled ?? false,
    p_note: "",
  });
}

export async function fetchAndSyncStripeConnectState(
  userId: string,
  accountId: string
): Promise<StripeConnectDisplayStatus | null> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return null;

  const stripe = new (await import("stripe")).default(secret);

  try {
    const account = await stripe.accounts.retrieve(accountId);
    const status = getStripeConnectDisplayStatus(account);

    if (status === "setup_incomplete") {
      await clearIncompleteStripeOnboardingFlag(userId);
    }

    return status;
  } catch {
    return null;
  }
}
