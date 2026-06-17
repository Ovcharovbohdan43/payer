import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

function parseAdminAllowlist(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

/** True if user is platform admin (DB flag or ADMIN_USER_IDS env). */
export async function isUserAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (parseAdminAllowlist().has(userId)) return true;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  return data?.is_admin === true;
}

/** True if email belongs to a platform admin (for ban bypass on login). */
export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email?.trim()) return false;
  const normalized = email.trim().toLowerCase();

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("check_admin_email", { p_email: normalized });
  if (error) {
    console.error("[require-admin] check_admin_email", error.message);
    return false;
  }
  return data === true;
}

/** Server pages/actions: require signed-in admin or redirect. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const admin = await isUserAdmin(supabase, user.id);
  if (!admin) {
    redirect("/dashboard");
  }

  return { supabase, user };
}
