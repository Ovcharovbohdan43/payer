-- Clients: optional contact fields for professional invoices

alter table public.clients
  add column if not exists address text,
  add column if not exists company_name text,
  add column if not exists vat_number text;

comment on column public.clients.address is 'Client address; shown in invoice PDF when set';
comment on column public.clients.company_name is 'Client company/organization name; shown in invoice PDF when set';
comment on column public.clients.vat_number is 'Client VAT number; shown in invoice PDF when set';
