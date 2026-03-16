import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encodeState } from "@/lib/integrations/calendar/google";
import { getMicrosoftCalendarAuthUrl } from "@/lib/integrations/calendar/microsoft";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", BASE_URL));
    }

    const redirectUri = `${BASE_URL}/api/integrations/calendar/callback/microsoft`;
    const state = encodeState(user.id);
    const authUrl = getMicrosoftCalendarAuthUrl(redirectUri, state);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("[calendar auth microsoft]", err);
    return NextResponse.redirect(
      new URL("/settings?integration_error=calendar", BASE_URL)
    );
  }
}
