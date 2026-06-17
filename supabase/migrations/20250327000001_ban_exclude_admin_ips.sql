-- Ban: do not blocklist IPs also used by platform admins (e.g. after impersonation).
-- Helper to unblock a single IP from SQL Editor.

create or replace function public.check_admin_email(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    inner join auth.users u on u.id = p.id
    where p.is_admin = true
      and lower(trim(u.email)) = lower(trim(p_email))
  );
$$;

revoke all on function public.check_admin_email(text) from public;
grant execute on function public.check_admin_email(text) to anon, authenticated;

create or replace function public.ban_user_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from auth.users where id = p_user_id;

  perform set_config('app.allow_account_status_change', 'true', true);

  update public.profiles
  set
    account_status = 'banned',
    stripe_connect_account_id_at_ban = coalesce(
      stripe_connect_account_id_at_ban,
      stripe_connect_account_id
    ),
    stripe_connect_account_id = null,
    stripe_connect_revoked_at = null
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found for user_id %', p_user_id;
  end if;

  if v_email is not null and trim(v_email) <> '' then
    insert into public.banned_emails (email, banned_user_id)
    values (lower(trim(v_email)), p_user_id)
    on conflict (email) do update
      set banned_user_id = excluded.banned_user_id,
          banned_at = now();
  end if;

  -- Skip IPs that also appear in admin users' ip logs (admin impersonation).
  insert into public.banned_ip_addresses (ip_address, banned_user_id)
  select uil.ip_address, p_user_id
  from public.user_ip_log uil
  where uil.user_id = p_user_id
    and not exists (
      select 1
      from public.user_ip_log admin_log
      inner join public.profiles ap on ap.id = admin_log.user_id
      where ap.is_admin = true
        and admin_log.ip_address = uil.ip_address
    )
  on conflict (ip_address) do update
    set banned_user_id = excluded.banned_user_id,
        banned_at = now();
end;
$$;

create or replace function public.unban_ip_address(p_ip text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.banned_ip_addresses
  where ip_address = trim(p_ip);
end;
$$;

revoke execute on function public.unban_ip_address(text) from public, anon, authenticated;

comment on function public.unban_ip_address(text) is
  'SQL Editor: remove IP from ban blocklist. select unban_ip_address(''1.2.3.4'');';
