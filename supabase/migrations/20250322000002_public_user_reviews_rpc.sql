-- Public read-only access to user reviews for landing page and Rate Us community list.
-- Returns only safe fields (no user_id).

create or replace function public.get_public_user_reviews()
returns table (
  id uuid,
  rating smallint,
  comment text,
  created_at timestamptz,
  updated_at timestamptz,
  business_name text,
  logo_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    r.updated_at,
    coalesce(nullif(trim(p.business_name), ''), 'Puyer user') as business_name,
    nullif(trim(p.logo_url), '') as logo_url
  from public.user_reviews r
  inner join public.profiles p on p.id = r.user_id
  order by r.updated_at desc, r.created_at desc;
$$;

comment on function public.get_public_user_reviews() is
  'Public list of user reviews with business name and logo for landing and Rate Us pages.';

grant execute on function public.get_public_user_reviews() to anon, authenticated;
