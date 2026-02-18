import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    const signature = (await headers()).get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    event = await new Stripe(secret).webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    console.error("[webhook stripe]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === "payout.paid") {
    const accountId = event.account;
    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json({ received: true });
    }
    const payout = event.data.object as Stripe.Payout;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_connect_account_id", accountId)
      .single();
    if (!profile) return NextResponse.json({ received: true });

    const arrivalDate = payout.arrival_date
      ? new Date(payout.arrival_date * 1000).toISOString().slice(0, 10)
      : null;

    await supabase.from("payouts").insert({
      user_id: profile.id,
      stripe_payout_id: payout.id,
      amount_cents: payout.amount,
      currency: (payout.currency ?? "usd").toUpperCase(),
      status: "paid",
      arrival_date: arrivalDate,
    });

    return NextResponse.json({ received: true });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  if (!sessionId) {
    return NextResponse.json({ received: true });
  }

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, paid_at")
    .eq("stripe_checkout_session_id", sessionId)
    .single();

  if (fetchError || !invoice) {
    console.error("[webhook stripe] invoice not found for session", sessionId);
    return NextResponse.json({ received: true });
  }

  if (invoice.paid_at) {
    return NextResponse.json({ received: true });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("invoices")
    .update({ paid_at: now, status: "paid" })
    .eq("id", invoice.id);

  if (updateError) {
    console.error("[webhook stripe] update invoice", updateError);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }

  const amount = session.amount_total ?? 0;
  const currency = (session.currency ?? "usd").toUpperCase();
  const { error: insertError } = await supabase.from("payments").insert({
    invoice_id: invoice.id,
    amount_cents: amount,
    currency,
    stripe_event_id: event.id,
    paid_at: now,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true });
    }
    console.error("[webhook stripe] insert payment", insertError);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
