import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decodeState } from "@/lib/integrations/calendar/google";
import {
  exchangeCodeForMicrosoftTokens,
} from "@/lib/integrations/calendar/microsoft";
import { encrypt } from "@/lib/integrations/encryption";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?integration_error=calendar&reason=${encodeURIComponent(error)}`, BASE_URL)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings?integration_error=calendar&reason=missing_params", BASE_URL)
    );
  }

  try {
    const userId = decodeState(state);
    const redirectUri = `${BASE_URL}/api/integrations/calendar/callback/microsoft`;
    const tokens = await exchangeCodeForMicrosoftTokens(code, redirectUri);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("integration_connections")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "microsoft_calendar")
      .maybeSingle();

    const row = {
      user_id: userId,
      provider: "microsoft_calendar",
      access_token_encrypted: encrypt(tokens.access_token),
      refresh_token_encrypted: tokens.refresh_token
        ? encrypt(tokens.refresh_token)
        : null,
      token_expires_at: expiresAt?.toISOString() ?? null,
      scopes: ["Calendars.Read", "offline_access"],
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

    return NextResponse.redirect(new URL("/settings?integration=microsoft_calendar", BASE_URL));
  } catch (err) {
    console.error("[calendar callback microsoft]", err);
    return NextResponse.redirect(
      new URL("/settings?integration_error=calendar", BASE_URL)
    );
  }
}
