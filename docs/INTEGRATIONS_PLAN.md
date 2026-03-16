# Integrations Plan: Calendar, CRM, Accounting

**Feature:** Integrations (Calendar, CRM, Accounting) — Puyer fits into the existing stack instead of living separately.

**Killer value:** Remind "Issue invoice" after a session (from calendar); export to accounting (1C, CSV, bank API).

**Last updated:** 2025-03-18

---

## 1. Overview

| Integration   | Purpose | MVP scope |
|---------------|---------|-----------|
| **Calendar**  | Remind "Issue invoice" after a session; optional: link event → client / prefill | Google Calendar, Microsoft Outlook (Graph) |
| **CRM**       | Sync clients/contacts; optional: create invoice from deal | Webhook/API adapter; optional HubSpot/Pipedrive |
| **Accounting**| Export paid invoices for 1C, bank CSV, or external API | CSV (universal), 1C XML, configurable CSV for banks |

---

## 2. Calendar Integration

### 2.1 Goal

- After a **session** (calendar event) ends → remind the user: **"Issue invoice"** (in-app and/or email).
- Optional: choose which calendar(s), delay (e.g. 15 min after event end), and link event to a client for prefill.

### 2.2 Data Model

**New tables (migration):**

```sql
-- OAuth tokens per user per provider (encrypted at rest; use Vault or app-level encryption)
create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('google_calendar', 'microsoft_calendar')),
  access_token_encrypted text,       -- store encrypted; decrypt only in server
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],                    -- e.g. ['https://www.googleapis.com/auth/calendar.readonly']
  external_user_id text,             -- provider user id
  calendar_sync_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- Which events trigger "issue invoice" reminder (user choice)
create table public.calendar_invoice_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  connection_id uuid not null references public.integration_connections (id) on delete cascade,
  calendar_id text not null,         -- 'primary' or specific id
  reminder_delay_minutes int not null default 15 check (reminder_delay_minutes >= 0 and reminder_delay_minutes <= 1440),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Track which events already triggered a reminder (idempotency)
create table public.calendar_reminder_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  connection_id uuid not null references public.integration_connections (id) on delete cascade,
  event_id text not null,            -- provider event id
  event_end_at timestamptz not null,
  reminder_sent_at timestamptz not null default now(),
  unique (connection_id, event_id)
);

-- Optional: link calendar event to client (for prefill when creating invoice)
create table public.calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  connection_id uuid not null references public.integration_connections (id) on delete cascade,
  event_id text not null,
  client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (connection_id, event_id)
);
```

**RLS:** All tables: `user_id = auth.uid()` for SELECT/INSERT/UPDATE/DELETE. No public access.

**Indexes:**  
`integration_connections(user_id)`, `calendar_invoice_reminders(user_id)`, `calendar_reminder_sent(connection_id, event_id)`, `calendar_event_links(connection_id, event_id)`.

### 2.3 Google Calendar

- **OAuth:** Same Supabase Auth Google provider can be reused for sign-in; for Calendar API we need a **separate OAuth client** (or same Google Cloud project) with scopes:
  - `https://www.googleapis.com/auth/calendar.readonly` — list events (MVP).
  - Optionally `calendar.events.readonly` if we need more fields.
- **Token storage:** Store `access_token`, `refresh_token`, `expiry` in `integration_connections` (encrypted). Use Supabase Vault or app-level encryption (e.g. envelope encryption with `INTEGRATION_ENCRYPTION_KEY`).
- **API:** Server-side only. Use `googleapis` (Node.js):
  - `calendar.events.list({ calendarId, timeMin, timeMax, singleEvents: true, orderBy: 'startTime' })`.
- **Cron:** New job (e.g. every 15 min): for each `calendar_invoice_reminders` row with `enabled`, fetch events that ended in the window `[now - 15m - delay, now - delay]`; for each event not in `calendar_reminder_sent`, send reminder and insert into `calendar_reminder_sent`.
- **Reminder delivery:** In-app notification (if we add a notifications table) and/or email (Resend): "Session [title] ended. Issue invoice?" with link to `/invoices/new?client_id=…` if `calendar_event_links` has a client.

**Endpoints:**

- `GET /api/integrations/calendar/auth/google` — redirect to Google OAuth (with state = csrf + return URL).
- `GET /api/integrations/calendar/callback/google` — exchange code, save tokens, redirect to Settings → Integrations.
- `POST /api/integrations/calendar/disconnect` — delete connection (body: `provider: 'google_calendar'`).
- `GET /api/integrations/calendar/calendars` — list calendars (for dropdown when enabling reminder).
- `POST /api/integrations/calendar/reminders` — create/update `calendar_invoice_reminders` (calendar_id, delay_minutes).
- Optional: `POST /api/integrations/calendar/event-link` — link event to client (event_id, client_id).

### 2.4 Microsoft Calendar (Outlook)

- **OAuth:** Microsoft Identity Platform (Azure AD app). Scopes: `Calendars.Read`, `offline_access`.
- **API:** Microsoft Graph `GET /me/calendarView` or `GET /me/events` with `$filter=end/datetime ge '...' and start/datetime le '...'`.
- **Token storage:** Same `integration_connections` with `provider = 'microsoft_calendar'`; refresh via Graph token endpoint.
- **Cron:** Same cron job, branch by provider: fetch events from Google or Graph, then same reminder + idempotency logic.
- **Endpoints:** Mirror Google: `/api/integrations/calendar/auth/microsoft`, callback, disconnect, list calendars, reminders.

### 2.5 Security & Privacy

- Tokens never sent to client; only "Connected" / "Not connected" and calendar list (ids + names).
- No calendar data stored except event_id and event_end_at in `calendar_reminder_sent` and optional client link in `calendar_event_links`.
- Rate limit: calendar list and reminder config per user; cron internal.

---

## 3. CRM Integration

### 3.1 Goal

- **Sync clients:** Import/sync contacts from CRM into Puyer clients (optional mapping: CRM field → name/email/phone).
- **Optional:** Create invoice from a CRM deal (e.g. "Create invoice" in Puyer from deal ID).

### 3.2 Data Model (minimal for MVP)

- **Option A (webhook):** No new tables; CRM sends webhook to Puyer (e.g. "contact created/updated") with secret; we create/update client. Requires `POST /api/webhooks/crm` and a mapping config per user (e.g. in `profiles` or `integration_connections` meta).
- **Option B (pull):** Store `integration_connections` with `provider = 'hubspot' | 'pipedrive' | 'generic_api'` and optional `api_key_encrypted` / webhook URL. Cron or on-demand sync: fetch contacts, upsert into `clients` with optional `external_id` on clients.

**Recommended for MVP:** Webhook + optional `clients.external_id` (and `external_source` text) to avoid duplicates when syncing.

```sql
alter table public.clients
  add column if not exists external_id text,
  add column if not exists external_source text;  -- e.g. 'hubspot', 'webhook_crm'
create unique index if not exists idx_clients_user_external
  on public.clients (user_id, external_source, external_id)
  where external_id is not null and external_source is not null;
```

### 3.3 Webhook API

- **Endpoint:** `POST /api/webhooks/crm`. Body: JSON with contact (name, email, phone, optional id). Header: `X-CRM-Secret` or `Authorization: Bearer <token>` per user (stored in settings).
- **Validation:** Verify secret; find user by webhook key; create or update client (match by external_id or email); respond 200 quickly, process async if needed.
- **Docs:** Public doc: "CRM webhook: send contact to Puyer" with payload example and how to get webhook URL + secret in Settings.

### 3.4 Optional: HubSpot / Pipedrive

- OAuth or API key in `integration_connections`. Sync job: fetch contacts/deals, map to clients (and optionally create invoice from deal). Can be Phase 2.

---

## 4. Accounting Export

### 4.1 Goal

- Export **paid** invoices for:
  - **1C:** XML exchange format (e.g. документ "Реализация" / счёт-фактура).
  - **CSV:** Universal and bank-specific (date, amount, counterparty, purpose, etc.).
  - **API:** Push to external system (e.g. bank API) — optional, same data contract.

### 4.2 Data Contract (single source of truth)

One internal representation, then serializers to 1C XML, CSV, or API payload:

- Invoice: number, date (paid_at or issue date), client_name, client_email, client tax id (if we add), amount, currency, VAT breakdown if present, line items (description, amount, VAT), discount, total.
- From DB: `invoices` + `invoice_line_items` + `payments` + `profiles` (business name, VAT, etc.). Use existing `get_public_invoice`-like data or a new server-side `getInvoiceForExport(invoiceId)` that returns full invoice + line items + payment.

### 4.3 Export Formats

**CSV (universal):**

- Columns: Invoice number, Date, Client name, Client email, Amount, Currency, Description (or concatenated line items), Payment date.
- Delimiter: comma; encoding UTF-8; optional BOM for Excel.
- Endpoint: `GET /api/invoices/export/csv?from=YYYY-MM-DD&to=YYYY-MM-DD&status=paid` (auth required). Stream response, filename `invoices_YYYY-MM-DD.csv`.

**CSV for bank:**

- Configurable columns (e.g. date, amount, counterparty name, purpose, bank account). Stored in `profiles` or new table `export_configs`: column order, date format, separator. One preset "Bank X" could be shipped as default.
- Endpoint: same as above with `?format=bank&config=default`.

**1C XML:**

- Structure: root document with organization (from profile), then list of documents; each document: number, date, counterparty, sum, VAT, lines (description, quantity, price, sum). Follow 1C exchange format (e.g. Коммерция обмен; exact schema can be chosen per 1C version).
- Endpoint: `GET /api/invoices/export/1c?from=...&to=...` (auth). Content-Type `application/xml`, filename `1c_export_YYYY-MM-DD.xml`.

**API (optional):**

- `POST /api/invoices/export/push` — body: `{ "target": "bank_api", "config_id": "...", "invoice_ids": ["uuid", ...] }`. Server builds payload from same data contract and sends to configured URL with auth (e.g. API key in config). Optional for Phase 2.

### 4.4 Implementation Outline

- **lib/export/invoice-export.ts:**  
  - `getInvoicesForExport(userId, filters): Promise<InvoiceExportRow[]>` (from DB).  
  - `toCsv(rows, options): string` or stream.  
  - `to1CXml(rows, profile): string` (XML builder).  
- **API routes:**  
  - `app/api/invoices/export/csv/route.ts` — auth, parse query, getInvoicesForExport, toCsv, return file.  
  - `app/api/invoices/export/1c/route.ts` — same, to1CXml.  
- **Settings:** Section "Accounting export" — link to docs, optional export config (bank CSV columns, date format). Optional: "Export to 1C" / "Download CSV" buttons that redirect to export URL with default date range.

### 4.5 Security

- Export only for authenticated user; RLS ensures only own invoices. No PII in logs (only count/size). Rate limit export endpoints (e.g. 10 req/min per user).

---

## 5. Implementation Phases

| Phase | Scope | Deliverables |
|-------|--------|--------------|
| **5.1 Calendar – OAuth & storage** | Google OAuth for Calendar, store tokens in `integration_connections`, encrypt tokens | Migration, `/auth/google` + callback, Settings UI "Connect Google Calendar" |
| **5.2 Calendar – Reminders** | Cron: fetch events, send "Issue invoice" after session end | `calendar_invoice_reminders`, `calendar_reminder_sent`, cron route, email template |
| **5.3 Calendar – Outlook** | Microsoft OAuth + Graph, same reminder flow | Microsoft auth + callback, provider branch in cron |
| **5.4 Calendar – UI** | Choose calendar, set delay, optional event→client link | Settings → Integrations, reminders config, optional link UI |
| **5.5 CRM – Webhook** | Generic webhook to create/update clients | `clients.external_id/source`, `POST /api/webhooks/crm`, Settings "Webhook URL + secret" |
| **5.6 Accounting – CSV** | Universal CSV export for paid invoices | `getInvoicesForExport`, CSV route, Settings "Export" link |
| **5.7 Accounting – 1C** | 1C XML format | `to1CXml`, 1C export route |
| **5.8 Accounting – Bank CSV** | Configurable bank CSV preset | Export config (optional table), bank CSV format |

---

## 6. File Structure (suggested)

```
lib/
  integrations/
    calendar/
      google.ts      -- Google OAuth + events list
      microsoft.ts   -- MS Graph OAuth + events list
      reminder-job.ts -- cron: fetch events, send reminder, idempotency
    crm/
      webhook.ts     -- parse webhook, upsert client
  export/
    invoice-export.ts -- getInvoicesForExport, toCsv, to1CXml
    formats/
      csv.ts
      ics-1c.ts      or 1c-xml.ts
app/
  api/
    integrations/
      calendar/
        auth/
          google/route.ts
          microsoft/route.ts
        callback/
          google/route.ts
          microsoft/route.ts
        calendars/route.ts
        reminders/route.ts
        disconnect/route.ts
    cron/
      calendar-reminders/route.ts  -- every 15 min
    webhooks/
      crm/route.ts
    invoices/
      export/
        csv/route.ts
        1c/route.ts
app/(app)/settings/
  integrations-section.tsx  -- Calendar + CRM + Accounting export
```

---

## 7. Configuration & Env

- `INTEGRATION_ENCRYPTION_KEY` — 32-byte hex for token encryption (calendar/CRM tokens).
- Google: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET` (can be same as Supabase Auth Google if scopes extended).
- Microsoft: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` (or common).
- Cron: reuse `CRON_SECRET` for `GET /api/cron/calendar-reminders` (Vercel Cron every 15 min).
- Webhook CRM: per-user webhook secret stored in DB (not env).

---

## 8. Testing

- **Unit:** `reminder-job` — given mock events and existing `calendar_reminder_sent`, assert only expected reminders sent; export `toCsv` / `to1CXml` with fixture rows.
- **Integration:** Google OAuth flow (test account); cron with test connection and past event; webhook CRM with secret, assert client created.
- **E2E:** Connect calendar → create reminder → run cron (or trigger manually) → receive email; export CSV and open in Excel.

---

## 9. Documentation Updates

- **Help / FAQ:** "How do calendar reminders work?", "How do I export to 1C / my bank?"
- **README / .env.example:** New env vars for integrations.
- **CHANGELOG:** Entry when each phase ships.

---

## 10. Assumptions

- **Calendar:** "Session" = calendar event (e.g. consultation, call). Reminder is sent once per event after it ends (plus configurable delay). No two-way sync (we don’t create events in calendar).
- **CRM:** MVP is one-way: CRM → Puyer (webhook or pull). Puyer does not push invoices back to CRM in MVP.
- **1C:** One common exchange format is chosen (e.g. Коммерция/УТ 11 or generic XML); exact schema may depend on 1C version — document in Help.
- **Bank CSV:** Presets are configurable (column order, date format); no live bank API in MVP unless explicitly scoped.

## 11. Risks & Limitations

- **Token refresh:** Calendar tokens must be refreshed before expiry; cron or on-demand refresh when calling API. If refresh fails, mark connection as broken and notify user in Settings.
- **Rate limits:** Google/Microsoft Calendar API have quotas; batch requests and cache calendar list where possible.
- **1C versions:** Different 1C configurations use different XML schemas; we may need multiple 1C presets or a single "generic" format plus docs for manual mapping.
- **Encryption:** Token encryption at rest is mandatory; key rotation strategy should be defined before production.

## 12. Changelog (this doc)

- [2025-03-19] Phase 5.3 implemented: Microsoft Calendar (Outlook) — lib/integrations/calendar/microsoft.ts (OAuth, token refresh, getValidMicrosoftAccessToken, listMicrosoftCalendarEvents via Graph calendarView); auth/microsoft and callback/microsoft routes; disconnect accepts body { provider }; reminder-job branches by provider; Settings UI: Connect Microsoft Calendar (Outlook) and Disconnect; env: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID.
- [2025-03-19] Phase 5.2 implemented: cron job for "Issue invoice?" after session; default calendar_invoice_reminders row (primary, 15 min) on first Google connect; getValidAccessToken + listGoogleCalendarEvents in google.ts; reminder-job.ts + GET /api/cron/calendar-reminders; email template buildCalendarSessionReminderHtml + sendCalendarSessionReminderEmail; Vercel Cron */15 * * * *.
- [2025-03-19] Phase 5.1 implemented: migration `20250319000001_integration_connections.sql`; Google OAuth (auth URL, callback, token encrypt/store); Settings → Integrations section (Connect Google Calendar / Disconnect); env: GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, INTEGRATION_ENCRYPTION_KEY.
- [2025-03-18] Initial plan: Calendar (Google/Outlook), CRM webhook, Accounting (CSV, 1C XML, bank CSV). Added Assumptions, Risks & Limitations.
