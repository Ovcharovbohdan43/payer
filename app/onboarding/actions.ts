"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

export async function submitOnboarding(formData: FormData) {
  const raw = {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    business_name: formData.get("business_name"),
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    website: formData.get("website") ?? "",
    company_type: formData.get("company_type") ?? "",
    default_currency: formData.get("default_currency") ?? "USD",
    country: formData.get("country") ?? "",
    timezone: formData.get("timezone") ?? "",
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message =
      first.first_name?.[0] ??
      first.last_name?.[0] ??
      first.email?.[0] ??
      first.business_name?.[0] ??
      first.default_currency?.[0] ??
      "Invalid fields";
    return { error: message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in" };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        business_name: parsed.data.business_name,
        phone: parsed.data.phone?.trim() || null,
        address: parsed.data.address?.trim() || null,
        website: parsed.data.website?.trim() || null,
        company_type: parsed.data.company_type?.trim() || null,
        default_currency: parsed.data.default_currency,
        country: parsed.data.country?.trim() || null,
        timezone: parsed.data.timezone?.trim() || "UTC",
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
