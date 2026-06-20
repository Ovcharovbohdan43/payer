import type { SupabaseClient } from "@supabase/supabase-js";
import {
  NEW_SELLER_DAILY_LIMIT_MAJOR,
  NEW_SELLER_DAILY_MAX_PAYMENTS,
  NEW_SELLER_PERIOD_DAYS,
  PAYMENTS_SUPPORT_EMAIL,
} from "@/lib/risk/constants";
import { isCountryCurrencyConsistent } from "@/lib/risk/country-currency";

export type SellerLimitProfile = {
  created_at?: string | null;
  payments_verified_at?: string | null;
  is_admin?: boolean | null;
  country?: string | null;
  default_currency?: string | null;
};

export type PaymentLimitCheck = {
  allowed: boolean;
  reason: string | null;
  code?: string;
};

function isNewSeller(profile: SellerLimitProfile): boolean {
  if (profile.is_admin) return false;
  const anchor = profile.payments_verified_at ?? profile.created_at;
  if (!anchor) return true;
  const ageMs = Date.now() - new Date(anchor).getTime();
  return ageMs < NEW_SELLER_PERIOD_DAYS * 24 * 60 * 60 * 1000;
}

function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function checkNewSellerPaymentLimits(
  supabase: SupabaseClient,
  userId: string,
  profile: SellerLimitProfile,
  amountCents: number,
  invoiceCurrency: string
): Promise<PaymentLimitCheck> {
  if (profile.is_admin) return { allowed: true, reason: null };

  if (
    !isCountryCurrencyConsistent(profile.country, invoiceCurrency) &&
    !isCountryCurrencyConsistent(profile.country, profile.default_currency)
  ) {
    return {
      allowed: false,
      code: "currency_mismatch",
      reason: `This payment currency is not allowed for your business country. Contact ${PAYMENTS_SUPPORT_EMAIL}.`,
    };
  }

  if (!isNewSeller(profile)) {
    return { allowed: true, reason: null };
  }

  const dailyCapCents = NEW_SELLER_DAILY_LIMIT_MAJOR * 100;
  const dayStart = startOfUtcDay();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id")
    .eq("user_id", userId);

  const invoiceIds = (invoices ?? []).map((i) => i.id);
  if (!invoiceIds.length) {
    if (amountCents > dailyCapCents) {
      return {
        allowed: false,
        code: "daily_volume",
        reason: `New accounts are limited to ${NEW_SELLER_DAILY_LIMIT_MAJOR} per day in total payments. Contact ${PAYMENTS_SUPPORT_EMAIL}.`,
      };
    }
    return { allowed: true, reason: null };
  }

  const { data: paymentsToday } = await supabase
    .from("payments")
    .select("amount_cents")
    .in("invoice_id", invoiceIds)
    .gte("paid_at", dayStart);

  const rows = paymentsToday ?? [];
  const countToday = rows.length;
  const volumeToday = rows.reduce((sum, p) => sum + Number(p.amount_cents ?? 0), 0);

  if (countToday >= NEW_SELLER_DAILY_MAX_PAYMENTS) {
    return {
      allowed: false,
      code: "daily_payment_count",
      reason: `New accounts are limited to ${NEW_SELLER_DAILY_MAX_PAYMENTS} payments per day. Contact ${PAYMENTS_SUPPORT_EMAIL}.`,
    };
  }

  if (volumeToday + amountCents > dailyCapCents) {
    return {
      allowed: false,
      code: "daily_volume",
      reason: `New accounts are limited to ${NEW_SELLER_DAILY_LIMIT_MAJOR} per day in total payments. Contact ${PAYMENTS_SUPPORT_EMAIL}.`,
    };
  }

  return { allowed: true, reason: null };
}
