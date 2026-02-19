import { createClient } from "@/lib/supabase/server";
import { sendLoginOtpEmail } from "@/lib/email/send";
import { createHmac, timingSafeEqual } from "crypto";

const OTP_EXPIRY_MINUTES = 5;
const SALT = process.env.LOGIN_OTP_SECRET ?? "puyer-otp-fallback";

function generateCode(): string {
  const n = Math.floor(10000 + Math.random() * 90000); // 10000–99999
  return String(n);
}

function hashCode(code: string, userId: string): string {
  return createHmac("sha256", SALT).update(code + userId).digest("hex");
}

export async function createAndSendOtp(userId: string, email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const code = generateCode();
  const codeHash = hashCode(code, userId);

  const { error: insertError } = await supabase
    .from("login_otps")
    .insert({ user_id: userId, code_hash: codeHash, expires_at: expiresAt.toISOString() });

  if (insertError) return { ok: false, error: insertError.message };

  const result = await sendLoginOtpEmail({ to: email, code });
  if (!result.ok) {
    await supabase.from("login_otps").delete().eq("user_id", userId);
    return result;
  }
  return { ok: true };
}

export async function verifyOtp(userId: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("login_otps")
    .select("id, code_hash")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString());

  if (error) return { ok: false, error: error.message };
  if (!rows || rows.length === 0) return { ok: false, error: "Code expired or invalid. Request a new one." };

  const expectedHash = hashCode(code, userId);
  const match = rows.some((r) => {
    try {
      return timingSafeEqual(Buffer.from(r.code_hash, "hex"), Buffer.from(expectedHash, "hex"));
    } catch {
      return false;
    }
  });

  if (!match) return { ok: false, error: "Invalid code" };

  await supabase.from("login_otps").delete().eq("user_id", userId);
  return { ok: true };
}
