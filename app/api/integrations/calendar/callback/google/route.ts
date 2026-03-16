import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForTokens,
  decodeState,
} from "@/lib/integrations/calendar/google";
import { encrypt } from "@/lib/integrations/encryption";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";
  return url.trim().replace(/\/+$/, "");
}

export async function GET(request: Request) {
  const baseUrl = getBaseUrl();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?integration_error=calendar&reason=${encodeURIComponent(error)}`, baseUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings?integration_error=calendar&reason=missing_params", baseUrl)
    );
  }

  try {
    const userId = decodeState(state);
    const redirectUri = `${baseUrl}/api/integrations/calendar/callback/google`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("integration_connections")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "google_calendar")
      .maybeSingle();

    const row = {
      user_id: userId,
      provider: "google_calendar",
      access_token_encrypted: encrypt(tokens.access_token),
      refresh_token_encrypted: tokens.refresh_token
        ? encrypt(tokens.refresh_token)
        : null,
      token_expires_at: expiresAt?.toISOString() ?? null,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      calendar_sync_enabled: true,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from("integration_connections")
        .update(row)
        .eq("id", existing.id);
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("integration_connections")
        .insert(row)
        .select("id")
        .single();
      if (!insertErr && inserted) {
        await supabase.from("calendar_invoice_reminders").insert({
          user_id: userId,
          connection_id: inserted.id,
          calendar_id: "primary",
          reminder_delay_minutes: 15,
          enabled: true,
        });
      }
    }

    return NextResponse.redirect(new URL("/settings?integration=google_calendar", baseUrl));
  } catch (err) {
    console.error("[calendar callback google]", err);
    return NextResponse.redirect(
      new URL("/settings?integration_error=calendar", baseUrl)
    );
  }
}
