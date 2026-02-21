-- Add client contact fields to get_public_invoice (for PDF when client has address/company/VAT)

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
  client_email text,
  client_address text,
  client_phone text,
  client_company_name text,
  client_vat_number text,
  vat_included boolean,
  payment_processing_fee_included boolean,
  payment_processing_fee_cents bigint,
  line_items jsonb,
  logo_url text,
  address text,
  phone text,
  company_number text,
  vat_number text,
  discount_type text,
  discount_value numeric
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
    i.client_email,
    c.address as client_address,
    c.phone as client_phone,
    c.company_name as client_company_name,
    c.vat_number as client_vat_number,
    i.vat_included,
    coalesce(i.payment_processing_fee_included, false),
    i.payment_processing_fee_cents,
    coalesce(
      (select jsonb_agg(
        jsonb_build_object(
          'description', ili.description,
          'amount_cents', ili.amount_cents,
          'discount_percent', coalesce(ili.discount_percent, 0)
        ) order by ili.sort_order, ili.id
      )
      from public.invoice_line_items ili
      where ili.invoice_id = i.id),
      '[]'::jsonb
    ) as line_items,
    p.logo_url,
    p.address,
    p.phone,
    p.company_number,
    p.vat_number,
    i.discount_type,
    i.discount_value
  from public.invoices i
  join public.profiles p on p.id = i.user_id
  left join public.clients c on c.id = i.client_id
  where i.public_id = p_public_id
    and i.status != 'void'
  limit 1;
$$;
