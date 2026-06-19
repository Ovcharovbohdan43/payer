import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { redirectIfBanned } from "@/lib/auth/account-status";
import { AppShell } from "@/components/layout/app-shell";
import {
  ACCOUNT_REVIEW_BANNER_MESSAGE,
  isAccountPendingReview,
} from "@/lib/invoices/creation-limit";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await redirectIfBanned(supabase, user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "business_name, logo_url, stripe_connect_account_id, subscription_status, invoice_creation_limit, invoice_creation_reviewed_at, is_admin"
    )
    .eq("id", user.id)
    .single();

  const isPro =
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";

  const accountReviewBanner =
    profile && isAccountPendingReview(profile) ? ACCOUNT_REVIEW_BANNER_MESSAGE : null;

  return (
    <AppShell
      businessName={profile?.business_name ?? "Business"}
      logoUrl={profile?.logo_url ?? null}
      isVerified={!!profile?.stripe_connect_account_id}
      isPro={isPro}
      accountReviewBanner={accountReviewBanner}
    >
      {children}
    </AppShell>
  );
}
