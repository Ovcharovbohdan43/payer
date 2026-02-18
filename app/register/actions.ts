"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

export async function signUpAction(formData: FormData) {
  const raw = {
    email: formData.get("email"),
    name: formData.get("name"),
    business_name: formData.get("business_name"),
    password: formData.get("password"),
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.email?.[0] ??
      first.name?.[0] ??
      first.business_name?.[0] ??
      first.password?.[0] ??
      "Invalid fields";
    return { error: msg };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.name,
        business_name: parsed.data.business_name,
      },
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Sign up failed" };

  // Profile is created by trigger with business_name from user_metadata.
  // If we have a session (no email confirmation), ensure profile is updated.
  if (data.session) {
    await supabase
      .from("profiles")
      .update({
        business_name: parsed.data.business_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);
    redirect("/dashboard");
  }

  // Email confirmation required — redirect to login
  redirect("/login?message=check_email");
}
