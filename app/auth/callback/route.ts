import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Supabase Auth callback: exchange code for session, then redirect.
 * New users → /onboarding. Returning users with profile → /dashboard.
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

    let redirectTo = next;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.business_name) {
        redirectTo = "/onboarding";
      }
    } catch {
      redirectTo = "/onboarding";
    }

    return NextResponse.redirect(`${origin}${redirectTo}`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }
}
