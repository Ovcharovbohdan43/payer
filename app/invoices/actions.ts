"use server";

import { createClient } from "@/lib/supabase/server";
import { invoiceCreateSchema, invoiceUpdateSchema } from "@/lib/validations";
import {
  getPublicInvoiceUrl,
  formatAmount,
  getDisplayAmountCents,
  calcPaymentProcessingFeeCents,
} from "@/lib/invoices/utils";
import { canCreateInvoice } from "@/lib/subscription";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendInvoiceEmail, sendReminderEmail } from "@/lib/email/send";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

const REMINDER_RATE_LIMIT_HOURS = parseInt(
  process.env.REMINDER_RATE_LIMIT_HOURS ?? "24",
  10
);

export type InvoiceLineItem = {
  description: string;
  amount_cents: number;
  discount_percent?: number;
};

export type InvoiceRow = {
  id: string;
  number: string;
  public_id: string;
  status: string;
  client_name: string;
  client_email: string | null;
  amount_cents: number;
  currency: string;
  description: string | null;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  voided_at: string | null;
  due_date: string | null;
  notes: string | null;
  stripe_payment_intent_id: string | null;
  vat_included: boolean | null;
  payment_processing_fee_included?: boolean | null;
  payment_processing_fee_cents?: number | null;
  auto_remind_enabled?: boolean;
  auto_remind_days?: string;
  recurring?: boolean;
  recurring_interval?: string | null;
  recurring_interval_value?: number | null;
  recurring_parent_id?: string | null;
  discount_type?: string | null;
  discount_value?: number | null;
  line_items?: InvoiceLineItem[];
};

export type CreateResult =
  | { error: string }
  | { invoiceId: string; publicUrl: string; number: string; intent: string };

export async function createInvoiceAction(
  formData: FormData,
  options: { markSent: boolean }
): Promise<CreateResult> {
  const raw = {
    clientId: formData.get("clientId") ?? "",
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail") ?? "",
    currency: formData.get("currency") ?? "USD",
    dueDate: formData.get("dueDate") ?? "",
    notes: formData.get("notes") ?? "",
    vatIncluded: formData.get("vatIncluded") ?? "",
    paymentProcessingFeeIncluded: formData.get("paymentProcessingFeeIncluded") ?? "",
    autoRemindEnabled: formData.get("autoRemindEnabled") ?? "",
    autoRemindDays: formData.get("autoRemindDays") ?? "1,3,7",
    recurringEnabled: formData.get("recurringEnabled") ?? "",
    recurringInterval: formData.get("recurringInterval") ?? "days",
    recurringIntervalValue: formData.get("recurringIntervalValue") ?? "7",
    discountType: formData.get("discountType") ?? "none",
    discountPercent: formData.get("discountPercent") ?? "",
    discountCents: formData.get("discountCents") ?? "",
    lineItems: formData.get("lineItems") ?? "[]",
  };
  const parsed = invoiceCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.clientName?.[0] ??
      first.lineItems?.[0] ??
      "Add at least one service with description and amount";
    return { error: msg };
  }

  const vatIncluded = parsed.data.vatIncluded ?? false;
  const paymentProcessingFeeIncluded = parsed.data.paymentProcessingFeeIncluded ?? false;
  const lineItems = parsed.data.lineItems;
  const currency = parsed.data.currency;
  const discountType = parsed.data.discountType ?? "none";
  const discountPercent = parsed.data.discountPercent ?? 0;
  const discountCents = parsed.data.discountCents ?? 0;

  // 1. Apply per-line discounts
  const lineTotalsAfterDiscount = lineItems.map((i) => {
    const rawCents = Math.round(i.amount * 100);
    const dp = (i.discountPercent ?? 0);
    return Math.round(rawCents * (1 - dp / 100));
  });
  let subtotalAfterLineDiscounts = lineTotalsAfterDiscount.reduce((s, c) => s + c, 0);

  // 2. Apply invoice-level discount
  if (discountType === "percent" && discountPercent > 0) {
    subtotalAfterLineDiscounts = Math.round(subtotalAfterLineDiscounts * (1 - discountPercent / 100));
  } else if (discountType === "fixed" && discountCents > 0) {
    subtotalAfterLineDiscounts = Math.max(0, subtotalAfterLineDiscounts - discountCents);
  }

  let amountBeforeFeeCents: number;
  if (vatIncluded) {
    amountBeforeFeeCents = subtotalAfterLineDiscounts;
  } else {
    const vatCents = Math.round(subtotalAfterLineDiscounts * 0.2);
    amountBeforeFeeCents = subtotalAfterLineDiscounts + vatCents;
  }

  let amountCents = amountBeforeFeeCents;
  let paymentProcessingFeeCents: number | null = null;
  if (paymentProcessingFeeIncluded) {
    paymentProcessingFeeCents = calcPaymentProcessingFeeCents(amountBeforeFeeCents, currency);
    amountCents = amountBeforeFeeCents + paymentProcessingFeeCents;
  }

  const MIN_AMOUNT_CENTS = 100; // £1, $1, €1, etc.
  if (amountCents < MIN_AMOUNT_CENTS) {
    return { error: "Minimum invoice amount is £1 (or equivalent in your currency)" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const invoiceCount = count ?? 0;
  if (!canCreateInvoice(profile?.subscription_status ?? "free", invoiceCount)) {
    return {
      error: "Free plan limit: 3 invoices. Upgrade to Pro ($3/month) for unlimited invoices.",
    };
  }

  const { data: number } = await supabase.rpc("next_invoice_number", { p_user_id: user.id });
  if (!number || typeof number !== "string") return { error: "Could not generate invoice number" };

  const publicId = crypto.randomUUID();

  const autoRemindEnabled = parsed.data.autoRemindEnabled ?? false;
  const autoRemindDays = parsed.data.autoRemindDays ?? "1,3,7";
  const recurringEnabled = parsed.data.recurringEnabled ?? false;
  const recurringInterval = parsed.data.recurringInterval ?? "days";
  const recurringIntervalValue = parsed.data.recurringIntervalValue ?? 7;

  const { data: invoice, error: insertError } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      client_id: parsed.data.clientId || null,
      client_name: parsed.data.clientName,
      client_email: parsed.data.clientEmail || null,
      number,
      public_id: publicId,
      status: options.markSent ? "sent" : "draft",
      amount_cents: amountCents,
      currency: parsed.data.currency,
      description: null,
      notes: parsed.data.notes || null,
      due_date: parsed.data.dueDate || null,
      sent_at: options.markSent ? new Date().toISOString() : null,
      vat_included: vatIncluded,
      payment_processing_fee_included: paymentProcessingFeeIncluded,
      payment_processing_fee_cents: paymentProcessingFeeCents,
      discount_type: discountType !== "none" ? discountType : null,
      discount_value: discountType === "percent" ? discountPercent : discountType === "fixed" ? discountCents : null,
      auto_remind_enabled: options.markSent && autoRemindEnabled,
      auto_remind_days: autoRemindDays,
      recurring: recurringEnabled && options.markSent,
      recurring_interval: recurringEnabled ? recurringInterval : null,
      recurring_interval_value: recurringEnabled ? recurringIntervalValue : null,
      last_recurred_at: null,
    })
    .select("id, number, public_id")
    .single();

  if (insertError) return { error: insertError.message };
  if (!invoice) return { error: "Failed to create invoice" }

  const lineItemRows = lineItems.map((item, idx) => ({
    invoice_id: invoice.id,
    description: item.description,
    amount_cents: Math.round(item.amount * 100),
    discount_percent: Math.min(100, Math.max(0, item.discountPercent ?? 0)),
    sort_order: idx,
  }));

  const { error: lineItemsError } = await supabase
    .from("invoice_line_items")
    .insert(lineItemRows);

  if (lineItemsError) return { error: lineItemsError.message };

  revalidatePath("/invoices");
  revalidatePath("/dashboard");

  const publicUrl = getPublicInvoiceUrl(invoice.public_id, BASE_URL);
  const intent = (formData.get("intent") as string) || "copy";

  let emailSent: boolean | undefined;
  if (intent === "email" && parsed.data.clientEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("id", user.id)
      .single();
    const amountFormatted = formatAmount(
      getDisplayAmountCents(amountCents, vatIncluded),
      parsed.data.currency
    );
    const result = await sendInvoiceEmail({
      to: parsed.data.clientEmail,
      businessName: profile?.business_name ?? "Business",
      clientName: parsed.data.clientName,
      amountFormatted,
      invoiceNumber: invoice.number,
      publicUrl,
      dueDate: parsed.data.dueDate || null,
    });
    emailSent = result.ok;
    if (!result.ok) {
      console.error("[createInvoice] email failed:", result.error);
    }
  }

  return {
    invoiceId: invoice.id,
    publicUrl,
    number: invoice.number,
    intent,
    ...(emailSent !== undefined && { emailSent }),
  };
}

export async function listInvoices(): Promise<InvoiceRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("invoices")
    .select(
      "id, number, public_id, status, client_name, client_email, amount_cents, currency, description, created_at, sent_at, viewed_at, paid_at, voided_at, due_date, notes, stripe_payment_intent_id, vat_included"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as InvoiceRow[];
}

export async function getInvoiceById(id: string): Promise<InvoiceRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, number, public_id, status, client_id, client_name, client_email, amount_cents, currency, description, created_at, sent_at, viewed_at, paid_at, voided_at, due_date, notes, stripe_payment_intent_id, vat_included, payment_processing_fee_cents, discount_type, discount_value, auto_remind_enabled, auto_remind_days, recurring, recurring_interval, recurring_interval_value, recurring_parent_id"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) return null;

  const { data: items } = await supabase
    .from("invoice_line_items")
    .select("description, amount_cents, discount_percent")
    .eq("invoice_id", id)
    .order("sort_order", { ascending: true });

  return {
    ...invoice,
    line_items: (items ?? []).map((i) => {
      const raw = Number(i.amount_cents);
      const dp = Number(i.discount_percent ?? 0);
      const afterDiscount = Math.round(raw * (1 - dp / 100));
      return {
        description: i.description,
        amount_cents: afterDiscount,
        discount_percent: dp,
      };
    }),
  } as InvoiceRow;
}

/** Raw line items for edit form (amount_cents = original before discount) */
export async function getInvoiceForEdit(id: string): Promise<InvoiceRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, number, public_id, status, client_name, client_email, amount_cents, currency, description, created_at, sent_at, viewed_at, paid_at, voided_at, due_date, notes, stripe_payment_intent_id, vat_included, payment_processing_fee_included, payment_processing_fee_cents, discount_type, discount_value, auto_remind_enabled, auto_remind_days, recurring, recurring_interval, recurring_interval_value, recurring_parent_id"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) return null;

  const { data: items } = await supabase
    .from("invoice_line_items")
    .select("description, amount_cents, discount_percent")
    .eq("invoice_id", id)
    .order("sort_order", { ascending: true });

  return {
    ...invoice,
    line_items: (items ?? []).map((i) => ({
      description: i.description,
      amount_cents: Number(i.amount_cents),
      discount_percent: Number(i.discount_percent ?? 0),
    })),
  } as InvoiceRow;
}

export type UpdateResult = { error: string } | { success: true };

export async function updateInvoiceAction(formData: FormData): Promise<UpdateResult> {
  const invoiceId = formData.get("invoiceId") as string | null;
  if (!invoiceId) return { error: "Invalid request" };

  const raw = {
    invoiceId,
    clientId: formData.get("clientId") ?? "",
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail") ?? "",
    currency: formData.get("currency") ?? "USD",
    dueDate: formData.get("dueDate") ?? "",
    notes: formData.get("notes") ?? "",
    vatIncluded: formData.get("vatIncluded") ?? "",
    paymentProcessingFeeIncluded: formData.get("paymentProcessingFeeIncluded") ?? "",
    autoRemindEnabled: formData.get("autoRemindEnabled") ?? "",
    autoRemindDays: formData.get("autoRemindDays") ?? "1,3,7",
    discountType: formData.get("discountType") ?? "none",
    discountPercent: formData.get("discountPercent") ?? "",
    discountCents: formData.get("discountCents") ?? "",
    lineItems: formData.get("lineItems") ?? "[]",
  };

  const parsed = invoiceUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.clientName?.[0] ??
      first.lineItems?.[0] ??
      "Add at least one service with description and amount";
    return { error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: existing } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (!existing) return { error: "Invoice not found" };
  if (existing.status === "paid" || existing.status === "void") {
    return { error: "Cannot edit a paid or voided invoice" };
  }

  const vatIncluded = parsed.data.vatIncluded ?? false;
  const paymentProcessingFeeIncluded = parsed.data.paymentProcessingFeeIncluded ?? false;
  const lineItems = parsed.data.lineItems;
  const currency = parsed.data.currency;
  const discountType = parsed.data.discountType ?? "none";
  const discountPercent = parsed.data.discountPercent ?? 0;
  const discountCents = parsed.data.discountCents ?? 0;

  const lineTotalsAfterDiscount = lineItems.map((i) => {
    const rawCents = Math.round(i.amount * 100);
    const dp = i.discountPercent ?? 0;
    return Math.round(rawCents * (1 - dp / 100));
  });
  let subtotalAfterLineDiscounts = lineTotalsAfterDiscount.reduce((s, c) => s + c, 0);

  if (discountType === "percent" && discountPercent > 0) {
    subtotalAfterLineDiscounts = Math.round(subtotalAfterLineDiscounts * (1 - discountPercent / 100));
  } else if (discountType === "fixed" && discountCents > 0) {
    subtotalAfterLineDiscounts = Math.max(0, subtotalAfterLineDiscounts - discountCents);
  }

  let amountBeforeFeeCents: number;
  if (vatIncluded) {
    amountBeforeFeeCents = subtotalAfterLineDiscounts;
  } else {
    const vatCents = Math.round(subtotalAfterLineDiscounts * 0.2);
    amountBeforeFeeCents = subtotalAfterLineDiscounts + vatCents;
  }

  let amountCents = amountBeforeFeeCents;
  let paymentProcessingFeeCents: number | null = null;
  if (paymentProcessingFeeIncluded) {
    paymentProcessingFeeCents = calcPaymentProcessingFeeCents(amountBeforeFeeCents, currency);
    amountCents = amountBeforeFeeCents + paymentProcessingFeeCents;
  }

  const MIN_AMOUNT_CENTS = 100;
  if (amountCents < MIN_AMOUNT_CENTS) {
    return { error: "Minimum invoice amount is £1 (or equivalent in your currency)" };
  }

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      client_name: parsed.data.clientName,
      client_email: parsed.data.clientEmail || null,
      amount_cents: amountCents,
      currency,
      notes: parsed.data.notes || null,
      due_date: parsed.data.dueDate || null,
      vat_included: vatIncluded,
      payment_processing_fee_included: paymentProcessingFeeIncluded,
      payment_processing_fee_cents: paymentProcessingFeeCents,
      discount_type: discountType !== "none" ? discountType : null,
      discount_value:
        discountType === "percent" ? discountPercent : discountType === "fixed" ? discountCents : null,
      auto_remind_enabled: parsed.data.autoRemindEnabled ?? false,
      auto_remind_days: parsed.data.autoRemindDays ?? "1,3,7",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  await supabase
    .from("invoice_line_items")
    .delete()
    .eq("invoice_id", invoiceId);

  const lineItemRows = lineItems.map((item, idx) => ({
    invoice_id: invoiceId,
    description: item.description,
    amount_cents: Math.round(item.amount * 100),
    discount_percent: Math.min(100, Math.max(0, item.discountPercent ?? 0)),
    sort_order: idx,
  }));

  const { error: lineItemsError } = await supabase
    .from("invoice_line_items")
    .insert(lineItemRows);

  if (lineItemsError) return { error: lineItemsError.message };

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function markInvoiceSentAction(invoiceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function getPublicUrlAction(invoiceId: string): Promise<{ error: string } | { url: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data } = await supabase
    .from("invoices")
    .select("public_id")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (!data) return { error: "Invoice not found" };
  return { url: getPublicInvoiceUrl(data.public_id, BASE_URL) };
}

export async function voidInvoiceAction(invoiceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status === "void") return { error: "Invoice is already void" };
  if (invoice.status === "paid") return { error: "Cannot void a paid invoice" };

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ status: "void", voided_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    entity_type: "invoice",
    entity_id: invoiceId,
    action: "status_change",
    meta: { from: invoice.status, to: "void" },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function markAsPaidManualAction(invoiceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status === "paid") return {};
  if (invoice.status === "void") return { error: "Cannot mark void invoice as paid" };

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: now })
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function sendInvoiceEmailAction(
  invoiceId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, number, public_id, client_name, client_email, amount_cents, currency, vat_included, due_date"
    )
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (!invoice || !invoice.client_email)
    return { error: "Invoice not found or has no client email" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("id", user.id)
    .single();

  const publicUrl = getPublicInvoiceUrl(invoice.public_id, BASE_URL);
  const amountFormatted = formatAmount(
    getDisplayAmountCents(Number(invoice.amount_cents), invoice.vat_included),
    invoice.currency
  );
  const dueDateFormatted = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-US", {
        dateStyle: "medium",
      })
    : null;

  const result = await sendInvoiceEmail({
    to: invoice.client_email,
    businessName: profile?.business_name ?? "Business",
    clientName: invoice.client_name,
    amountFormatted,
    invoiceNumber: invoice.number,
    publicUrl,
    dueDate: dueDateFormatted,
  });

  if (!result.ok) return { error: result.error };
  revalidatePath(`/invoices/${invoiceId}`);
  return { success: true };
}

export async function sendReminderAction(
  invoiceId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, number, public_id, client_name, client_email, amount_cents, currency, vat_included, due_date, last_reminder_at, status"
    )
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (!invoice || !invoice.client_email)
    return { error: "Invoice not found or has no client email" };
  if (invoice.status === "paid" || invoice.status === "void")
    return { error: "Cannot send reminder for paid or void invoice" };

  if (REMINDER_RATE_LIMIT_HOURS > 0 && invoice.last_reminder_at) {
    const hoursSince =
      (Date.now() - new Date(invoice.last_reminder_at).getTime()) /
      (1000 * 60 * 60);
    if (hoursSince < REMINDER_RATE_LIMIT_HOURS) {
      return {
        error: `Please wait ${Math.ceil(REMINDER_RATE_LIMIT_HOURS - hoursSince)}h before sending another reminder`,
      };
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("id", user.id)
    .single();

  const publicUrl = getPublicInvoiceUrl(invoice.public_id, BASE_URL);
  const amountFormatted = formatAmount(
    getDisplayAmountCents(Number(invoice.amount_cents), invoice.vat_included),
    invoice.currency
  );
  const dueDateFormatted = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-US", {
        dateStyle: "medium",
      })
    : null;

  const result = await sendReminderEmail({
    to: invoice.client_email,
    businessName: profile?.business_name ?? "Business",
    clientName: invoice.client_name,
    amountFormatted,
    invoiceNumber: invoice.number,
    publicUrl,
    dueDate: dueDateFormatted,
  });

  if (!result.ok) return { error: result.error };

  await supabase
    .from("invoices")
    .update({ last_reminder_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  revalidatePath(`/invoices/${invoiceId}`);
  return { success: true };
}

export async function updateAutoRemindAction(
  invoiceId: string,
  enabled: boolean,
  days: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, client_email")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status === "paid" || invoice.status === "void")
    return { error: "Cannot change auto-remind for paid or void invoice" };
  if (enabled && !invoice.client_email)
    return { error: "Add client email to enable auto-reminders" };

  const ALLOWED_DAYS = ["1", "2", "3", "5", "7", "10", "14"];
  const validDays = days
    .split(",")
    .map((s) => s.trim())
    .filter((s) => ALLOWED_DAYS.includes(s));
  const daysStr = validDays.length > 0 ? [...new Set(validDays)].sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).join(",") : "1,3,7";

  const { error } = await supabase
    .from("invoices")
    .update({
      auto_remind_enabled: enabled,
      auto_remind_days: daysStr,
    })
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/invoices/${invoiceId}`);
  return {};
}
