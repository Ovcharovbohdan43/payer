-- Add VAT support to invoices.
-- vat_included: true = amount is gross (tax included), false = amount is net (tax added on top).
-- null = legacy invoice, do not show VAT row.

alter table public.invoices
  add column if not exists vat_included boolean default null;

comment on column public.invoices.vat_included is 'true = amount is gross (VAT included), false = amount is net (VAT added to total)';

-- Update get_public_invoice to return vat_included for PDF and public page
-- Must drop first because return type (OUT params) changed
drop function if exists public.get_public_invoice(text);

create or replace function public.get_public_invoice(p_public_id text)
returns table (
  business_name text,
  invoice_number text,
  amount_cents bigint,
  currency text,
  description text,
  due_date date,
  status text,
  client_name text,
  vat_included boolean
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
    i.client_name,
    i.vat_included
  from public.invoices i
  join public.profiles p on p.id = i.user_id
  where i.public_id = p_public_id
    and i.status != 'void'
  limit 1;
$$;
