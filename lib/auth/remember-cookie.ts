import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "puyer_remember";
const REMEMBER_DAYS = 30;

function getSecret(): string {
  const s = process.env.LOGIN_VERIFY_SECRET ?? process.env.CRON_SECRET ?? "puyer-remember";
  return s;
}

export function createRememberToken(userId: string): string {
  const expiresAt = Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expiresAt}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyToken(value: string): { userId: string } | null {
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  const payload = `${userId}.${expStr}`;
  const expectedSig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) return null;
  } catch {
    return null;
  }
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Date.now() > exp) return null;
  return { userId };
}

export async function isRememberedForUser(userId: string): Promise<boolean> {
  const store = await cookies();
  const val = store.get(COOKIE_NAME)?.value;
  if (!val) return false;
  const parsed = verifyToken(val);
  return parsed !== null && parsed.userId === userId;
}

export async function setRememberCookie(userId: string): Promise<void> {
  const store = await cookies();
  const token = createRememberToken(userId);
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REMEMBER_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearRememberCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

const OTP_PENDING_COOKIE = "puyer_otp_pending";

export async function setOtpPendingCookie(): Promise<void> {
  const store = await cookies();
  store.set(OTP_PENDING_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60, // 10 min
    path: "/",
  });
}

export async function clearOtpPendingCookie(): Promise<void> {
  const store = await cookies();
  store.delete(OTP_PENDING_COOKIE);
}

