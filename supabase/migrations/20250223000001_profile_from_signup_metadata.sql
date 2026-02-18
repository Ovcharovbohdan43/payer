-- Use business_name from signUp user_metadata when creating profile (for password registration flow)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_business_name text;
begin
  meta_business_name := new.raw_user_meta_data->>'business_name';
  insert into public.profiles (id, default_currency, business_name)
  values (new.id, 'USD', meta_business_name)
  on conflict (id) do update set
    business_name = coalesce(excluded.business_name, profiles.business_name),
    updated_at = now();
  return new;
end;
$$;
