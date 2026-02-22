-- Demo invoices: ephemeral, rate-limited, for landing page "Try now" flow.
-- No user_id; rate limit by IP. Auto-expire after 24h.

create table if not exists public.demo_invoices (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  business_name text not null default 'Demo Business',
  client_name text not null,
  client_email text,
  amount_cents bigint not null check (amount_cents >= 100),
  currency text not null default 'GBP',
  vat_included boolean not null default false,
  due_date date,
  line_items jsonb not null default '[]'::jsonb
);

create index if not exists idx_demo_invoices_public_id on public.demo_invoices (public_id);
create index if not exists idx_demo_invoices_ip_created on public.demo_invoices (ip_hash, created_at desc);
create index if not exists idx_demo_invoices_expires on public.demo_invoices (expires_at);

-- RPC: fetch demo invoice by public_id (anon-readable)
create or replace function public.get_demo_public_invoice(p_public_id text)
returns table (
  business_name text,
  invoice_number text,
  amount_cents bigint,
  currency text,
  due_date date,
  status text,
  client_name text,
  vat_included boolean,
  line_items jsonb,
  logo_url text,
  address text,
  phone text,
  company_number text,
  vat_number text,
  discount_type text,
  discount_value numeric,
  client_email text,
  client_address text,
  client_phone text,
  client_company_name text,
  client_vat_number text,
  payment_processing_fee_included boolean,
  payment_processing_fee_cents bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    d.business_name,
    'DEMO-' || upper(substring(d.public_id::text, 1, 8)) as invoice_number,
    d.amount_cents,
    d.currency,
    d.due_date,
    'sent'::text as status,
    d.client_name,
    d.vat_included,
    d.line_items,
    null::text as logo_url,
    null::text as address,
    null::text as phone,
    null::text as company_number,
    null::text as vat_number,
    null::text as discount_type,
    null::numeric as discount_value,
    d.client_email,
    null::text as client_address,
    null::text as client_phone,
    null::text as client_company_name,
    null::text as client_vat_number,
    false as payment_processing_fee_included,
    null::bigint as payment_processing_fee_cents
  from public.demo_invoices d
  where d.public_id = p_public_id
    and d.expires_at > now()
  limit 1;
$$;

grant execute on function public.get_demo_public_invoice(text) to anon;
grant execute on function public.get_demo_public_invoice(text) to authenticated;

comment on table public.demo_invoices is 'Ephemeral demo invoices for "Try now" flow; rate limited by IP, expire after 24h.';
