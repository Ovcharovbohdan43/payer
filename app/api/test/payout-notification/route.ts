import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPayoutNotificationEmail } from "@/lib/email/send";
import { formatAmount } from "@/lib/invoices/utils";

/**
 * Test endpoint: send a payout notification email to your account.
 * GET /api/test/payout-notification?userId=YOUR_UUID
 * Protected by CRON_SECRET if set.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId. Use /api/test/payout-notification?userId=YOUR_UUID" },
      { status: 400 }
    );
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized. Pass CRON_SECRET as Bearer token." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) {
    return NextResponse.json(
      { error: "User not found or has no email" },
      { status: 404 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("id", userId)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";
  const result = await sendPayoutNotificationEmail({
    to: email,
    amountFormatted: formatAmount(2500, "GBP"),
    currency: "GBP",
    arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    businessName: profile?.business_name ?? "",
    dashboardUrl: `${appUrl.replace(/\/$/, "")}/dashboard`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, sentTo: email });
}
