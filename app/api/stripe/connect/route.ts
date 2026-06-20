import { NextResponse } from "next/server";
import Stripe from "stripe";
import { assertActiveAccount } from "@/lib/auth/account-status";
import { createClient } from "@/lib/supabase/server";
import { canConnectStripe } from "@/lib/risk/payment-guard";
import { scanProfileForProhibitedContent } from "@/lib/risk/engine";
import {
  buildConnectAccountParams,
  getConnectCountry,
} from "@/lib/stripe/connect";
import { applyNewSellerStripeRestrictions } from "@/lib/stripe/account-controls";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

export async function POST() {
  try {
    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local" },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }

    const banned = await assertActiveAccount(supabase, user.id);
    if (banned) {
      return NextResponse.json({ error: banned.error }, { status: 403 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "stripe_connect_account_id, business_name, account_status, onboarding_completed, business_description, phone, website, company_type, country, default_currency, first_name, last_name, is_admin"
      )
      .eq("id", user.id)
      .single();

    const emailConfirmed = !!user.email_confirmed_at;
    const connectGate = canConnectStripe(profile ?? {}, emailConfirmed);
    if (!connectGate.allowed) {
      return NextResponse.json(
        { error: connectGate.reason ?? "Complete seller verification first." },
        { status: 400 }
      );
    }

    await scanProfileForProhibitedContent(user.id);

    const { data: refreshed } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, payment_risk_status, payments_enabled")
      .eq("id", user.id)
      .single();

    if (
      refreshed?.payment_risk_status === "flagged" ||
      refreshed?.payment_risk_status === "blocked"
    ) {
      return NextResponse.json(
        { error: "Stripe Connect is not available for this account." },
        { status: 403 }
      );
    }

    const stripe = new Stripe(secret);
    let accountId = refreshed?.stripe_connect_account_id ?? profile?.stripe_connect_account_id;
    let isNewAccount = false;

    if (!accountId) {
      const country = getConnectCountry(profile?.business_name);
      const account = await stripe.accounts.create(
        buildConnectAccountParams(user.id, user.email ?? undefined, country)
      );
      accountId = account.id;
      isNewAccount = true;

      const { error } = await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", user.id);

      if (error) {
        console.error("[stripe connect] failed to save account id", error);
        return NextResponse.json(
          { error: "Failed to save account" },
          { status: 500 }
        );
      }

      await applyNewSellerStripeRestrictions(accountId, user.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/settings?stripe_connect=refresh`,
      return_url: `${baseUrl}/settings?stripe_connect=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      newAccount: isNewAccount,
      paymentsEnabled: refreshed?.payments_enabled ?? false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connect failed";
    console.error("[stripe connect]", err);
    return NextResponse.json(
      { error: message.startsWith("Stripe") ? message : `Stripe error: ${message}` },
      { status: 500 }
    );
  }
}
