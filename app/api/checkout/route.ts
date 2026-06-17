import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAccountBanned } from "@/lib/auth/account-status";
import { logPlatformActivityAdmin } from "@/lib/admin/platform-activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDirectChargeCheckoutSession } from "@/lib/stripe/connect";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

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
      .select("id, user_id, amount_cents, currency, vat_included")
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, account_status")
      .eq("id", invoice.user_id)
      .single();

    if (isAccountBanned(profile?.account_status)) {
      return NextResponse.json(
        { error: "Online payment is not available for this invoice." },
        { status: 400 }
      );
    }

    const chargeCents = Number(invoice.amount_cents);
    const destination = profile?.stripe_connect_account_id ?? null;

    if (!destination) {
      return NextResponse.json(
        { error: "Online payment is not available for this invoice." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(secret);
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: (invoice.currency as string).toLowerCase(),
            unit_amount: chargeCents,
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
    };

    // Direct charge on the connected account — Stripe fees are billed to them, not the platform.
    const session = await createDirectChargeCheckoutSession(
      stripe,
      destination,
      sessionParams
    );

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

    void logPlatformActivityAdmin({
      category: "billing",
      action: "checkout.started",
      userId: invoice.user_id,
      meta: {
        publicId,
        invoiceId: invoice.id,
        amountCents: chargeCents,
        currency: invoice.currency,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
