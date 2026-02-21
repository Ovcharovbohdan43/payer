import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Cancel subscription for manual Pro grants (no Stripe customer). Sets status to free. */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isPro =
      profile.subscription_status === "active" ||
      profile.subscription_status === "trialing";

    if (!isPro) {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    // If they have Stripe customer, they must use the portal
    if (profile.stripe_customer_id) {
      return NextResponse.json(
        { error: "Use billing portal to cancel", usePortal: true },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: "free" })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[subscription cancel]", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
