import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, default_currency, country, timezone, show_vat_fields")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0B0F14]">
      <div className="mx-auto max-w-2xl px-3 py-4 sm:px-6 sm:py-8 min-[375px]:px-4 min-[375px]:py-6">
        <h1 className="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">Settings</h1>
        <SettingsForm
          profile={{
            business_name: profile?.business_name ?? null,
            default_currency: profile?.default_currency ?? "USD",
            country: profile?.country ?? null,
            timezone: profile?.timezone ?? "UTC",
            show_vat_fields: profile?.show_vat_fields ?? false,
          }}
        />
      </div>
    </div>
  );
}
