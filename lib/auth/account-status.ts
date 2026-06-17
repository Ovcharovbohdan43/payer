import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export const ACCOUNT_STATUS = {
  ACTIVE: "active",
  BANNED: "banned",
} as const;

export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export const ACCOUNT_RESTRICTED_PATH = "/account-restricted";
export const SUPPORT_EMAIL = "support@puyer.org";

export function isAccountBanned(status: string | null | undefined): boolean {
  return status === ACCOUNT_STATUS.BANNED;
}

export async function getProfileAccountStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", userId)
    .single();

  return data?.account_status ?? null;
}

export async function isUserBanned(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const status = await getProfileAccountStatus(supabase, userId);
  return isAccountBanned(status);
}

/** Server Components / actions: redirect banned users to the restricted page. */
export async function redirectIfBanned(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  if (await isUserBanned(supabase, userId)) {
    redirect(ACCOUNT_RESTRICTED_PATH);
  }
}

/** Server actions: return a user-facing error instead of redirecting. */
export async function assertActiveAccount(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: string } | null> {
  if (await isUserBanned(supabase, userId)) {
    return {
      error: `Your account is temporarily restricted. Please contact support at ${SUPPORT_EMAIL}.`,
    };
  }
  return null;
}
