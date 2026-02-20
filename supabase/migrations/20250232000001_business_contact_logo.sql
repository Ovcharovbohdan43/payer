-- Business contact & logo: address, phone, legal info, logo for invoices

alter table public.profiles
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists company_number text,
  add column if not exists vat_number text,
  add column if not exists logo_url text;

comment on column public.profiles.address is 'Business address; shown on invoices';
comment on column public.profiles.phone is 'Business phone; shown on invoices';
comment on column public.profiles.company_number is 'Registration/company number; shown on invoices';
comment on column public.profiles.vat_number is 'VAT number; shown on invoices';
comment on column public.profiles.logo_url is 'Public URL of company logo; used in app header, invoices, public page';
