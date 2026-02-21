-- Offers (quotes/estimates) before they become invoices.
-- Flow: create → send link → client views → accept (payment) or decline (with comment).

create type public.offer_status as enum (
  'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  client_name text not null,
  client_email text,
  number text not null,
  public_id text not null unique,
  status public.offer_status not null default 'draft',
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null default 'USD',
  notes text,
  due_date date,
  vat_included boolean default false,
  discount_type text check (discount_type in ('percent', 'fixed')),
  discount_value bigint,
  decline_comment text,
  invoice_id uuid references public.invoices (id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  expires_at date,
  unique (user_id, number)
);

alter table public.offers enable row level security;

create policy "Users can manage own offers"
  on public.offers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_offers_user_id on public.offers (user_id);
create index if not exists idx_offers_public_id on public.offers (public_id);
create index if not exists idx_offers_status on public.offers (user_id, status);

comment on table public.offers is 'Offers/estimates; client can accept (→ invoice + payment) or decline (with comment).';

-- Offer line items (same structure as invoice_line_items)
create table if not exists public.offer_line_items (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  description text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  discount_percent int default 0 check (discount_percent >= 0 and discount_percent <= 100),
  sort_order int not null default 0
);

alter table public.offer_line_items enable row level security;

create policy "Users can manage line items of own offers"
  on public.offer_line_items for all
  using (
    exists (
      select 1 from public.offers o
      where o.id = offer_id and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.offers o
      where o.id = offer_id and o.user_id = auth.uid()
    )
  );

create index if not exists idx_offer_line_items_offer_id on public.offer_line_items (offer_id);
