"use server";

import { createClient } from "@/lib/supabase/server";
import { invoiceCreateSchema } from "@/lib/validations";
import { getPublicInvoiceUrl } from "@/lib/invoices/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type InvoiceLineItem = {
  description: string;
  amount_cents: number;
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
  const lineItems = parsed.data.lineItems;
  let amountCents: number;
  if (vatIncluded) {
    amountCents = lineItems.reduce((s, i) => s + Math.round(i.amount * 100), 0);
  } else {
    const subtotalCents = lineItems.reduce((s, i) => s + Math.round(i.amount * 100), 0);
    const vatCents = Math.round(subtotalCents * 0.2);
    amountCents = subtotalCents + vatCents;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: number } = await supabase.rpc("next_invoice_number", { p_user_id: user.id });
  if (!number || typeof number !== "string") return { error: "Could not generate invoice number" };

  const publicId = crypto.randomUUID();

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
    })
    .select("id, number, public_id")
    .single();

  if (insertError) return { error: insertError.message };
  if (!invoice) return { error: "Failed to create invoice" }

  const lineItemRows = lineItems.map((item, idx) => ({
    invoice_id: invoice.id,
    description: item.description,
    amount_cents: Math.round(item.amount * 100),
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
  return { invoiceId: invoice.id, publicUrl, number: invoice.number, intent };
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
      "id, number, public_id, status, client_name, client_email, amount_cents, currency, description, created_at, sent_at, viewed_at, paid_at, voided_at, due_date, notes, stripe_payment_intent_id, vat_included"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) return null;

  const { data: items } = await supabase
    .from("invoice_line_items")
    .select("description, amount_cents")
    .eq("invoice_id", id)
    .order("sort_order", { ascending: true });

  return {
    ...invoice,
    line_items: (items ?? []).map((i) => ({
      description: i.description,
      amount_cents: Number(i.amount_cents),
    })),
  } as InvoiceRow;
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
