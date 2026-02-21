-- RPC: next offer number (OFF-YYYY-NNNNNN)
create or replace function public.next_offer_number(p_user_id uuid)
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
  from public.offers
  where user_id = p_user_id
    and number like 'OFF-' || current_year || '-%';
  return 'OFF-' || current_year || '-' || lpad(next_seq::text, 6, '0');
end;
$$;

grant execute on function public.next_offer_number(uuid) to authenticated;

-- RPC: get public offer (anon + authenticated)
create or replace function public.get_public_offer(p_public_id text)
returns table (
  business_name text,
  offer_number text,
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
  invoice_public_id text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.business_name,
    o.number as offer_number,
    o.amount_cents,
    o.currency,
    o.due_date,
    o.status::text,
    o.client_name,
    coalesce(o.vat_included, false),
    coalesce(
      (select jsonb_agg(
        jsonb_build_object(
          'description', oli.description,
          'amount_cents', oli.amount_cents,
          'discount_percent', coalesce(oli.discount_percent, 0)
        ) order by oli.sort_order, oli.id
      )
      from public.offer_line_items oli
      where oli.offer_id = o.id),
      '[]'::jsonb
    ) as line_items,
    p.logo_url,
    p.address,
    p.phone,
    p.company_number,
    p.vat_number,
    (select i.public_id from public.invoices i where i.id = o.invoice_id limit 1) as invoice_public_id
  from public.offers o
  join public.profiles p on p.id = o.user_id
  where o.public_id = p_public_id
    and o.status != 'expired'
  limit 1;
$$;

grant execute on function public.get_public_offer(text) to anon;
grant execute on function public.get_public_offer(text) to authenticated;

-- RPC: record public offer viewed (sent → viewed)
create or replace function public.record_public_offer_viewed(p_public_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.offers
  set viewed_at = now(),
      status = 'viewed'
  where public_id = p_public_id
    and viewed_at is null
    and status = 'sent';
end;
$$;

grant execute on function public.record_public_offer_viewed(text) to anon;
grant execute on function public.record_public_offer_viewed(text) to authenticated;
