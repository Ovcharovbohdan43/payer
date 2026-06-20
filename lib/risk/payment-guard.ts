import type { SupabaseClient } from "@supabase/supabase-js";
import { isAccountBanned } from "@/lib/auth/account-status";
import {
  PAYMENT_RISK_STATUS,
  PAYMENTS_SUPPORT_EMAIL,
} from "@/lib/risk/constants";
import { checkNewSellerPaymentLimits } from "@/lib/risk/limits";
import {
  evaluateSellerVerification,
  formatVerificationBlockMessage,
} from "@/lib/risk/verification";

export type SellerPaymentProfile = {
  id?: string;
  account_status?: string | null;
  payments_enabled?: boolean | null;
  payment_risk_status?: string | null;
  onboarding_completed?: boolean | null;
  business_name?: string | null;
  business_description?: string | null;
  phone?: string | null;
  website?: string | null;
  company_type?: string | null;
  country?: string | null;
  default_currency?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  stripe_connect_account_id?: string | null;
  created_at?: string | null;
  payments_verified_at?: string | null;
  is_admin?: boolean | null;
};

export function canSellerAcceptPayments(profile: SellerPaymentProfile | null): {
  allowed: boolean;
  reason: string | null;
} {
  if (!profile) {
    return { allowed: false, reason: "Seller not found." };
  }

  if (profile.is_admin) {
    return { allowed: true, reason: null };
  }

  if (isAccountBanned(profile.account_status)) {
    return {
      allowed: false,
      reason: "Online payment is not available for this invoice.",
    };
  }

  if (!profile.stripe_connect_account_id) {
    return {
      allowed: false,
      reason: "Online payment is not available for this invoice.",
    };
  }

  if (!profile.payments_enabled) {
    return {
      allowed: false,
      reason: `This seller has not been approved to accept payments yet. Contact ${PAYMENTS_SUPPORT_EMAIL}.`,
    };
  }

  const status = profile.payment_risk_status ?? PAYMENT_RISK_STATUS.PENDING_VERIFICATION;
  if (
    status === PAYMENT_RISK_STATUS.FLAGGED ||
    status === PAYMENT_RISK_STATUS.PAUSED ||
    status === PAYMENT_RISK_STATUS.BLOCKED
  ) {
    return {
      allowed: false,
      reason: `Payments are temporarily paused for this seller. Contact ${PAYMENTS_SUPPORT_EMAIL}.`,
    };
  }

  if (status !== PAYMENT_RISK_STATUS.ACTIVE) {
    return {
      allowed: false,
      reason: `This seller is still being verified. Contact ${PAYMENTS_SUPPORT_EMAIL}.`,
    };
  }

  return { allowed: true, reason: null };
}

export async function assertCheckoutAllowed(
  supabase: SupabaseClient,
  profile: SellerPaymentProfile,
  amountCents: number,
  currency: string,
  emailConfirmed: boolean
): Promise<{ error: string } | null> {
  const base = canSellerAcceptPayments(profile);
  if (!base.allowed) {
    return { error: base.reason ?? "Payment not available." };
  }

  if (!profile.is_admin) {
    const checklist = evaluateSellerVerification({
      profile,
      emailConfirmed,
    });

    if (!checklist.complete) {
      return { error: formatVerificationBlockMessage(checklist) };
    }

    const limits = await checkNewSellerPaymentLimits(
      supabase,
      profile.id!,
      profile,
      amountCents,
      currency
    );
    if (!limits.allowed) {
      return { error: limits.reason ?? "Payment limit reached." };
    }
  }

  return null;
}

export function canConnectStripe(
  profile: SellerPaymentProfile,
  emailConfirmed: boolean
): { allowed: boolean; reason: string | null } {
  if (profile.is_admin) return { allowed: true, reason: null };
  if (isAccountBanned(profile.account_status)) {
    return { allowed: false, reason: "Account restricted." };
  }

  const checklist = evaluateSellerVerification({ profile, emailConfirmed });
  if (checklist.prohibited) {
    return {
      allowed: false,
      reason: formatVerificationBlockMessage(checklist),
    };
  }
  if (!checklist.complete) {
    return {
      allowed: false,
      reason: formatVerificationBlockMessage(checklist),
    };
  }

  return { allowed: true, reason: null };
}
