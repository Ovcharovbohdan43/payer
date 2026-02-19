"use server";

import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validations";
import { redirect } from "next/navigation";
import { createAndSendOtp, verifyOtp } from "@/lib/auth/login-otp";
import {
  isRememberedForUser,
  setOtpPendingCookie,
  clearOtpPendingCookie,
  setRememberCookie,
} from "@/lib/auth/remember-cookie";

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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org"}/auth/callback`,
    },
  });

  if (error) {
    const msg = error.message;
    if (/rate limit|too many requests|limit exceeded/i.test(msg) || msg.includes("over email sending")) {
      return { error: "Email limit exceeded. Try again later or sign in with password." };
    }
    return { error: msg };
  }

  return { success: true };
}

export async function signInWithPassword(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "Invalid email" };
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return { error: "Password is required" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data,
    password,
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Sign-in failed" };

  if (await isRememberedForUser(data.user.id)) {
    redirect("/dashboard");
  }

  const otpResult = await createAndSendOtp(data.user.id, parsed.data);
  if (!otpResult.ok) {
    await supabase.auth.signOut();
    return { error: otpResult.error };
  }

  await setOtpPendingCookie();
  redirect("/login/verify-otp");
}

export async function verifyOtpAction(
  formData: FormData
): Promise<{ error?: string }> {
  const code = formData.get("code");
  if (!code || typeof code !== "string") {
    return { error: "Enter the 5-digit code" };
  }
  const codeDigits = code.replace(/\D/g, "");
  if (codeDigits.length !== 5) {
    return { error: "Code must be 5 digits" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expired. Please sign in again." };

  const result = await verifyOtp(user.id, codeDigits);
  if (!result.ok) return { error: result.error };

  await clearOtpPendingCookie();

  const remember = formData.get("remember") === "true";
  if (remember) {
    await setRememberCookie(user.id);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
