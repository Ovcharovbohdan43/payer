"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

export async function submitOnboarding(formData: FormData) {
  const raw = {
    business_name: formData.get("business_name"),
    default_currency: formData.get("default_currency") ?? "USD",
    country: formData.get("country") || null,
    timezone: formData.get("timezone") || null,
    show_vat_fields: formData.get("show_vat_fields") === "on",
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message = first.business_name?.[0] ?? first.default_currency?.[0] ?? "Invalid fields";
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
        business_name: parsed.data.business_name,
        default_currency: parsed.data.default_currency,
        country: parsed.data.country ?? undefined,
        timezone: parsed.data.timezone ?? "UTC",
        show_vat_fields: parsed.data.show_vat_fields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
