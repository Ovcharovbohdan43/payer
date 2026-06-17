-- Account ban: restrict user access when account_status = 'banned'.
-- Set via Supabase SQL Editor: select ban_user_account('user-uuid');
-- Or: update public.profiles set account_status = 'banned' where id = 'user-uuid';

alter table public.profiles
  add column if not exists account_status text not null default 'active'
  constraint profiles_account_status_check
    check (account_status in ('active', 'banned'));

comment on column public.profiles.account_status is
  'active = normal access; banned = account temporarily restricted (contact support)';

-- Users cannot change their own ban status via profile update.
create or replace function public.protect_profile_account_status()
returns trigger
language plpgsql
as $$
begin
  if new.account_status is distinct from old.account_status then
    if current_setting('app.allow_account_status_change', true) = 'true' then
      return new;
    end if;
    if auth.uid() = old.id then
      new.account_status := old.account_status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_account_status on public.profiles;
create trigger protect_profile_account_status
  before update on public.profiles
  for each row
  execute function public.protect_profile_account_status();

create or replace function public.ban_user_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.allow_account_status_change', 'true', true);
  update public.profiles
  set account_status = 'banned'
  where id = p_user_id;
  if not found then
    raise exception 'Profile not found for user_id %', p_user_id;
  end if;
end;
$$;

create or replace function public.unban_user_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.allow_account_status_change', 'true', true);
  update public.profiles
  set account_status = 'active'
  where id = p_user_id;
  if not found then
    raise exception 'Profile not found for user_id %', p_user_id;
  end if;
end;
$$;

revoke execute on function public.ban_user_account(uuid) from public, anon, authenticated;
revoke execute on function public.unban_user_account(uuid) from public, anon, authenticated;

comment on function public.ban_user_account(uuid) is
  'Admin: ban user account. Run from Supabase SQL Editor: select ban_user_account(''uuid'');';
comment on function public.unban_user_account(uuid) is
  'Admin: restore user account. Run from Supabase SQL Editor: select unban_user_account(''uuid'');';
