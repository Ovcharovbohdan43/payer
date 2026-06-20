-- Allow clearing payment_risk_notes by passing an empty string to set_seller_payment_risk.

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
    payment_risk_notes = case
      when p_note = '' then null
      when p_note is not null then p_note
      else payment_risk_notes
    end,
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

-- Clean up profiles incorrectly paused during incomplete Stripe onboarding.
update public.profiles
set
  payment_risk_status = case when payments_enabled then 'active' else 'pending_verification' end,
  payment_risk_notes = null,
  updated_at = now()
where payment_risk_status = 'paused'
  and payment_risk_notes like 'stripe_account_warning%';
