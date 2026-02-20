-- Email unsubscribes: clients who opted out of invoice/reminder emails
create table if not exists public.email_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  unsubscribed_at timestamptz not null default now()
);

create index if not exists idx_email_unsubscribes_email on public.email_unsubscribes (lower(email));

comment on table public.email_unsubscribes is 'Clients who opted out of invoice and reminder emails from Puyer';
