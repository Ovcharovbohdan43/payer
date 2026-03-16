-- Invoice templates: saved sets of line items for one-click apply to new invoices.

create table if not exists public.invoice_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.invoice_templates enable row level security;

create policy "Users can manage own invoice templates"
  on public.invoice_templates for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists idx_invoice_templates_user_id
  on public.invoice_templates (user_id);

comment on table public.invoice_templates is 'Saved invoice line-item templates (name + items) for quick apply on new invoice.';

-- Template line items (same shape as invoice_line_items, without invoice_id).
create table if not exists public.invoice_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.invoice_templates (id) on delete cascade,
  description text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  discount_percent smallint not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  sort_order int not null default 0
);

alter table public.invoice_template_items enable row level security;

create policy "Users can manage items of own templates"
  on public.invoice_template_items for all
  using (
    exists (
      select 1 from public.invoice_templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.invoice_templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
  );

create index if not exists idx_invoice_template_items_template_id
  on public.invoice_template_items (template_id);

comment on table public.invoice_template_items is 'Line items belonging to an invoice template.';
