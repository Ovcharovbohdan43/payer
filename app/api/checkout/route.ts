import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAccountBanned } from "@/lib/auth/account-status";
import { logPlatformActivityAdmin } from "@/lib/admin/platform-activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCheckoutAllowed } from "@/lib/risk/payment-guard";
import {
  buildInvoiceCheckoutSessionParams,
  createDirectChargeCheckoutSession,
} from "@/lib/stripe/connect";

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
      .select(
        "id, user_id, amount_cents, currency, vat_included, payment_processing_fee_included, payment_processing_fee_cents"
      )
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
      .select(
        "id, stripe_connect_account_id, account_status, business_name, payments_enabled, payment_risk_status, onboarding_completed, business_description, phone, website, company_type, country, default_currency, first_name, last_name, created_at, payments_verified_at, is_admin"
      )
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

    if (!destination || !profile) {
      return NextResponse.json(
        { error: "Online payment is not available for this invoice." },
        { status: 400 }
      );
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(invoice.user_id);
    const emailConfirmed = !!authUser?.user?.email_confirmed_at;

    const blocked = await assertCheckoutAllowed(
      supabase,
      profile,
      chargeCents,
      invoice.currency as string,
      emailConfirmed
    );
    if (blocked) {
      return NextResponse.json({ error: blocked.error }, { status: 400 });
    }

    const stripe = new Stripe(secret);
    const sessionParams = buildInvoiceCheckoutSessionParams({
      publicId,
      invoiceId: invoice.id,
      amountCents: chargeCents,
      currency: invoice.currency as string,
      businessName: profile?.business_name,
      paymentProcessingFeeIncluded: invoice.payment_processing_fee_included,
      paymentProcessingFeeCents: invoice.payment_processing_fee_cents,
      successUrl: `${baseUrl}/i/${publicId}?paid=1`,
      cancelUrl: `${baseUrl}/i/${publicId}`,
    });

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
