-- Platform-wide activity log for admin monitoring (auth, pages, billing, admin).

create table if not exists public.platform_activity_log (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  action text not null,
  user_id uuid references public.profiles (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  path text,
  ip_address text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_activity_log_created_at
  on public.platform_activity_log (created_at desc);
create index if not exists idx_platform_activity_log_user_id
  on public.platform_activity_log (user_id);
create index if not exists idx_platform_activity_log_category
  on public.platform_activity_log (category);

alter table public.platform_activity_log enable row level security;

-- Callable from middleware and server actions (sets user_id from auth.uid()).
create or replace function public.log_platform_activity(
  p_category text,
  p_action text,
  p_path text default null,
  p_ip text default null,
  p_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_category is null or trim(p_category) = '' or p_action is null or trim(p_action) = '' then
    return;
  end if;
  insert into public.platform_activity_log (
    category,
    action,
    user_id,
    path,
    ip_address,
    meta
  )
  values (
    left(trim(p_category), 50),
    left(trim(p_action), 80),
    auth.uid(),
    nullif(left(trim(coalesce(p_path, '')), 500), ''),
    nullif(left(trim(coalesce(p_ip, '')), 45), ''),
    coalesce(p_meta, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.log_platform_activity(text, text, text, text, jsonb) from public;
grant execute on function public.log_platform_activity(text, text, text, text, jsonb) to anon, authenticated;

comment on table public.platform_activity_log is
  'Site activity for admin live feed: page views, auth, checkout, etc.';
