-- Account ban enforcement: IP blocklist, email blocklist, Stripe Connect revocation tracking.

create table if not exists public.user_ip_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  ip_address text not null,
  last_seen_at timestamptz not null default now(),
  unique (user_id, ip_address)
);

create index if not exists idx_user_ip_log_user_id on public.user_ip_log (user_id);
create index if not exists idx_user_ip_log_ip on public.user_ip_log (ip_address);

alter table public.user_ip_log enable row level security;

create policy "Users can view own ip log"
  on public.user_ip_log for select
  to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.banned_ip_addresses (
  ip_address text primary key,
  banned_user_id uuid references public.profiles (id) on delete set null,
  banned_at timestamptz not null default now()
);

create index if not exists idx_banned_ip_addresses_user
  on public.banned_ip_addresses (banned_user_id);

alter table public.banned_ip_addresses enable row level security;

create table if not exists public.banned_emails (
  email text primary key,
  banned_user_id uuid references public.profiles (id) on delete set null,
  banned_at timestamptz not null default now()
);

create index if not exists idx_banned_emails_user
  on public.banned_emails (banned_user_id);

alter table public.banned_emails enable row level security;

alter table public.profiles
  add column if not exists stripe_connect_account_id_at_ban text,
  add column if not exists stripe_connect_revoked_at timestamptz;

comment on column public.profiles.stripe_connect_account_id_at_ban is
  'Stripe Connect account id snapshot when user was banned; used to revoke via API';
comment on column public.profiles.stripe_connect_revoked_at is
  'Set when Stripe Connect account was deleted/revoked after ban';

-- Log client IP for authenticated users (called from middleware).
create or replace function public.log_user_ip(p_ip text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_ip is null or trim(p_ip) = '' then
    return;
  end if;
  insert into public.user_ip_log (user_id, ip_address, last_seen_at)
  values (auth.uid(), trim(p_ip), now())
  on conflict (user_id, ip_address) do update
    set last_seen_at = excluded.last_seen_at;
end;
$$;

revoke all on function public.log_user_ip(text) from public;
grant execute on function public.log_user_ip(text) to authenticated;

-- Public ban checks for middleware and signup (boolean only).
create or replace function public.check_ip_banned(p_ip text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.banned_ip_addresses
    where ip_address = trim(p_ip)
  );
$$;

revoke all on function public.check_ip_banned(text) from public;
grant execute on function public.check_ip_banned(text) to anon, authenticated;

create or replace function public.check_email_banned(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.banned_emails
    where email = lower(trim(p_email))
  );
$$;

revoke all on function public.check_email_banned(text) from public;
grant execute on function public.check_email_banned(text) to anon, authenticated;

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

  insert into public.banned_ip_addresses (ip_address, banned_user_id)
  select ip_address, p_user_id
  from public.user_ip_log
  where user_id = p_user_id
  on conflict (ip_address) do update
    set banned_user_id = excluded.banned_user_id,
        banned_at = now();
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

  delete from public.banned_emails where banned_user_id = p_user_id;
  delete from public.banned_ip_addresses where banned_user_id = p_user_id;
end;
$$;

revoke execute on function public.ban_user_account(uuid) from public, anon, authenticated;
revoke execute on function public.unban_user_account(uuid) from public, anon, authenticated;

comment on function public.ban_user_account(uuid) is
  'Admin: ban user, blocklist email/IPs, detach Stripe Connect id (API revoke via cron).';
comment on function public.unban_user_account(uuid) is
  'Admin: restore account and remove email/IP blocklist entries for this user.';
