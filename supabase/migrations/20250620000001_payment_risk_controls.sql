-- Payment risk controls: seller verification, limits, flags, audit trail.

alter table public.profiles
  add column if not exists business_description text,
  add column if not exists payments_enabled boolean not null default false,
  add column if not exists payments_verified_at timestamptz,
  add column if not exists payment_risk_status text not null default 'pending_verification'
    constraint profiles_payment_risk_status_check
      check (payment_risk_status in ('pending_verification', 'active', 'flagged', 'paused', 'blocked')),
  add column if not exists payment_risk_notes text,
  add column if not exists payout_hold_until timestamptz;

comment on column public.profiles.business_description is
  'What the business sells/does; required before accepting payments.';
comment on column public.profiles.payments_enabled is
  'When false, invoice Checkout is blocked until Puyer verification passes.';
comment on column public.profiles.payments_verified_at is
  'When seller payment acceptance was approved (manual or automated).';
comment on column public.profiles.payment_risk_status is
  'pending_verification | active | flagged | paused | blocked';
comment on column public.profiles.payout_hold_until is
  'Stripe payouts stay manual until this timestamp (new accounts).';

create table if not exists public.payment_risk_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  severity text not null default 'info'
    constraint payment_risk_events_severity_check
      check (severity in ('info', 'warning', 'critical')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_risk_events_user_created
  on public.payment_risk_events (user_id, created_at desc);

alter table public.payment_risk_events enable row level security;

create policy "Users can view own payment_risk_events"
  on public.payment_risk_events for select
  using (auth.uid() = user_id);

comment on table public.payment_risk_events is
  'Audit trail for seller verification, limits, and automated risk flags.';

-- Protect payment risk columns from self-service edits (same pattern as account_status).
create or replace function public.protect_profile_payment_risk()
returns trigger
language plpgsql
as $$
begin
  if new.payments_enabled is distinct from old.payments_enabled
     or new.payments_verified_at is distinct from old.payments_verified_at
     or new.payment_risk_status is distinct from old.payment_risk_status
     or new.payment_risk_notes is distinct from old.payment_risk_notes
     or new.payout_hold_until is distinct from old.payout_hold_until then
    if current_setting('app.allow_payment_risk_change', true) = 'true' then
      return new;
    end if;
    new.payments_enabled := old.payments_enabled;
    new.payments_verified_at := old.payments_verified_at;
    new.payment_risk_status := old.payment_risk_status;
    new.payment_risk_notes := old.payment_risk_notes;
    new.payout_hold_until := old.payout_hold_until;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_payment_risk on public.profiles;
create trigger protect_profile_payment_risk
  before update on public.profiles
  for each row
  execute function public.protect_profile_payment_risk();

create or replace function public.set_seller_payment_risk(
  p_user_id uuid,
  p_status text,
  p_payments_enabled boolean,
  p_note text default null,
  p_payout_hold_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('pending_verification', 'active', 'flagged', 'paused', 'blocked') then
    raise exception 'Invalid payment_risk_status';
  end if;

  perform set_config('app.allow_payment_risk_change', 'true', true);

  update public.profiles
  set
    payment_risk_status = p_status,
    payments_enabled = p_payments_enabled,
    payment_risk_notes = coalesce(p_note, payment_risk_notes),
    payments_verified_at = case
      when p_payments_enabled and p_status = 'active'
        then coalesce(payments_verified_at, now())
      else payments_verified_at
    end,
    payout_hold_until = coalesce(p_payout_hold_until, payout_hold_until),
    updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.set_seller_payment_risk(uuid, text, boolean, text, timestamptz) from public;
grant execute on function public.set_seller_payment_risk(uuid, text, boolean, text, timestamptz) to service_role;

create or replace function public.approve_seller_payments(p_user_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.allow_payment_risk_change', 'true', true);
  perform set_config('app.allow_invoice_limit_change', 'true', true);

  update public.profiles
  set
    payment_risk_status = 'active',
    payments_enabled = true,
    payments_verified_at = coalesce(payments_verified_at, now()),
    payment_risk_notes = coalesce(p_note, payment_risk_notes),
    invoice_creation_reviewed_at = coalesce(invoice_creation_reviewed_at, now()),
    updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.approve_seller_payments(uuid, text) from public;
grant execute on function public.approve_seller_payments(uuid, text) to service_role;

create or replace function public.flag_seller_payments(
  p_user_id uuid,
  p_reason text,
  p_status text default 'flagged'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('flagged', 'paused', 'blocked') then
    raise exception 'Invalid flag status';
  end if;

  perform set_config('app.allow_payment_risk_change', 'true', true);

  update public.profiles
  set
    payment_risk_status = p_status,
    payments_enabled = false,
    payment_risk_notes = p_reason,
    updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.flag_seller_payments(uuid, text, text) from public;
grant execute on function public.flag_seller_payments(uuid, text, text) to service_role;

-- Grandfather existing connected sellers.
update public.profiles
set
  payments_enabled = true,
  payment_risk_status = 'active',
  payments_verified_at = coalesce(payments_verified_at, now())
where stripe_connect_account_id is not null
  and coalesce(onboarding_completed, false) = true
  and account_status = 'active';
