import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleCalendarAuthUrl, encodeState } from "@/lib/integrations/calendar/google";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";
  return url.trim().replace(/\/+$/, "");
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", getBaseUrl()));
    }

    const baseUrl = getBaseUrl();
    const redirectUri = `${baseUrl}/api/integrations/calendar/callback/google`;
    const state = encodeState(user.id);
    const authUrl = getGoogleCalendarAuthUrl(redirectUri, state);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("[calendar auth google]", err);
    return NextResponse.redirect(
      new URL("/settings?integration_error=calendar", getBaseUrl())
    );
  }
}
