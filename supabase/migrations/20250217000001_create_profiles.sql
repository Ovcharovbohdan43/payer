-- Profiles: one per auth user. Created on first login or in onboarding.
-- Enable RLS so users can only read/update their own row.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  business_name text,
  default_currency text not null default 'USD',
  country text,
  timezone text default 'UTC',
  show_vat_fields boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Optional: trigger to create profile on signup (alternative: create in app on first load).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, default_currency)
  values (new.id, 'USD')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on table public.profiles is 'User business profile; one row per auth.users.id';
