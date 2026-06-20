-- Keep invoice-limit approval and payment approval in sync.

create or replace function public.set_invoice_creation_limit(
  p_user_id uuid,
  p_limit integer,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_limit is not null and p_limit < -1 then
    raise exception 'p_limit must be NULL, -1 (unlimited), 0 (blocked), or a positive integer';
  end if;

  perform set_config('app.allow_invoice_limit_change', 'true', true);
  perform set_config('app.allow_payment_risk_change', 'true', true);

  update public.profiles
  set
    invoice_creation_limit = p_limit,
    invoice_creation_reviewed_at = case
      when p_limit is null then null
      else coalesce(invoice_creation_reviewed_at, now())
    end,
    invoice_creation_limit_note = coalesce(p_note, invoice_creation_limit_note),
    payments_enabled = case
      when p_limit is not null and p_limit <> 0 then true
      else payments_enabled
    end,
    payment_risk_status = case
      when p_limit is not null and p_limit <> 0 and payment_risk_status = 'pending_verification'
        then 'active'
      else payment_risk_status
    end,
    payments_verified_at = case
      when p_limit is not null and p_limit <> 0
        then coalesce(payments_verified_at, now())
      else payments_verified_at
    end,
    updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found for user_id %', p_user_id;
  end if;
end;
$$;

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
    invoice_creation_limit = coalesce(invoice_creation_limit, -1),
    updated_at = now()
  where id = p_user_id;
end;
$$;
