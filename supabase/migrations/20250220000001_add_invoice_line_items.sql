-- Invoice line items: multiple services per invoice.

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  sort_order int not null default 0
);

alter table public.invoice_line_items enable row level security;

create policy "Users can manage line items of own invoices"
  on public.invoice_line_items for all
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = auth.uid()
    )
  );

create index if not exists idx_invoice_line_items_invoice_id
  on public.invoice_line_items (invoice_id);

comment on table public.invoice_line_items is 'Line items (services) per invoice; amount_cents per item.';

-- Migrate existing invoices: one line item from description + amount_cents
insert into public.invoice_line_items (invoice_id, description, amount_cents, sort_order)
select
  id,
  coalesce(description, 'Invoice payment'),
  amount_cents,
  0
from public.invoices
where not exists (
  select 1 from public.invoice_line_items ili where ili.invoice_id = invoices.id
);

-- Update get_public_invoice to return line items as JSON
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
