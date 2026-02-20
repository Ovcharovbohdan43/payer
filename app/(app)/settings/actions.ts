"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, passwordSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  const raw = {
    business_name: formData.get("business_name"),
    default_currency: formData.get("default_currency"),
    country: formData.get("country") ?? "",
    timezone: formData.get("timezone") ?? "UTC",
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

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("default_currency")
    .eq("id", user.id)
    .single();

  const oldCurrency = currentProfile?.default_currency;
  const newCurrency = parsed.data.default_currency;
  if (oldCurrency && newCurrency && oldCurrency !== newCurrency) {
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      entity_type: "profile",
      entity_id: user.id,
      action: "currency_changed",
      meta: { from: oldCurrency, to: newCurrency },
    });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      business_name: parsed.data.business_name,
      default_currency: parsed.data.default_currency,
      country: parsed.data.country || null,
      timezone: parsed.data.timezone || "UTC",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/invoices/new");
  return {};
}

export async function setPasswordAction(formData: FormData) {
  const password = formData.get("password");
  const confirm = formData.get("confirm");
  const oldPassword = formData.get("old_password");
  const isRecovery = formData.get("recovery") === "true";
  const hasPassword = formData.get("has_password") === "true";

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors[0] ?? "Invalid password" };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  if (!user.email) return { error: "No email on account" };

  // When changing password (not recovery), require old password verification
  if (hasPassword && !isRecovery) {
    if (!oldPassword || typeof oldPassword !== "string" || oldPassword.length < 8) {
      return { error: "Current password is required" };
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });
    if (signInError) {
      return { error: "Current password is incorrect" };
    }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: error.message };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ password_set_at: new Date().toISOString() })
    .eq("id", user.id);
  if (profileError) console.error("[setPassword] profile update:", profileError);

  if (user.email) {
    const { sendPasswordChangeConfirmEmail } = await import("@/lib/email/send");
    const emailResult = await sendPasswordChangeConfirmEmail({ to: user.email });
    if (!emailResult.ok) {
      console.error("[setPassword] confirmation email:", emailResult.error);
    }
  }

  revalidatePath("/settings");
  return { success: true };
}

/**
 * Send password reset link to user's email. User must confirm via email to set a new password.
 */
export async function sendPasswordResetEmailAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  if (!user.email) return { error: "No email on account" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";
  const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent("/settings?recovery=1")}`;

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo,
  });

  if (error) return { error: error.message };
  return { success: true };
}
