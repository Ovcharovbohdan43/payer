-- Onboarding and profile: first name, last name, website, company type, completion flag

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists website text,
  add column if not exists company_type text,
  add column if not exists onboarding_completed boolean not null default false;

comment on column public.profiles.first_name is 'User first name; set in onboarding';
comment on column public.profiles.last_name is 'User last name; set in onboarding';
comment on column public.profiles.website is 'Business or personal website URL';
comment on column public.profiles.company_type is 'Industry / company type (e.g. Consulting, IT)';
comment on column public.profiles.onboarding_completed is 'True after user completed post-registration onboarding form';

-- Existing users who already have business_name are considered onboarded
update public.profiles
  set onboarding_completed = true
  where business_name is not null and business_name <> '' and (onboarding_completed is null or not onboarding_completed);
