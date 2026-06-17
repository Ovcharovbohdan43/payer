import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPPORT_EMAIL } from "@/lib/auth/account-status";

export const BAN_BLOCKED_MESSAGE = `Access is restricted. Please contact support at ${SUPPORT_EMAIL}.`;

export const BAN_SIGNUP_BLOCKED_MESSAGE = `Registration is not available. Please contact support at ${SUPPORT_EMAIL}.`;

export async function isIpBanned(
  supabase: SupabaseClient,
  ip: string | null | undefined
): Promise<boolean> {
  if (!ip?.trim()) return false;
  const { data, error } = await supabase.rpc("check_ip_banned", {
    p_ip: ip.trim(),
  });
  if (error) {
    console.error("[ban-enforcement] check_ip_banned", error.message);
    return false;
  }
  return data === true;
}

export async function isEmailBanned(
  supabase: SupabaseClient,
  email: string | null | undefined
): Promise<boolean> {
  if (!email?.trim()) return false;
  const { data, error } = await supabase.rpc("check_email_banned", {
    p_email: email.trim().toLowerCase(),
  });
  if (error) {
    console.error("[ban-enforcement] check_email_banned", error.message);
    return false;
  }
  return data === true;
}

/** Record IP for the current session user (middleware / post-login). */
export async function logUserIp(
  supabase: SupabaseClient,
  ip: string | null | undefined
): Promise<void> {
  if (!ip?.trim()) return;
  const { error } = await supabase.rpc("log_user_ip", { p_ip: ip.trim() });
  if (error) {
    console.error("[ban-enforcement] log_user_ip", error.message);
  }
}

export async function assertNotBannedForAuth(
  supabase: SupabaseClient,
  options: { email?: string; ip?: string | null }
): Promise<{ error: string } | null> {
  if (options.email && (await isEmailBanned(supabase, options.email))) {
    return { error: BAN_SIGNUP_BLOCKED_MESSAGE };
  }
  if (options.ip && (await isIpBanned(supabase, options.ip))) {
    return { error: BAN_BLOCKED_MESSAGE };
  }
  return null;
}
