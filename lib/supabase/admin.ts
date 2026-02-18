import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseServiceRoleKey } from "./env";

/**
 * Supabase client with service role. Use only in server-only code (API routes, webhooks).
 * Bypasses RLS. Never expose to the client.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  return createSupabaseClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
