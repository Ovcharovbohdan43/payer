import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ recovery?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, default_currency, country, timezone, stripe_connect_account_id, password_set_at, address, phone, company_number, vat_number, logo_url")
    .eq("id", user.id)
    .single();

  const params = await searchParams;
  const isRecovery = params?.recovery === "1";

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0B0F14]">
      <div className="mx-auto max-w-2xl px-3 py-4 sm:px-6 sm:py-8 min-[375px]:px-4 min-[375px]:py-6">
        <h1 className="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">Settings</h1>
        <SettingsForm
          recovery={isRecovery}
          profile={{
            business_name: profile?.business_name ?? null,
            default_currency: profile?.default_currency ?? "USD",
            country: profile?.country ?? null,
            timezone: profile?.timezone ?? "UTC",
            stripe_connect_account_id: profile?.stripe_connect_account_id ?? null,
            hasPassword: !!profile?.password_set_at,
            email: user.email ?? null,
            address: profile?.address ?? null,
            phone: profile?.phone ?? null,
            company_number: profile?.company_number ?? null,
            vat_number: profile?.vat_number ?? null,
            logo_url: profile?.logo_url ?? null,
          }}
        />
      </div>
    </div>
  );
}
