import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PAYMENT_RISK_STATUS,
  POST_SIGNUP_BURST_PAYMENT_COUNT,
  POST_SIGNUP_BURST_WINDOW_MS,
  SAME_AMOUNT_FLAG_THRESHOLD,
} from "@/lib/risk/constants";
import { scanProhibitedContent } from "@/lib/risk/prohibited-content";
import { pauseSellerStripeAccount } from "@/lib/stripe/account-controls";

export type RiskFlagReason =
  | "same_amount_repeated"
  | "payment_burst_after_signup"
  | "currency_mismatch_payment"
  | "prohibited_content"
  | "stripe_account_warning"
  | "dispute_opened";

export async function logPaymentRiskEvent(
  userId: string,
  eventType: string,
  severity: "info" | "warning" | "critical",
  details: Record<string, unknown> = {}
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("payment_risk_events").insert({
    user_id: userId,
    event_type: eventType,
    severity,
    details,
  });
}

export async function flagSellerForReview(
  userId: string,
  reason: RiskFlagReason | string,
  details: Record<string, unknown> = {},
  status: "flagged" | "paused" = "flagged"
): Promise<void> {
  const admin = createAdminClient();
  const note =
    Object.keys(details).length > 0
      ? `${reason} — ${JSON.stringify(details)}`
      : String(reason);

  await admin.rpc("flag_seller_payments", {
    p_user_id: userId,
    p_reason: note.slice(0, 2000),
    p_status: status,
  });

  await logPaymentRiskEvent(userId, "seller_flagged", "critical", {
    reason: note,
    status,
    ...details,
  });

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_connect_account_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_connect_account_id) {
    await pauseSellerStripeAccount(profile.stripe_connect_account_id, note);
  }
}

async function getUserInvoiceIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("invoices")
    .select("id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.id);
}

export async function analyzePaymentPatterns(
  supabase: SupabaseClient,
  userId: string,
  profile: {
    created_at?: string | null;
    country?: string | null;
    default_currency?: string | null;
    business_name?: string | null;
    business_description?: string | null;
    company_type?: string | null;
    website?: string | null;
  },
  amountCents: number,
  currency: string
): Promise<RiskFlagReason | null> {
  const prohibited = scanProhibitedContent(
    profile.business_name,
    profile.business_description,
    profile.company_type,
    profile.website
  );
  if (prohibited.flagged) return "prohibited_content";

  const invoiceIds = await getUserInvoiceIds(supabase, userId);
  if (!invoiceIds.length) return null;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentPayments } = await supabase
    .from("payments")
    .select("amount_cents, currency, paid_at")
    .in("invoice_id", invoiceIds)
    .gte("paid_at", since24h)
    .order("paid_at", { ascending: false });

  const payments = recentPayments ?? [];
  const sameAmountCount =
    payments.filter((p) => Number(p.amount_cents) === amountCents).length + 1;

  if (sameAmountCount >= SAME_AMOUNT_FLAG_THRESHOLD) {
    return "same_amount_repeated";
  }

  if (profile.created_at) {
    const signupMs = new Date(profile.created_at).getTime();
    const burstEnd = signupMs + POST_SIGNUP_BURST_WINDOW_MS;
    const burstPayments = payments.filter(
      (p) => new Date(p.paid_at).getTime() <= burstEnd
    ).length;

    if (burstPayments + 1 >= POST_SIGNUP_BURST_PAYMENT_COUNT) {
      return "payment_burst_after_signup";
    }
  }

  const profileCurrency = (profile.default_currency ?? "").toUpperCase();
  const payCurrency = currency.toUpperCase();
  if (profileCurrency && payCurrency && profileCurrency !== payCurrency) {
    return "currency_mismatch_payment";
  }

  return null;
}

export async function runPostPaymentRiskCheck(
  userId: string,
  amountCents: number,
  currency: string
): Promise<void> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "created_at, country, default_currency, business_name, business_description, company_type, website, payment_risk_status, is_admin"
    )
    .eq("id", userId)
    .single();

  if (!profile || profile.is_admin) return;
  if (
    profile.payment_risk_status === PAYMENT_RISK_STATUS.BLOCKED ||
    profile.payment_risk_status === PAYMENT_RISK_STATUS.FLAGGED
  ) {
    return;
  }

  const flag = await analyzePaymentPatterns(admin, userId, profile, amountCents, currency);
  if (flag) {
    await flagSellerForReview(userId, flag, { amountCents, currency }, "paused");
  }
}

export async function scanProfileForProhibitedContent(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("business_name, business_description, company_type, website, is_admin")
    .eq("id", userId)
    .single();

  if (!profile || profile.is_admin) return false;

  const scan = scanProhibitedContent(
    profile.business_name,
    profile.business_description,
    profile.company_type,
    profile.website
  );

  if (scan.flagged) {
    await flagSellerForReview(userId, "prohibited_content", {
      matches: scan.matches,
    });
    return true;
  }

  return false;
}
