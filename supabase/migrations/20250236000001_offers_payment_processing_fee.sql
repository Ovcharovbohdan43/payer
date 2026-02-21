-- Add payment processing fee to offers (mirrors invoices)
alter table public.offers
  add column if not exists payment_processing_fee_included boolean not null default false,
  add column if not exists payment_processing_fee_cents bigint;

comment on column public.offers.payment_processing_fee_included is 'If true, amount_cents includes payment processing fee (1.5% + fixed)';
comment on column public.offers.payment_processing_fee_cents is 'Fee amount in cents when payment_processing_fee_included';
