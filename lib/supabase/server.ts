import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for server (Server Components, Route Handlers, Server Actions).
 * Uses anon key and cookies for session. For service-role operations (e.g. webhooks),
 * create a separate client with createClient from @supabase/supabase-js and SUPABASE_SERVICE_ROLE_KEY.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignored when called from Server Component during render
        }
      },
    },
  });
}
