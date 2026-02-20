import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Password reset callback: exchange code for session, redirect to settings recovery.
 * Used by Supabase resetPasswordForEmail flow. Add /auth/reset-password to Redirect URLs.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=link_invalid`);
    }

    return NextResponse.redirect(`${origin}/settings?recovery=1`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }
}
