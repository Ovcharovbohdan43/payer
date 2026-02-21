-- Subscription: store subscription status and Stripe customer ID for platform billing.
-- Subscription is charged to platform Stripe account (not Connect).

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text not null default 'free' check (
    subscription_status in ('free', 'active', 'canceled', 'past_due', 'trialing')
  );

create index if not exists idx_profiles_stripe_customer_id
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

comment on column public.profiles.stripe_customer_id is 'Stripe Customer ID for subscription billing (platform, not Connect)';
comment on column public.profiles.subscription_status is 'Subscription status: free, active, canceled, past_due, trialing';
