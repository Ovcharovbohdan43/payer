"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  const raw = {
    business_name: formData.get("business_name"),
    default_currency: formData.get("default_currency"),
    country: formData.get("country") ?? "",
    timezone: formData.get("timezone") ?? "UTC",
    show_vat_fields: formData.get("show_vat_fields") === "on",
  };
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.business_name?.[0] ??
      first.default_currency?.[0] ??
      "Invalid fields";
    return { error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({
      business_name: parsed.data.business_name,
      default_currency: parsed.data.default_currency,
      country: parsed.data.country || null,
      timezone: parsed.data.timezone || "UTC",
      show_vat_fields: parsed.data.show_vat_fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/invoices/new");
  return {};
}
