/**
 * Microsoft Calendar (Outlook) OAuth 2.0 and Graph API.
 * Uses Azure AD v2 / Microsoft Identity Platform. Scopes: Calendars.Read, offline_access.
 */

import { decrypt } from "@/lib/integrations/encryption";
import { encodeState } from "./google";

const MICROSOFT_SCOPES = "Calendars.Read offline_access";

export type MicrosoftCalendarTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

function getMicrosoftEnv() {
  const clientId = process.env.AZURE_CLIENT_ID?.trim();
  const clientSecret = process.env.AZURE_CLIENT_SECRET?.trim();
  const tenant = process.env.AZURE_TENANT_ID?.trim() || "common";
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing AZURE_CLIENT_ID or AZURE_CLIENT_SECRET. Add to .env.local (see .env.example)."
    );
  }
  return { clientId, clientSecret, tenant };
}

const BASE_AUTH = "https://login.microsoftonline.com";
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

/**
 * Build redirect URL for Microsoft OAuth (Azure AD v2).
 */
export function getMicrosoftCalendarAuthUrl(redirectUri: string, state: string): string {
  const { clientId, tenant } = getMicrosoftEnv();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: MICROSOFT_SCOPES,
    state,
    response_mode: "query",
  });
  return `${BASE_AUTH}/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForMicrosoftTokens(
  code: string,
  redirectUri: string
): Promise<MicrosoftCalendarTokens> {
  const { clientId, clientSecret, tenant } = getMicrosoftEnv();
  const tokenUrl = `${BASE_AUTH}/${tenant}/oauth2/v2.0/token`;
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Microsoft token exchange failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

/**
 * Refresh access token using refresh_token.
 */
export async function refreshMicrosoftCalendarTokens(
  refreshToken: string
): Promise<Omit<MicrosoftCalendarTokens, "refresh_token">> {
  const { clientId, clientSecret, tenant } = getMicrosoftEnv();
  const tokenUrl = `${BASE_AUTH}/${tenant}/oauth2/v2.0/token`;
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Microsoft token refresh failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return { access_token: data.access_token, expires_in: data.expires_in };
}

/** Connection row from integration_connections (Microsoft). */
export type MicrosoftConnectionRow = {
  id: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
};

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Return a valid access token for Microsoft, refreshing and updating the connection if expired.
 */
export async function getValidMicrosoftAccessToken(
  adminClient: import("@supabase/supabase-js").SupabaseClient,
  connection: MicrosoftConnectionRow
): Promise<string> {
  const accessToken = connection.access_token_encrypted
    ? decrypt(connection.access_token_encrypted)
    : null;
  if (!accessToken) throw new Error("No access token");

  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;
  if (Date.now() + TOKEN_EXPIRY_BUFFER_MS < expiresAt) {
    return accessToken;
  }

  const refreshTokenEnc = connection.refresh_token_encrypted;
  if (!refreshTokenEnc) throw new Error("No refresh token");
  const refreshToken = decrypt(refreshTokenEnc);
  const tokens = await refreshMicrosoftCalendarTokens(refreshToken);
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const { encrypt } = await import("@/lib/integrations/encryption");
  await adminClient
    .from("integration_connections")
    .update({
      access_token_encrypted: encrypt(tokens.access_token),
      token_expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  return tokens.access_token;
}

export type MicrosoftCalendarListItem = { id: string; name: string };

/**
 * List calendars for the authenticated user (for reminder calendar dropdown).
 */
export async function listMicrosoftCalendars(
  accessToken: string
): Promise<MicrosoftCalendarListItem[]> {
  const url = new URL(`${GRAPH_BASE}/me/calendars`);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Microsoft Graph API error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    value?: Array<{ id?: string; name?: string }>;
  };
  const items = data.value ?? [];
  return items
    .filter((c) => c.id)
    .map((c) => ({ id: c.id!, name: c.name ?? c.id ?? "" }));
}

export type MicrosoftCalendarEvent = {
  id: string;
  summary: string | null;
  endDateTime: Date | null;
};

/**
 * List events that overlap [timeMin, timeMax] via Graph calendarView.
 * Uses default calendar; calendar_id parameter ignored for consistency with API shape.
 */
export async function listMicrosoftCalendarEvents(
  accessToken: string,
  _calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<MicrosoftCalendarEvent[]> {
  const url = new URL(`${GRAPH_BASE}/me/calendarView`);
  url.searchParams.set("startDateTime", timeMin);
  url.searchParams.set("endDateTime", timeMax);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Microsoft Graph API error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    value?: Array<{
      id?: string;
      subject?: string;
      end?: { dateTime?: string; timeZone?: string };
    }>;
  };
  const items = data.value ?? [];
  return items
    .filter((e) => e.id)
    .map((e) => ({
      id: e.id!,
      summary: e.subject ?? null,
      endDateTime: e.end?.dateTime ? new Date(e.end.dateTime) : null,
    }));
}

