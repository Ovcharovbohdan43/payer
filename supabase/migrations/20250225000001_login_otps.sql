-- Login OTP: 5-digit code sent after password sign-in, valid 5 min

create table if not exists public.login_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_login_otps_user_expires
  on public.login_otps (user_id, expires_at);

-- RLS: users can manage own OTPs (insert on login, select/delete on verify)
alter table public.login_otps enable row level security;

create policy "Users manage own OTPs"
  on public.login_otps for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.login_otps is 'OTP codes for password login verification; 5 digits, 5 min expiry';
