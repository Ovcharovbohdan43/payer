-- Phase 2: clients, invoices, payments, audit_logs + RLS + indexes.
-- Public invoice read via get_public_invoice(public_id). Invoice numbers: INV-YYYY-NNNNNN per user per year.

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Users can manage own clients"
  on public.clients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_clients_user_id on public.clients (user_id);

comment on table public.clients is 'Clients per user; used for invoice autocomplete and denormalized on invoice.';

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
create type public.invoice_status as enum (
  'draft', 'sent', 'viewed', 'paid', 'overdue', 'void'
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  client_name text not null,
  client_email text,
  number text not null,
  status public.invoice_status not null default 'draft',
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null default 'USD',
  description text,
  notes text,
  due_date date,
  public_id text not null unique,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  viewed_at timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,
  unique (user_id, number)
);

alter table public.invoices enable row level security;

create policy "Users can manage own invoices"
  on public.invoices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_invoices_user_id_status on public.invoices (user_id, status);
create index if not exists idx_invoices_public_id on public.invoices (public_id);
create index if not exists idx_invoices_stripe_checkout on public.invoices (stripe_checkout_session_id) where stripe_checkout_session_id is not null;

comment on table public.invoices is 'Invoices per user; public_id used for public page, never expose internal id.';

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount_cents bigint not null,
  currency text not null,
  stripe_event_id text unique,
  paid_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- Users can only read payments for invoices they own.
create policy "Users can view payments for own invoices"
  on public.payments for select
  using (
    exists (
      select 1 from public.invoices i
      where i.id = payments.invoice_id and i.user_id = auth.uid()
    )
  );

-- Insert/update only via service role or backend (e.g. webhook). No policy for insert from anon.
comment on table public.payments is 'Payment records; inserts from Stripe webhook with service role.';

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "Users can insert own audit logs"
  on public.audit_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can view own audit logs"
  on public.audit_logs for select
  using (auth.uid() = user_id);

create index if not exists idx_audit_logs_user_created on public.audit_logs (user_id, created_at desc);

create index if not exists idx_payments_invoice_id on public.payments (invoice_id);

comment on table public.audit_logs is 'Audit trail for invoice/client/payment actions.';

-- ---------------------------------------------------------------------------
-- Public invoice: safe read by public_id only (no user_id, no internal id)
-- ---------------------------------------------------------------------------
create or replace function public.get_public_invoice(p_public_id text)
returns table (
  business_name text,
  invoice_number text,
  amount_cents bigint,
  currency text,
  description text,
  due_date date,
  status text,
  client_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.business_name,
    i.number as invoice_number,
    i.amount_cents,
    i.currency,
    i.description,
    i.due_date,
    i.status::text,
    i.client_name
  from public.invoices i
  join public.profiles p on p.id = i.user_id
  where i.public_id = p_public_id
    and i.status != 'void'
  limit 1;
$$;

comment on function public.get_public_invoice is 'Returns minimal invoice fields for public page; no user_id or internal id.';

-- ---------------------------------------------------------------------------
-- Next invoice number per user per year: INV-YYYY-NNNNNN
-- ---------------------------------------------------------------------------
create or replace function public.next_invoice_number(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year text := to_char(now(), 'YYYY');
  next_seq int;
begin
  select coalesce(max(
    nullif(regexp_replace(substring(number from 10), '^0+', ''), '')::int
  ), 0) + 1
  into next_seq
  from public.invoices
  where user_id = p_user_id
    and number like 'INV-' || current_year || '-%';
  return 'INV-' || current_year || '-' || lpad(next_seq::text, 6, '0');
end;
$$;

comment on function public.next_invoice_number is 'Generates next INV-YYYY-NNNNNN for the given user. Call with auth.uid() from app.';

-- Allow anon to call get_public_invoice (public invoice page); authenticated to call next_invoice_number.
grant execute on function public.get_public_invoice(text) to anon;
grant execute on function public.get_public_invoice(text) to authenticated;
grant execute on function public.next_invoice_number(uuid) to authenticated;
