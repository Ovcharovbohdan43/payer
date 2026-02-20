import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const SECRET =
  process.env.UNSUBSCRIBE_SECRET ??
  process.env.CRON_SECRET ??
  "puyer-unsubscribe-fallback";

/**
 * Generate a signed token for unsubscribe link. Email is normalized to lowercase.
 */
export function generateUnsubscribeToken(email: string): string {
  const normalized = email.toLowerCase().trim();
  return createHmac("sha256", SECRET).update(normalized).digest("hex");
}

/**
 * Verify token matches email. Returns true if valid.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  return expected.length > 0 && token.length > 0 && expected === token;
}

/**
 * Check if email has unsubscribed from invoice/reminder emails.
 */
export async function isEmailUnsubscribed(email: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const normalized = email.toLowerCase().trim();
    const { data, error } = await supabase
      .from("email_unsubscribes")
      .select("id")
      .eq("email", normalized)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("[unsubscribe] check failed:", error.message);
      return false;
    }
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Add email to unsubscribes. Idempotent (uses ON CONFLICT if needed).
 */
export async function addUnsubscribe(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const normalized = email.toLowerCase().trim();
    const { error } = await supabase.from("email_unsubscribes").upsert(
      { email: normalized, unsubscribed_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (error) {
      console.error("[unsubscribe] add failed:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
