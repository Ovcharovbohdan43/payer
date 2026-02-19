-- Track when user set a password (for Settings UI: show masked view vs form)

alter table public.profiles
  add column if not exists password_set_at timestamptz;

comment on column public.profiles.password_set_at is 'When user set password via Settings; used to show masked view instead of form';
