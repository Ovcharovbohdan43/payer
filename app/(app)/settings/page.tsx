import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    recovery?: string;
    integration?: string;
    integration_error?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, default_currency, country, timezone, stripe_connect_account_id, stripe_customer_id, subscription_status, password_set_at, address, phone, company_number, vat_number, logo_url, escalation_cc_owner")
    .eq("id", user.id)
    .single();

  const { data: googleCalendarConnection } = await supabase
    .from("integration_connections")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("provider", "google_calendar")
    .maybeSingle();

  const { data: microsoftCalendarConnection } = await supabase
    .from("integration_connections")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("provider", "microsoft_calendar")
    .maybeSingle();

  const params = await searchParams;
  const isRecovery = params?.recovery === "1";
  const integrationSuccess = params?.integration; // "google_calendar" | "microsoft_calendar"
  const integrationError = params?.integration_error === "calendar";

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0B0F14]">
      <div className="mx-auto max-w-2xl px-3 py-4 sm:px-6 sm:py-8 min-[375px]:px-4 min-[375px]:py-6">
        <h1 className="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">Settings</h1>
        <SettingsForm
          recovery={isRecovery}
          googleCalendarConnection={googleCalendarConnection ?? null}
          microsoftCalendarConnection={microsoftCalendarConnection ?? null}
          integrationSuccess={integrationSuccess ?? null}
          integrationError={integrationError}
          profile={{
            business_name: profile?.business_name ?? null,
            default_currency: profile?.default_currency ?? "USD",
            country: profile?.country ?? null,
            timezone: profile?.timezone ?? "UTC",
            stripe_connect_account_id: profile?.stripe_connect_account_id ?? null,
            stripe_customer_id: profile?.stripe_customer_id ?? null,
            subscription_status: profile?.subscription_status ?? "free",
            hasPassword: !!profile?.password_set_at,
            email: user.email ?? null,
            address: profile?.address ?? null,
            phone: profile?.phone ?? null,
            company_number: profile?.company_number ?? null,
            vat_number: profile?.vat_number ?? null,
            logo_url: profile?.logo_url ?? null,
            escalation_cc_owner: profile?.escalation_cc_owner ?? true,
          }}
        />
      </div>
    </div>
  );
}

