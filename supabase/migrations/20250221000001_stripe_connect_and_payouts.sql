-- Stripe Connect: store connected account ID per user.
-- Payouts: track when Stripe pays out to user's bank (from payout.paid webhook).

alter table public.profiles
  add column if not exists stripe_connect_account_id text;

comment on column public.profiles.stripe_connect_account_id is 'Stripe Connect Express account ID (acct_xxx). Null = not connected.';

create index if not exists idx_profiles_stripe_connect_account
  on public.profiles (stripe_connect_account_id)
  where stripe_connect_account_id is not null;

-- Payouts: Stripe sends payout to user's bank (payout.paid event).
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_payout_id text not null unique,
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null,
  status text not null default 'paid',
  arrival_date date,
  created_at timestamptz not null default now()
);

alter table public.payouts enable row level security;

create policy "Users can view own payouts"
  on public.payouts for select
  using (auth.uid() = user_id);

create index if not exists idx_payouts_user_id on public.payouts (user_id);
create index if not exists idx_payouts_created_at on public.payouts (user_id, created_at desc);

comment on table public.payouts is 'Stripe payouts to user bank (from payout.paid webhook). Read-only for users.';
