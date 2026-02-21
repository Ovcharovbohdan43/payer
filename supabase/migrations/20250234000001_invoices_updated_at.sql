-- Add updated_at column to invoices for edit tracking
alter table public.invoices
  add column if not exists updated_at timestamptz default now();
