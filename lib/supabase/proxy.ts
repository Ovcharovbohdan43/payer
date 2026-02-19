import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { OTP_PENDING_COOKIE_NAME } from "@/lib/auth/constants";

const PROTECTED_PREFIXES = ["/dashboard", "/invoices", "/clients", "/settings", "/onboarding"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  let url: string;
  let anonKey: string;
  try {
    const env = await import("@/lib/supabase/env").then((m) => m.getSupabaseEnv());
    url = env.url;
    anonKey = env.anonKey;
  } catch {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const pathname = request.nextUrl.pathname;

  if (!user && (isProtectedPath(pathname) || pathname === "/login/verify-otp")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    if (isProtectedPath(pathname)) redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const otpPending = request.cookies.get(OTP_PENDING_COOKIE_NAME)?.value;
  if (user && otpPending && isProtectedPath(pathname) && pathname !== "/login/verify-otp") {
    return NextResponse.redirect(new URL("/login/verify-otp", request.url));
  }

  return supabaseResponse;
}
