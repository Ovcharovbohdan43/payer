-- Recurring invoices: auto-generate and send at specified interval.
-- Template = first invoice with recurring=true, recurring_parent_id is null.
-- Generated invoices have recurring_parent_id = template id.

alter table public.invoices
  add column if not exists recurring boolean not null default false,
  add column if not exists recurring_interval text check (recurring_interval in ('minutes', 'days')),
  add column if not exists recurring_interval_value int check (recurring_interval_value > 0),
  add column if not exists last_recurred_at timestamptz,
  add column if not exists recurring_parent_id uuid references public.invoices(id);

comment on column public.invoices.recurring is 'If true, this invoice is a template; new invoices are auto-generated at recurring_interval.';
comment on column public.invoices.recurring_interval is 'minutes (for testing) or days';
comment on column public.invoices.recurring_interval_value is 'Every X minutes or X days';
comment on column public.invoices.last_recurred_at is 'When we last generated a child invoice';
comment on column public.invoices.recurring_parent_id is 'If set, this invoice was auto-generated from the parent (template)';

create index if not exists idx_invoices_recurring_parent
  on public.invoices (recurring_parent_id) where recurring_parent_id is not null;

create index if not exists idx_invoices_recurring_template
  on public.invoices (recurring, last_recurred_at, sent_at)
  where recurring = true and recurring_parent_id is null;
