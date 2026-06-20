import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileOnboardingRow = {
  onboarding_completed?: boolean | null;
  business_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

const PLACEHOLDER_BUSINESS_NAMES = new Set(["-", "—", "_", "."]);

export function isPlaceholderBusinessName(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_BUSINESS_NAMES.has(trimmed);
}

/** True when the user must complete the post-registration onboarding form. */
export function profileNeedsOnboarding(profile: ProfileOnboardingRow | null | undefined): boolean {
  if (!profile?.onboarding_completed) return true;
  if (isPlaceholderBusinessName(profile.business_name)) return true;
  if (!profile.first_name?.trim() || !profile.last_name?.trim()) return true;
  return false;
}

export async function getPostAuthRedirectPath(
  supabase: SupabaseClient,
  userId: string,
  fallback = "/dashboard"
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, business_name, first_name, last_name")
    .eq("id", userId)
    .single();

  if (profileNeedsOnboarding(profile)) return "/onboarding";
  return fallback;
}
