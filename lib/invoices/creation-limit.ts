import type { SupabaseClient } from "@supabase/supabase-js";

export const FIRST_DAY_INVOICE_MAX = 1;
export const FIRST_DAY_MS = 24 * 60 * 60 * 1000;
export const UNLIMITED_INVOICE_LIMIT = -1;

export const INVOICE_LIMIT_SUPPORT_EMAIL = "support@puyer.org";

export type InvoiceCreationProfile = {
  created_at: string;
  invoice_creation_limit: number | null;
  invoice_creation_reviewed_at: string | null;
  is_admin?: boolean | null;
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
};

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

  const accountAgeMs = Date.now() - new Date(profile.created_at).getTime();
  const inFirstDay = accountAgeMs < FIRST_DAY_MS;

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
      message: `New account: you can create ${FIRST_DAY_INVOICE_MAX} invoice in your first 24 hours while we verify your account.`,
      maxInvoices: FIRST_DAY_INVOICE_MAX,
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
        "created_at, invoice_creation_limit, invoice_creation_reviewed_at, is_admin"
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

  const check = describeInvoiceCreationLimit(profile, count ?? 0);
  if (!check.allowed) {
    return { error: check.message ?? "Invoice creation is not allowed." };
  }

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
    return `New account (day 1) — ${invoiceCount}/${FIRST_DAY_INVOICE_MAX} used`;
  }
  if (check.code === "pending_review") {
    return `Pending review — ${invoiceCount} invoice(s), creation frozen`;
  }
  return `Auto policy — ${invoiceCount} invoice(s)`;
}
