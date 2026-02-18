-- Phase 7: Track last reminder sent for rate limiting (1 per N hours per invoice)

alter table public.invoices
  add column if not exists last_reminder_at timestamptz;

comment on column public.invoices.last_reminder_at is 'Last time a reminder email was sent; used for rate limiting.';
