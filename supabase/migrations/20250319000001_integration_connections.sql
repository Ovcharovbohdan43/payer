-- Integrations: OAuth connections for Calendar (Google, Microsoft) and future CRM.
-- Tokens stored encrypted (app-level); only metadata and connection status exposed to client.

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('google_calendar', 'microsoft_calendar')),
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],
  external_user_id text,
  calendar_sync_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.integration_connections enable row level security;

create policy "Users can manage own integration_connections"
  on public.integration_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_integration_connections_user_id
  on public.integration_connections (user_id);

comment on table public.integration_connections is 'OAuth tokens per user per provider (calendar, future CRM); tokens encrypted at rest.';

-- Which calendar events trigger "issue invoice" reminder (phase 5.2)
create table if not exists public.calendar_invoice_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  connection_id uuid not null references public.integration_connections (id) on delete cascade,
  calendar_id text not null,
  reminder_delay_minutes int not null default 15 check (reminder_delay_minutes >= 0 and reminder_delay_minutes <= 1440),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_invoice_reminders enable row level security;

create policy "Users can manage own calendar_invoice_reminders"
  on public.calendar_invoice_reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_calendar_invoice_reminders_user_id
  on public.calendar_invoice_reminders (user_id);

-- Idempotency: which events already triggered a reminder
create table if not exists public.calendar_reminder_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  connection_id uuid not null references public.integration_connections (id) on delete cascade,
  event_id text not null,
  event_end_at timestamptz not null,
  reminder_sent_at timestamptz not null default now(),
  unique (connection_id, event_id)
);

alter table public.calendar_reminder_sent enable row level security;

create policy "Users can manage own calendar_reminder_sent"
  on public.calendar_reminder_sent for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_calendar_reminder_sent_connection_event
  on public.calendar_reminder_sent (connection_id, event_id);

-- Optional: link calendar event to client for prefill (phase 5.4)
create table if not exists public.calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  connection_id uuid not null references public.integration_connections (id) on delete cascade,
  event_id text not null,
  client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (connection_id, event_id)
);

alter table public.calendar_event_links enable row level security;

create policy "Users can manage own calendar_event_links"
  on public.calendar_event_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_calendar_event_links_connection_event
  on public.calendar_event_links (connection_id, event_id);
