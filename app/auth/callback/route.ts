import { ACCOUNT_RESTRICTED_PATH, isUserBanned } from "@/lib/auth/account-status";
import { assertNotBannedForAuth, logUserIp } from "@/lib/auth/ban-enforcement";
import { logPlatformActivityRpc } from "@/lib/admin/platform-activity";
import { getClientIpFromRequest } from "@/lib/auth/client-ip";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Supabase Auth callback: exchange code for session, then redirect.
 * Always redirect to dashboard (or next). Onboarding is only shown after registration (see register actions).
 * Ensure Supabase Dashboard → Authentication → URL Configuration has this path in Redirect URLs.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=link_invalid`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=link_invalid`);
    }

    const clientIp = getClientIpFromRequest(request);
    const banBlock = await assertNotBannedForAuth(supabase, {
      email: user.email,
      ip: clientIp,
    });
    if (banBlock || (await isUserBanned(supabase, user.id))) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}${ACCOUNT_RESTRICTED_PATH}`);
    }

    await logUserIp(supabase, clientIp);
    await logPlatformActivityRpc(supabase, {
      category: "auth",
      action: "login.oauth_or_magic",
      ip: clientIp,
      meta: { userId: user.id, email: user.email },
    });
    return NextResponse.redirect(`${origin}${next}`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }
}
