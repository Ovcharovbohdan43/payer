-- Discounts: per-line and invoice-level

-- Line item discount (percent 0-100)
alter table public.invoice_line_items
  add column if not exists discount_percent smallint not null default 0
  check (discount_percent >= 0 and discount_percent <= 100);

comment on column public.invoice_line_items.discount_percent is 'Discount % applied to this line (0-100)';

-- Invoice-level discount
alter table public.invoices
  add column if not exists discount_type text
  check (discount_type is null or discount_type in ('percent', 'fixed'));

alter table public.invoices
  add column if not exists discount_value numeric
  check (discount_value is null or discount_value >= 0);

comment on column public.invoices.discount_type is 'Invoice discount type: percent (0-100) or fixed (cents)';
comment on column public.invoices.discount_value is 'Discount value: % when percent, cents when fixed';
