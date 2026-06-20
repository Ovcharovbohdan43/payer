-- Populate profile names from OAuth metadata; never use full_name as business_name.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_business_name text;
  meta_full_name text;
  meta_first_name text;
  meta_last_name text;
  name_parts text[];
begin
  meta_business_name := nullif(trim(new.raw_user_meta_data->>'business_name'), '');
  meta_first_name := nullif(trim(new.raw_user_meta_data->>'given_name'), '');
  meta_last_name := nullif(trim(new.raw_user_meta_data->>'family_name'), '');

  if meta_first_name is null then
    meta_first_name := nullif(trim(new.raw_user_meta_data->>'first_name'), '');
  end if;
  if meta_last_name is null then
    meta_last_name := nullif(trim(new.raw_user_meta_data->>'last_name'), '');
  end if;

  if meta_first_name is null or meta_last_name is null then
    meta_full_name := nullif(trim(coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    )), '');
    if meta_full_name is not null then
      name_parts := regexp_split_to_array(meta_full_name, '\s+');
      if meta_first_name is null and array_length(name_parts, 1) >= 1 then
        meta_first_name := name_parts[1];
      end if;
      if meta_last_name is null and array_length(name_parts, 1) >= 2 then
        meta_last_name := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
      end if;
    end if;
  end if;

  insert into public.profiles (
    id,
    default_currency,
    business_name,
    first_name,
    last_name,
    onboarding_completed
  )
  values (
    new.id,
    'USD',
    meta_business_name,
    meta_first_name,
    meta_last_name,
    false
  )
  on conflict (id) do update set
    business_name = coalesce(excluded.business_name, profiles.business_name),
    first_name = coalesce(profiles.first_name, excluded.first_name),
    last_name = coalesce(profiles.last_name, excluded.last_name),
    updated_at = now();

  return new;
end;
$$;

-- Google/OAuth users with empty business name should finish onboarding.
update public.profiles
set onboarding_completed = false
where onboarding_completed = true
  and (
    business_name is null
    or trim(business_name) = ''
    or trim(business_name) in ('-', '—', '_', '.')
  );
