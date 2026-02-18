import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const publicId = typeof body?.publicId === "string" ? body.publicId.trim() : null;
    if (!publicId) {
      return NextResponse.json(
        { error: "Missing publicId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("id, amount_cents, currency")
      .eq("public_id", publicId)
      .in("status", ["draft", "sent", "viewed", "overdue"])
      .is("paid_at", null)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found or not payable" },
        { status: 404 }
      );
    }

    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: (invoice.currency as string).toLowerCase(),
            unit_amount: Number(invoice.amount_cents),
            product_data: {
              name: "Invoice payment",
              description: "Invoice payment",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/i/${publicId}?paid=1`,
      cancel_url: `${baseUrl}/i/${publicId}`,
      client_reference_id: invoice.id,
      metadata: { invoice_public_id: publicId },
    });

    const { error: updateError } = await supabase
      .from("invoices")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", invoice.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to link session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
