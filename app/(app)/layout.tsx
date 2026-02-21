import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, logo_url, stripe_connect_account_id")
    .eq("id", user.id)
    .single();

  return (
    <AppShell
      businessName={profile?.business_name ?? "Business"}
      logoUrl={profile?.logo_url ?? null}
      isVerified={!!profile?.stripe_connect_account_id}
    >
      {children}
    </AppShell>
  );
}
