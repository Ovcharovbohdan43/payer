"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for browser (Client Components).
 * Uses anon key only — never use service role on the client.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
