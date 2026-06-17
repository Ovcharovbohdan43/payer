import type { NextRequest } from "next/server";
import { headers } from "next/headers";

/** Extract client IP from proxy headers (Vercel, etc.). */
export function getClientIpFromRequest(request: NextRequest | Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || null;
}

/** For Server Actions — read IP from Next.js headers(). */
export async function getClientIpFromHeaders(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || null;
}
