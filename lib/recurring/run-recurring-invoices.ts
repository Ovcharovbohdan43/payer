import { createAdminClient } from "@/lib/supabase/admin";
import { sendInvoiceEmail } from "@/lib/email/send";
import { formatAmount, getDisplayAmountCents, calcPaymentProcessingFeeCents } from "@/lib/invoices/utils";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

type InvoiceTemplate = {
  id: string;
  user_id: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  amount_cents: number;
  currency: string;
  vat_included: boolean | null;
  payment_processing_fee_included: boolean;
  notes: string | null;
  auto_remind_enabled: boolean;
  auto_remind_days: string;
  recurring_interval: "minutes" | "days";
  recurring_interval_value: number;
  last_recurred_at: string | null;
  sent_at: string | null;
};

type LineItem = { description: string; amount_cents: number; sort_order: number };

function getAnchorDate(template: InvoiceTemplate): Date {
  const ts = template.last_recurred_at ?? template.sent_at;
  if (!ts) throw new Error("Template has no sent_at");
  return new Date(ts);
}

function isDue(template: InvoiceTemplate, now: Date): boolean {
  const anchor = getAnchorDate(template);
  const { recurring_interval, recurring_interval_value } = template;
  let nextDue: Date;
  if (recurring_interval === "minutes") {
    nextDue = new Date(anchor.getTime() + recurring_interval_value * 60 * 1000);
  } else {
    nextDue = new Date(anchor);
    nextDue.setDate(nextDue.getDate() + recurring_interval_value);
    nextDue.setHours(0, 0, 0, 0);
  }
  return now >= nextDue;
}

export async function runRecurringInvoices(): Promise<{
  generated: number;
  errors: number;
}> {
  const supabase = createAdminClient();
  const now = new Date();
  let generated = 0;
  let errors = 0;

  const { data: templates, error: fetchError } = await supabase
    .from("invoices")
    .select(
      "id, user_id, client_id, client_name, client_email, amount_cents, currency, vat_included, payment_processing_fee_included, notes, auto_remind_enabled, auto_remind_days, recurring_interval, recurring_interval_value, last_recurred_at, sent_at"
    )
    .eq("recurring", true)
    .is("recurring_parent_id", null)
    .not("sent_at", "is", null)
    .not("client_email", "is", null)
    .in("status", ["sent", "viewed", "overdue"])
    .neq("recurring_interval", null)
    .neq("recurring_interval_value", null);

  if (fetchError || !templates) {
    console.error("[recurring] fetch error:", fetchError?.message);
    return { generated: 0, errors: 1 };
  }

  for (const t of templates as InvoiceTemplate[]) {
    if (t.recurring_interval !== "minutes" && t.recurring_interval !== "days") continue;
    if (!t.client_email) continue;

    if (!isDue(t, now)) continue;

    const { data: items } = await supabase
      .from("invoice_line_items")
      .select("description, amount_cents, sort_order")
      .eq("invoice_id", t.id)
      .order("sort_order", { ascending: true });

    const lineItems = (items ?? []) as LineItem[];
    if (lineItems.length === 0) {
      console.error("[recurring] template has no line items:", t.id);
      errors++;
      continue;
    }

    const { data: nextNumber } = await supabase.rpc("next_invoice_number", {
      p_user_id: t.user_id,
    });
    if (!nextNumber || typeof nextNumber !== "string") {
      console.error("[recurring] failed to get next invoice number for user:", t.user_id);
      errors++;
      continue;
    }

    const publicId = crypto.randomUUID();
    const amountCents = Number(t.amount_cents);
    const currency = t.currency;
    const vatIncluded = t.vat_included ?? false;
    const paymentProcessingFeeIncluded = t.payment_processing_fee_included ?? false;

    let amountBeforeFeeCents: number;
    if (vatIncluded) {
      amountBeforeFeeCents = lineItems.reduce((s, i) => s + Number(i.amount_cents), 0);
    } else {
      const subtotalCents = lineItems.reduce((s, i) => s + Number(i.amount_cents), 0);
      const vatCents = Math.round(subtotalCents * 0.2);
      amountBeforeFeeCents = subtotalCents + vatCents;
    }

    let finalAmountCents = amountBeforeFeeCents;
    let paymentProcessingFeeCents: number | null = null;
    if (paymentProcessingFeeIncluded) {
      paymentProcessingFeeCents = calcPaymentProcessingFeeCents(amountBeforeFeeCents, currency);
      finalAmountCents = amountBeforeFeeCents + paymentProcessingFeeCents;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const { data: newInvoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        user_id: t.user_id,
        client_id: t.client_id,
        client_name: t.client_name,
        client_email: t.client_email,
        number: nextNumber,
        public_id: publicId,
        status: "sent",
        amount_cents: finalAmountCents,
        currency,
        vat_included: vatIncluded,
        payment_processing_fee_included: paymentProcessingFeeIncluded,
        payment_processing_fee_cents: paymentProcessingFeeCents,
        notes: t.notes,
        due_date: dueDateStr,
        sent_at: now.toISOString(),
        auto_remind_enabled: t.auto_remind_enabled,
        auto_remind_days: t.auto_remind_days ?? "1,3,7",
        recurring: false,
        recurring_parent_id: t.id,
      })
      .select("id")
      .single();

    if (insertError || !newInvoice) {
      console.error("[recurring] insert failed:", insertError?.message);
      errors++;
      continue;
    }

    const lineItemRows = lineItems.map((item, idx) => ({
      invoice_id: newInvoice.id,
      description: item.description,
      amount_cents: item.amount_cents,
      sort_order: idx,
    }));

    const { error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .insert(lineItemRows);

    if (lineItemsError) {
      console.error("[recurring] line items insert failed:", lineItemsError.message);
      errors++;
      continue;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("id", t.user_id)
      .single();

    const publicUrl = `${BASE_URL.replace(/\/$/, "")}/i/${publicId}`;
    const amountFormatted = formatAmount(
      getDisplayAmountCents(finalAmountCents, vatIncluded),
      currency
    );

    const result = await sendInvoiceEmail({
      to: t.client_email,
      businessName: profile?.business_name ?? "Business",
      clientName: t.client_name,
      amountFormatted,
      invoiceNumber: nextNumber,
      publicUrl,
      dueDate: dueDateStr,
    });

    if (!result.ok) {
      console.error("[recurring] email failed:", result.error);
      errors++;
      continue;
    }

    await supabase
      .from("invoices")
      .update({ last_recurred_at: now.toISOString() })
      .eq("id", t.id);

    generated++;
  }

  return { generated, errors };
}
