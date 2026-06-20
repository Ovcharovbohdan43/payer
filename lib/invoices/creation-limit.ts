import type { SupabaseClient } from "@supabase/supabase-js";
import { formatAmount } from "@/lib/invoices/utils";

export const FIRST_DAY_INVOICE_MAX = 1;
export const FIRST_DAY_MS = 24 * 60 * 60 * 1000;
export const UNLIMITED_INVOICE_LIMIT = -1;
/** Max first invoice total while account is under review (20 major units in any currency). */
export const FIRST_INVOICE_MAX_MAJOR = 20;

export const INVOICE_LIMIT_SUPPORT_EMAIL = "support@puyer.org";

export type InvoiceCreationProfile = {
  created_at?: string;
  invoice_creation_limit: number | null;
  invoice_creation_reviewed_at: string | null;
  is_admin?: boolean | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  payments_enabled?: boolean | null;
  payment_risk_status?: string | null;
};

export type InvoiceCreationCheckCode =
  | "allowed"
  | "blocked"
  | "partial"
  | "first_day"
  | "pending_review";

export type InvoiceCreationCheck = {
  allowed: boolean;
  code: InvoiceCreationCheckCode;
  message: string | null;
  maxInvoices: number | null;
  maxFirstInvoiceCents?: number | null;
};

/** Account awaiting Puyer support review (banner + admin "New" badge). */
export function isAccountPendingReview(profile: InvoiceCreationProfile): boolean {
  if (profile.is_admin) return false;
  if (profile.payments_enabled) return false;
  if (profile.payment_risk_status === "active") return false;
  if (profile.invoice_creation_limit === UNLIMITED_INVOICE_LIMIT) return false;
  if (profile.invoice_creation_limit === 0) return false;
  return !profile.invoice_creation_reviewed_at;
}

export function getFirstInvoiceMaxCents(currency: string): number {
  return FIRST_INVOICE_MAX_MAJOR * 100;
}

export function checkFirstInvoiceAmountLimit(
  profile: InvoiceCreationProfile,
  invoiceCount: number,
  amountCents: number,
  currency: string
): string | null {
  if (profile.is_admin) return null;
  if (profile.invoice_creation_limit === UNLIMITED_INVOICE_LIMIT) return null;
  if (profile.invoice_creation_reviewed_at) return null;
  if (invoiceCount > 0) return null;

  const maxCents = getFirstInvoiceMaxCents(currency);
  if (amountCents > maxCents) {
    return `While your account is under review, your first invoice cannot exceed ${formatAmount(maxCents, currency)} (platform test limit). Contact ${INVOICE_LIMIT_SUPPORT_EMAIL} after approval.`;
  }
  return null;
}

export function checkRequiredProfileFields(profile: {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}): string | null {
  if (!profile.first_name?.trim()) return "First name is required in Settings before creating invoices.";
  if (!profile.last_name?.trim()) return "Last name is required in Settings before creating invoices.";
  if (!profile.phone?.trim()) return "Phone number is required in Settings before creating invoices.";
  return null;
}

export const ACCOUNT_REVIEW_BANNER_MESSAGE =
  "Your account is under review by Puyer. This usually takes no more than 24 hours. You can create one test invoice (max £20 or equivalent) in the meantime.";

export function describeInvoiceCreationLimit(
  profile: InvoiceCreationProfile,
  invoiceCount: number
): InvoiceCreationCheck {
  if (profile.is_admin) {
    return { allowed: true, code: "allowed", message: null, maxInvoices: null };
  }

  const adminLimit = profile.invoice_creation_limit;

  if (adminLimit === 0) {
    return {
      allowed: false,
      code: "blocked",
      message: `Invoice creation is disabled on your account. Contact ${INVOICE_LIMIT_SUPPORT_EMAIL}.`,
      maxInvoices: 0,
    };
  }

  if (adminLimit === UNLIMITED_INVOICE_LIMIT) {
    return { allowed: true, code: "allowed", message: null, maxInvoices: null };
  }

  if (adminLimit !== null && adminLimit > 0) {
    if (invoiceCount >= adminLimit) {
      return {
        allowed: false,
        code: "partial",
        message: `You have reached your invoice limit (${adminLimit}). Contact ${INVOICE_LIMIT_SUPPORT_EMAIL} for a higher limit.`,
        maxInvoices: adminLimit,
      };
    }
    return {
      allowed: true,
      code: "allowed",
      message: null,
      maxInvoices: adminLimit,
    };
  }

  const accountAgeMs = Date.now() - new Date(profile.created_at ?? 0).getTime();
  const inFirstDay = profile.created_at ? accountAgeMs < FIRST_DAY_MS : false;

  if (inFirstDay) {
    if (invoiceCount >= FIRST_DAY_INVOICE_MAX) {
      return {
        allowed: false,
        code: "first_day",
        message: `New accounts can create up to ${FIRST_DAY_INVOICE_MAX} invoice in the first 24 hours. Puyer support will review your account — contact ${INVOICE_LIMIT_SUPPORT_EMAIL}.`,
        maxInvoices: FIRST_DAY_INVOICE_MAX,
      };
    }
    return {
      allowed: true,
      code: "allowed",
      message: `New account: you can create ${FIRST_DAY_INVOICE_MAX} test invoice (max ${FIRST_INVOICE_MAX_MAJOR} GBP/USD/EUR) in your first 24 hours while we verify your account.`,
      maxInvoices: FIRST_DAY_INVOICE_MAX,
      maxFirstInvoiceCents: getFirstInvoiceMaxCents("GBP"),
    };
  }

  if (!profile.invoice_creation_reviewed_at) {
    return {
      allowed: false,
      code: "pending_review",
      message: `Your account is pending review by Puyer support. You cannot create new invoices until access is approved. Contact ${INVOICE_LIMIT_SUPPORT_EMAIL}.`,
      maxInvoices: invoiceCount,
    };
  }

  return { allowed: true, code: "allowed", message: null, maxInvoices: null };
}

export async function assertUserCanCreateInvoice(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: string } | null> {
  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "created_at, invoice_creation_limit, invoice_creation_reviewed_at, is_admin, first_name, last_name, phone"
      )
      .eq("id", userId)
      .single(),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (!profile) {
    return { error: "Profile not found" };
  }

  const requiredErr = checkRequiredProfileFields(profile);
  if (requiredErr) return { error: requiredErr };

  const check = describeInvoiceCreationLimit(profile, count ?? 0);
  if (!check.allowed) {
    return { error: check.message ?? "Invoice creation is not allowed." };
  }

  return null;
}

export async function assertUserCanCreateInvoiceAmount(
  supabase: SupabaseClient,
  userId: string,
  amountCents: number,
  currency: string
): Promise<{ error: string } | null> {
  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("invoice_creation_limit, invoice_creation_reviewed_at, is_admin")
      .eq("id", userId)
      .single(),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  if (!profile) return { error: "Profile not found" };

  const amountErr = checkFirstInvoiceAmountLimit(
    profile,
    count ?? 0,
    amountCents,
    currency
  );
  if (amountErr) return { error: amountErr };
  return null;
}

export function formatInvoiceLimitAdminSummary(
  profile: InvoiceCreationProfile & {
    invoice_creation_limit_note?: string | null;
  },
  invoiceCount: number
): string {
  const check = describeInvoiceCreationLimit(profile, invoiceCount);

  if (profile.invoice_creation_limit === UNLIMITED_INVOICE_LIMIT) {
    return "Approved — unlimited invoices";
  }
  if (profile.invoice_creation_limit === 0) {
    return "Blocked — cannot create invoices";
  }
  if (profile.invoice_creation_limit !== null && profile.invoice_creation_limit > 0) {
    return `Partial — ${invoiceCount}/${profile.invoice_creation_limit} invoices used`;
  }
  if (check.code === "first_day") {
    return `New — day 1 review (${invoiceCount}/${FIRST_DAY_INVOICE_MAX}, max ${FIRST_INVOICE_MAX_MAJOR} per currency)`;
  }
  if (check.code === "pending_review") {
    return `New — pending review (${invoiceCount} invoice(s))`;
  }
  if (isAccountPendingReview(profile)) {
    return `New — pending review (${invoiceCount} invoice(s))`;
  }
  return `Auto policy — ${invoiceCount} invoice(s)`;
}
