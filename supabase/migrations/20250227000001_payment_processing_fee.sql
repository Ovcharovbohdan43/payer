-- Payment processing fee: Stripe 1.5% + fixed. When enabled, added to invoice total.

alter table public.invoices
  add column if not exists payment_processing_fee_included boolean not null default false,
  add column if not exists payment_processing_fee_cents bigint;

comment on column public.invoices.payment_processing_fee_included is 'If true, amount_cents includes payment processing fee (1.5% + fixed)';
comment on column public.invoices.payment_processing_fee_cents is 'Fee amount in cents; shown in PDF when payment_processing_fee_included';

-- Update get_public_invoice for PDF
drop function if exists public.get_public_invoice(text);

create or replace function public.get_public_invoice(p_public_id text)
returns table (
  business_name text,
  invoice_number text,
  amount_cents bigint,
  currency text,
  due_date date,
  status text,
  client_name text,
  vat_included boolean,
  payment_processing_fee_included boolean,
  payment_processing_fee_cents bigint,
  line_items jsonb
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
    i.due_date,
    i.status::text,
    i.client_name,
    i.vat_included,
    coalesce(i.payment_processing_fee_included, false),
    i.payment_processing_fee_cents,
    coalesce(
      (select jsonb_agg(
        jsonb_build_object(
          'description', ili.description,
          'amount_cents', ili.amount_cents
        ) order by ili.sort_order, ili.id
      )
      from public.invoice_line_items ili
      where ili.invoice_id = i.id),
      '[]'::jsonb
    ) as line_items
  from public.invoices i
  join public.profiles p on p.id = i.user_id
  where i.public_id = p_public_id
    and i.status != 'void'
  limit 1;
$$;
