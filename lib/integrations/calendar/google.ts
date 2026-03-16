/**
 * Google Calendar OAuth 2.0: auth URL, code exchange, token refresh.
 * Tokens are not stored here; caller encrypts and saves to integration_connections.
 */

import { decrypt, encrypt } from "@/lib/integrations/encryption";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 min

export type GoogleCalendarTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

function getGoogleCalendarEnv() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CALENDAR_CLIENT_ID or GOOGLE_CALENDAR_CLIENT_SECRET. Add to .env.local (see .env.example)."
    );
  }
  return { clientId, clientSecret };
}

/**
 * Build redirect URL for Google OAuth. redirectUri should be the full callback URL (e.g. origin + /api/integrations/calendar/callback/google).
 */
export function getGoogleCalendarAuthUrl(redirectUri: string, state: string): string {
  const { clientId } = getGoogleCalendarEnv();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    state,
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleCalendarTokens> {
  const { clientId, clientSecret } = getGoogleCalendarEnv();
  const res = await fetch(GOOGLE_TOKEN_URL, {
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
    throw new Error(`Google token exchange failed: ${res.status} ${err}`);
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
export async function refreshGoogleCalendarTokens(
  refreshToken: string
): Promise<Omit<GoogleCalendarTokens, "refresh_token">> {
  const { clientId, clientSecret } = getGoogleCalendarEnv();
  const res = await fetch(GOOGLE_TOKEN_URL, {
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
    throw new Error(`Google token refresh failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return { access_token: data.access_token, expires_in: data.expires_in };
}

/**
 * Encode state payload (userId + timestamp) for OAuth callback. Encrypted so client cannot forge.
 */
export function encodeState(userId: string): string {
  const payload = JSON.stringify({ userId, ts: Date.now() });
  return encrypt(payload);
}

/**
 * Decode and validate state; return userId. Throws if invalid or expired.
 */
export function decodeState(state: string): string {
  const payload = JSON.parse(decrypt(state)) as { userId?: string; ts?: number };
  if (!payload?.userId || typeof payload.ts !== "number") {
    throw new Error("Invalid state");
  }
  if (Date.now() - payload.ts > STATE_TTL_MS) {
    throw new Error("State expired");
  }
  return payload.userId;
}

/** Connection row from integration_connections (with encrypted tokens). */
export type IntegrationConnectionRow = {
  id: string;
  provider?: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
};

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // refresh if expires in < 5 min

/**
 * Return a valid access token, refreshing and updating the connection if expired.
 * Uses admin client to update integration_connections.
 */
export async function getValidAccessToken(
  adminClient: import("@supabase/supabase-js").SupabaseClient,
  connection: IntegrationConnectionRow
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
  const tokens = await refreshGoogleCalendarTokens(refreshToken);
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

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

export type GoogleCalendarListItem = { id: string; summary: string };

/**
 * List calendars for the authenticated user (for reminder calendar dropdown).
 */
export async function listGoogleCalendars(
  accessToken: string
): Promise<GoogleCalendarListItem[]> {
  const url = new URL(`${CALENDAR_API_BASE}/users/me/calendarList`);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    items?: Array<{ id?: string; summary?: string }>;
  };
  const items = data.items ?? [];
  return items
    .filter((c) => c.id)
    .map((c) => ({ id: c.id!, summary: c.summary ?? c.id ?? "" }));
}

export type GoogleCalendarEvent = {
  id: string;
  summary: string | null;
  endDateTime: Date | null; // null for all-day (we skip or use date)
};

/**
 * List events that overlap [timeMin, timeMax]. Caller should filter by end time if needed.
 */
export async function listGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  const url = new URL(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    items?: Array<{
      id?: string;
      summary?: string;
      end?: { dateTime?: string; date?: string };
    }>;
  };
  const items = data.items ?? [];
  return items
    .filter((e) => e.id)
    .map((e) => ({
      id: e.id!,
      summary: e.summary ?? null,
      endDateTime: e.end?.dateTime
        ? new Date(e.end.dateTime)
        : e.end?.date
          ? new Date(e.end.date + "T23:59:59Z")
          : null,
    }));
}
