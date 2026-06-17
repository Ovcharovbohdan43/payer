import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCOUNT_RESTRICTED_PATH,
  isAccountBanned,
} from "@/lib/auth/account-status";
import { isIpBanned, logUserIp } from "@/lib/auth/ban-enforcement";
import { logPlatformActivityRpc } from "@/lib/admin/platform-activity";
import { getClientIpFromRequest } from "@/lib/auth/client-ip";
import { OTP_PENDING_COOKIE_NAME } from "@/lib/auth/constants";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/invoices",
  "/clients",
  "/settings",
  "/onboarding",
  "/offers",
  "/rate-us",
];

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

const BAN_CHECK_PREFIXES = [
  ...PROTECTED_PREFIXES,
  "/api/",
];

function isBanCheckedPath(pathname: string) {
  return BAN_CHECK_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function isBanExemptPath(pathname: string) {
  return (
    pathname === ACCOUNT_RESTRICTED_PATH ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    isAdminPath(pathname)
  );
}

const IP_BAN_AUTH_PATHS = ["/register", "/login", "/auth/callback", "/onboarding"];

function isIpBanAuthPath(pathname: string) {
  return IP_BAN_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function shouldLogPageView(pathname: string, method: string) {
  if (method !== "GET") return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/admin")) return false;
  return true;
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
  const clientIp = getClientIpFromRequest(request);

  if (clientIp && isIpBanAuthPath(pathname) && (await isIpBanned(supabase, clientIp))) {
    return NextResponse.redirect(new URL(ACCOUNT_RESTRICTED_PATH, request.url));
  }

  if (!user && (isProtectedPath(pathname) || isAdminPath(pathname) || pathname === "/login/verify-otp")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    if (isProtectedPath(pathname) || isAdminPath(pathname)) {
      redirectUrl.searchParams.set("redirectTo", pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  const otpPending = request.cookies.get(OTP_PENDING_COOKIE_NAME)?.value;
  if (
    user &&
    otpPending &&
    isProtectedPath(pathname) &&
    !isAdminPath(pathname) &&
    pathname !== "/login/verify-otp"
  ) {
    return NextResponse.redirect(new URL("/login/verify-otp", request.url));
  }

  const userId = typeof user?.sub === "string" ? user.sub : null;
  if (userId && !isBanExemptPath(pathname)) {
    if (pathname === ACCOUNT_RESTRICTED_PATH) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("id", userId)
        .single();

      if (!isAccountBanned(profile?.account_status)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } else if (isBanCheckedPath(pathname)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("id", userId)
        .single();

      if (isAccountBanned(profile?.account_status)) {
        return NextResponse.redirect(new URL(ACCOUNT_RESTRICTED_PATH, request.url));
      }
    }
  }

  if (userId && clientIp) {
    await logUserIp(supabase, clientIp);
  }

  if (shouldLogPageView(pathname, request.method)) {
    void supabase.rpc("log_site_page_view", {
      p_path: pathname,
      p_ip: clientIp,
      p_referrer: request.headers.get("referer"),
    });
    void logPlatformActivityRpc(supabase, {
      category: "page",
      action: "view",
      path: pathname,
      ip: clientIp,
    });
  }

  return supabaseResponse;
}
