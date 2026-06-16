-- User reviews (Rate Us): star rating + optional comment per user.

create table if not exists public.user_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_reviews_user_id_key unique (user_id)
);

create index if not exists idx_user_reviews_user_id
  on public.user_reviews (user_id);

create index if not exists idx_user_reviews_created_at
  on public.user_reviews (created_at desc);

comment on table public.user_reviews is
  'In-app user feedback from the Rate Us section (one review per user, updatable).';

alter table public.user_reviews enable row level security;

create policy "Users can view own reviews"
  on public.user_reviews
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own reviews"
  on public.user_reviews
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own reviews"
  on public.user_reviews
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
