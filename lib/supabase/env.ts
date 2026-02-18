/**
 * Validate and normalize Supabase env vars.
 * NEXT_PUBLIC_SUPABASE_URL must be the API URL (e.g. https://xxx.supabase.co), not the PostgreSQL connection string.
 */
function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (see .env.example). Use the API URL from Supabase Dashboard → Settings → API → Project URL (e.g. https://xxx.supabase.co)."
    );
  }
  const url = raw.trim().replace(/^["']|["']$/g, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be an HTTP or HTTPS URL (e.g. https://your-project.supabase.co). You may have pasted the PostgreSQL connection string by mistake — use Project URL from Supabase Dashboard → Settings → API."
    );
  }
  return url.replace(/\/+$/, "");
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to .env.local from Supabase Dashboard → Settings → API → anon public."
    );
  }
  return key;
}

export function getSupabaseEnv() {
  return { url: getSupabaseUrl(), anonKey: getSupabaseAnonKey() };
}

/** Service role key for server-only operations (checkout, webhooks). Throws if not set. */
export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Required for Stripe checkout and webhooks. Add to .env.local from Supabase Dashboard → Settings → API → service_role (secret)."
    );
  }
  return key;
}
