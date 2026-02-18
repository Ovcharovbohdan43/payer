import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Default country for Connect accounts. Use GB for UK Stripe, US for US Stripe. */
function getConnectCountry(_profileBusinessName?: string | null): string {
  const env = process.env.STRIPE_CONNECT_COUNTRY?.trim().toUpperCase();
  if (env === "GB" || env === "US" || env === "DE" || env === "FR") return env;
  return "GB";
}

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

    const stripe = new Stripe(secret);
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, business_name")
      .eq("id", user.id)
      .single();

    let accountId = profile?.stripe_connect_account_id;

    if (!accountId) {
    const country = getConnectCountry(profile?.business_name);
    const account = await stripe.accounts.create({
      type: "express",
      country,
      email: user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
        metadata: { supabase_user_id: user.id },
      });
      accountId = account.id;

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
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/settings?stripe_connect=refresh`,
      return_url: `${baseUrl}/settings?stripe_connect=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connect failed";
    console.error("[stripe connect]", err);
    return NextResponse.json(
      { error: message.startsWith("Stripe") ? message : `Stripe error: ${message}` },
      { status: 500 }
    );
  }
}
