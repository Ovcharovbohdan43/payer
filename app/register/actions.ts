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
    country: formData.get("country") ?? "",
    termsAccepted: formData.get("termsAccepted"),
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.email?.[0] ??
      first.name?.[0] ??
      first.business_name?.[0] ??
      first.password?.[0] ??
      first.termsAccepted?.[0] ??
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

  if (error) {
    const msg = error.message;
    if (
      /rate limit|too many requests|limit exceeded/i.test(msg) ||
      msg.includes("over email sending")
    ) {
      return {
        error:
          "Email sending limit exceeded. Try again in an hour or use magic link to sign in.",
      };
    }
    return { error: msg };
  }
  if (!data.user) return { error: "Sign up failed" };

  // If we have a session (no email confirmation), send to onboarding to complete profile.
  if (data.session) {
    redirect("/onboarding");
  }

  // Email confirmation required — redirect to login
  redirect("/login?message=check_email");
}
