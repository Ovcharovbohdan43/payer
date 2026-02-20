-- Recurring: remove minutes, only days (1, 7, 14, 21, 30).
-- Migrate any existing minutes templates to 1 day.

update public.invoices
set recurring_interval = 'days', recurring_interval_value = 1
where recurring = true and recurring_interval = 'minutes';

alter table public.invoices
  drop constraint if exists invoices_recurring_interval_check;

alter table public.invoices
  add constraint invoices_recurring_interval_check
  check (recurring_interval is null or recurring_interval = 'days');

comment on column public.invoices.recurring_interval is 'Always days; interval_value is 1, 7, 14, 21, or 30';
