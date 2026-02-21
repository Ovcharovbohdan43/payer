"use server";

import { createClient } from "@/lib/supabase/server";
import { offerCreateSchema } from "@/lib/validations";
import {
  formatAmount,
  getDisplayAmountCents,
  calcPaymentProcessingFeeCents,
} from "@/lib/invoices/utils";
import { getPublicOfferUrl } from "@/lib/offers/utils";
import { revalidatePath } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";
const VAT_RATE = 0.2;

export type OfferLineItem = {
  description: string;
  amount_cents: number;
  discount_percent?: number;
};

export type OfferRow = {
  id: string;
  number: string;
  public_id: string;
  status: string;
  client_name: string;
  client_email: string | null;
  amount_cents: number;
  currency: string;
  notes: string | null;
  due_date: string | null;
  vat_included: boolean | null;
  discount_type: string | null;
  discount_value: number | null;
  decline_comment: string | null;
  invoice_id: string | null;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  line_items?: OfferLineItem[];
};

export type CreateOfferResult =
  | { error: string }
  | { offerId: string; publicUrl: string; number: string };

export async function createOfferAction(
  formData: FormData,
  options: { markSent: boolean }
): Promise<CreateOfferResult> {
  const raw = {
    clientId: formData.get("clientId") ?? "",
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail") ?? "",
    currency: formData.get("currency") ?? "USD",
    dueDate: formData.get("dueDate") ?? "",
    notes: formData.get("notes") ?? "",
    vatIncluded: formData.get("vatIncluded") ?? "",
    paymentProcessingFeeIncluded: formData.get("paymentProcessingFeeIncluded") ?? "",
    discountType: formData.get("discountType") ?? "none",
    discountPercent: formData.get("discountPercent") ?? "",
    discountCents: formData.get("discountCents") ?? "",
    lineItems: formData.get("lineItems") ?? "[]",
  };
  const parsed = offerCreateSchema.safeParse(raw);
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
    subtotalAfterLineDiscounts = Math.round(
      subtotalAfterLineDiscounts * (1 - discountPercent / 100)
    );
  } else if (discountType === "fixed" && discountCents > 0) {
    subtotalAfterLineDiscounts = Math.max(0, subtotalAfterLineDiscounts - discountCents);
  }

  let amountBeforeFeeCents = vatIncluded
    ? subtotalAfterLineDiscounts
    : subtotalAfterLineDiscounts +
      Math.round(subtotalAfterLineDiscounts * VAT_RATE);

  const paymentProcessingFeeIncluded = parsed.data.paymentProcessingFeeIncluded ?? false;
  let amountCents = amountBeforeFeeCents;
  let paymentProcessingFeeCents: number | null = null;
  if (paymentProcessingFeeIncluded) {
    paymentProcessingFeeCents = calcPaymentProcessingFeeCents(
      amountBeforeFeeCents,
      currency
    );
    amountCents = amountBeforeFeeCents + paymentProcessingFeeCents;
  }

  const MIN_AMOUNT_CENTS = 100;
  if (amountCents < MIN_AMOUNT_CENTS) {
    return { error: "Minimum offer amount is £1 (or equivalent)" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: number } = await supabase.rpc("next_offer_number", { p_user_id: user.id });
  if (!number || typeof number !== "string")
    return { error: "Could not generate offer number" };

  const publicId = crypto.randomUUID();

  const { data: offer, error: insertError } = await supabase
    .from("offers")
    .insert({
      user_id: user.id,
      client_id: parsed.data.clientId || null,
      client_name: parsed.data.clientName,
      client_email: parsed.data.clientEmail || null,
      number,
      public_id: publicId,
      status: options.markSent ? "sent" : "draft",
      amount_cents: amountCents,
      currency,
      notes: parsed.data.notes || null,
      due_date: parsed.data.dueDate || null,
      vat_included: vatIncluded,
      discount_type: discountType !== "none" ? discountType : null,
      discount_value:
        discountType === "percent" ? discountPercent : discountType === "fixed" ? discountCents : null,
      payment_processing_fee_included: paymentProcessingFeeIncluded,
      payment_processing_fee_cents: paymentProcessingFeeCents,
      sent_at: options.markSent ? new Date().toISOString() : null,
    })
    .select("id, number, public_id")
    .single();

  if (insertError) return { error: insertError.message };
  if (!offer) return { error: "Failed to create offer" };

  const lineItemRows = lineItems.map((item, idx) => ({
    offer_id: offer.id,
    description: item.description,
    amount_cents: Math.round(item.amount * 100),
    discount_percent: Math.min(100, Math.max(0, item.discountPercent ?? 0)),
    sort_order: idx,
  }));

  const { error: lineItemsError } = await supabase
    .from("offer_line_items")
    .insert(lineItemRows);

  if (lineItemsError) return { error: lineItemsError.message };

  revalidatePath("/offers");
  revalidatePath("/dashboard");

  const publicUrl = getPublicOfferUrl(offer.public_id, BASE_URL);
  return {
    offerId: offer.id,
    publicUrl,
    number: offer.number,
  };
}

export async function listOffers(): Promise<OfferRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("offers")
    .select(
      "id, number, public_id, status, client_name, client_email, amount_cents, currency, notes, due_date, decline_comment, invoice_id, created_at, sent_at, viewed_at, accepted_at, declined_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as OfferRow[];
}

export async function getOfferById(id: string): Promise<OfferRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: offer } = await supabase
    .from("offers")
    .select(
      "id, number, public_id, status, client_name, client_email, amount_cents, currency, notes, due_date, vat_included, discount_type, discount_value, decline_comment, invoice_id, created_at, sent_at, viewed_at, accepted_at, declined_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!offer) return null;

  const { data: items } = await supabase
    .from("offer_line_items")
    .select("description, amount_cents, discount_percent")
    .eq("offer_id", id)
    .order("sort_order", { ascending: true });

  return {
    ...offer,
    line_items: (items ?? []).map((i) => ({
      description: i.description,
      amount_cents: Number(i.amount_cents),
      discount_percent: Number(i.discount_percent ?? 0),
    })),
  } as OfferRow;
}

export async function markOfferSentAction(offerId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("offers")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", offerId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/offers");
  revalidatePath(`/offers/${offerId}`);
  revalidatePath("/dashboard");
  return {};
}

/** Called from public offer page when client accepts. Creates invoice and links it. */
export type AcceptOfferResult =
  | { error: string }
  | { invoicePublicId: string };

export async function acceptOfferAction(publicId: string): Promise<AcceptOfferResult> {
  const supabase = await createClient();

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("id, user_id, client_id, client_name, client_email, amount_cents, currency, vat_included, payment_processing_fee_included, payment_processing_fee_cents, discount_type, discount_value")
    .eq("public_id", publicId)
    .in("status", ["sent", "viewed"])
    .single();

  if (offerError || !offer) {
    return { error: "Offer not found or cannot be accepted" };
  }

  const { data: lineItems } = await supabase
    .from("offer_line_items")
    .select("description, amount_cents, discount_percent")
    .eq("offer_id", offer.id)
    .order("sort_order", { ascending: true });

  const { data: invNumber } = await supabase.rpc("next_invoice_number", {
    p_user_id: offer.user_id,
  });
  if (!invNumber || typeof invNumber !== "string") {
    return { error: "Could not create invoice" };
  }

  const invPublicId = crypto.randomUUID();
  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .insert({
      user_id: offer.user_id,
      client_id: offer.client_id ?? null,
      client_name: offer.client_name,
      client_email: offer.client_email,
      number: invNumber,
      public_id: invPublicId,
      status: "sent",
      amount_cents: offer.amount_cents,
      currency: offer.currency,
      vat_included: offer.vat_included,
      payment_processing_fee_included: offer.payment_processing_fee_included ?? false,
      payment_processing_fee_cents: offer.payment_processing_fee_cents ?? null,
      discount_type: offer.discount_type,
      discount_value: offer.discount_value,
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (invError || !invoice) {
    return { error: invError?.message ?? "Failed to create invoice" };
  }

  const iliRows = (lineItems ?? []).map((li, idx) => ({
    invoice_id: invoice.id,
    description: li.description,
    amount_cents: li.amount_cents,
    discount_percent: li.discount_percent ?? 0,
    sort_order: idx,
  }));
  await supabase.from("invoice_line_items").insert(iliRows);

  await supabase
    .from("offers")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      invoice_id: invoice.id,
    })
    .eq("id", offer.id);

  await supabase.from("audit_logs").insert({
    user_id: offer.user_id,
    entity_type: "offer",
    entity_id: offer.id,
    action: "accepted",
    meta: {
      offer_public_id: publicId,
      invoice_id: invoice.id,
      client_name: offer.client_name,
    },
  });

  revalidatePath("/offers");
  revalidatePath("/dashboard");

  return { invoicePublicId: invPublicId };
}

/** Called from public offer page when client declines. */
export type DeclineOfferResult = { error?: string };

export async function declineOfferAction(
  publicId: string,
  comment: string
): Promise<DeclineOfferResult> {
  const supabase = await createClient();

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("id, user_id, client_name")
    .eq("public_id", publicId)
    .in("status", ["sent", "viewed"])
    .single();

  if (offerError || !offer) {
    return { error: "Offer not found or cannot be declined" };
  }

  const { error: updateError } = await supabase
    .from("offers")
    .update({
      status: "declined",
      declined_at: new Date().toISOString(),
      decline_comment: (comment || "").trim() || null,
    })
    .eq("id", offer.id);

  if (updateError) return { error: updateError.message };

  await supabase.from("audit_logs").insert({
    user_id: offer.user_id,
    entity_type: "offer",
    entity_id: offer.id,
    action: "declined",
    meta: {
      offer_public_id: publicId,
      comment: (comment || "").trim() || null,
      client_name: offer.client_name,
    },
  });

  revalidatePath("/offers");
  revalidatePath("/dashboard");

  return {};
}
