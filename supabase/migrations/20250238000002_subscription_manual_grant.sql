-- Manual Pro grant/revoke for admins (run from Supabase SQL Editor).
-- Use when you want to give someone Pro access without Stripe payment.

create or replace function public.grant_pro_subscription(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set subscription_status = 'active'
  where id = p_user_id;
  if not found then
    raise exception 'Profile not found for user_id %', p_user_id;
  end if;
end;
$$;

create or replace function public.revoke_pro_subscription(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set subscription_status = 'free'
  where id = p_user_id;
  if not found then
    raise exception 'Profile not found for user_id %', p_user_id;
  end if;
end;
$$;

comment on function public.grant_pro_subscription(uuid) is 'Manually grant Pro (unlimited invoices). Run from Supabase SQL Editor.';
comment on function public.revoke_pro_subscription(uuid) is 'Manually revoke Pro, set back to Free. Run from Supabase SQL Editor.';
