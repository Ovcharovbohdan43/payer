-- Admin panel: is_admin flag, site analytics, admin audit log.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'Platform admin; set only via SQL or service role. Grants access to /admin.';

-- Users cannot promote themselves to admin.
create or replace function public.protect_profile_is_admin()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    if current_setting('app.allow_is_admin_change', true) = 'true' then
      return new;
    end if;
    if auth.uid() = old.id then
      new.is_admin := old.is_admin;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_is_admin on public.profiles;
create trigger protect_profile_is_admin
  before update on public.profiles
  for each row
  execute function public.protect_profile_is_admin();

create table if not exists public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  user_id uuid references public.profiles (id) on delete set null,
  ip_address text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists idx_site_analytics_events_created_at
  on public.site_analytics_events (created_at desc);
create index if not exists idx_site_analytics_events_path
  on public.site_analytics_events (path);

alter table public.site_analytics_events enable row level security;

create table if not exists public.admin_actions_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  target_user_id uuid references public.profiles (id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_actions_log_created_at
  on public.admin_actions_log (created_at desc);
create index if not exists idx_admin_actions_log_admin_id
  on public.admin_actions_log (admin_id);

alter table public.admin_actions_log enable row level security;

-- Page view logging from middleware (anon + authenticated).
create or replace function public.log_site_page_view(
  p_path text,
  p_ip text default null,
  p_referrer text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_path is null or trim(p_path) = '' then
    return;
  end if;
  insert into public.site_analytics_events (path, user_id, ip_address, referrer)
  values (
    left(trim(p_path), 500),
    auth.uid(),
    nullif(left(trim(coalesce(p_ip, '')), 45), ''),
    nullif(left(trim(coalesce(p_referrer, '')), 500), '')
  );
end;
$$;

revoke all on function public.log_site_page_view(text, text, text) from public;
grant execute on function public.log_site_page_view(text, text, text) to anon, authenticated;

-- Helper to set first admin (SQL Editor only).
create or replace function public.set_user_admin(p_user_id uuid, p_is_admin boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.allow_is_admin_change', 'true', true);
  update public.profiles
  set is_admin = p_is_admin
  where id = p_user_id;
  if not found then
    raise exception 'Profile not found for user_id %', p_user_id;
  end if;
end;
$$;

revoke execute on function public.set_user_admin(uuid, boolean) from public, anon, authenticated;

comment on function public.set_user_admin(uuid, boolean) is
  'SQL Editor: grant or revoke platform admin. select set_user_admin(''uuid'', true);';
