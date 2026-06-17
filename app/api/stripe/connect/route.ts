import { NextResponse } from "next/server";
import Stripe from "stripe";
import { assertActiveAccount } from "@/lib/auth/account-status";
import { createClient } from "@/lib/supabase/server";
import {
  buildConnectAccountParams,
  getConnectCountry,
} from "@/lib/stripe/connect";

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

    const stripe = new Stripe(secret);
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, business_name")
      .eq("id", user.id)
      .single();

    let accountId = profile?.stripe_connect_account_id;

    if (!accountId) {
      const country = getConnectCountry(profile?.business_name);
      const account = await stripe.accounts.create(
        buildConnectAccountParams(user.id, user.email ?? undefined, country)
      );
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
