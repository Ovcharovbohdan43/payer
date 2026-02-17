"use server";

import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email");
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "Invalid email" };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    const isConfigError =
      message.includes("NEXT_PUBLIC_SUPABASE") ||
      message.includes("HTTP") ||
      message.includes("URL");
    if (isConfigError) {
      if (process.env.NODE_ENV === "development") {
        return { error: message };
      }
      return { error: "Sign-in is temporarily unavailable. Please try again later." };
    }
    throw e;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
