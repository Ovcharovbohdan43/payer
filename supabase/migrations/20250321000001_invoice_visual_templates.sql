-- User-defined visual invoice templates + per-invoice design config snapshot.
-- Service line-item templates remain in invoice_templates.

create table if not exists public.invoice_visual_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200),
  config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoice_visual_templates_user_id
  on public.invoice_visual_templates (user_id);

comment on table public.invoice_visual_templates is
  'Saved visual invoice design configs (colors, header style, visibility toggles).';

alter table public.invoice_visual_templates enable row level security;

create policy "Users can manage own invoice visual templates"
  on public.invoice_visual_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.profiles
  add column if not exists default_invoice_visual_template_id uuid;

alter table public.profiles
  drop constraint if exists profiles_default_invoice_visual_template_id_fkey;

alter table public.profiles
  add constraint profiles_default_invoice_visual_template_id_fkey
  foreign key (default_invoice_visual_template_id)
  references public.invoice_visual_templates (id)
  on delete set null;

alter table public.invoices
  add column if not exists invoice_design_config jsonb;

comment on column public.profiles.default_invoice_visual_template_id is
  'Optional saved visual template used as default for new invoices.';

comment on column public.invoices.invoice_design_config is
  'Snapshot of visual invoice design config for PDF, public page, and emails.';

drop function if exists public.get_public_invoice(text);

create or replace function public.get_public_invoice(p_public_id text)
returns table (
  business_name text,
  invoice_number text,
  invoice_design text,
  invoice_design_config jsonb,
  amount_cents bigint,
  currency text,
  due_date date,
  status text,
  client_name text,
  client_email text,
  client_address text,
  client_phone text,
  client_company_name text,
  client_vat_number text,
  vat_included boolean,
  payment_processing_fee_included boolean,
  payment_processing_fee_cents bigint,
  line_items jsonb,
  logo_url text,
  address text,
  phone text,
  company_number text,
  vat_number text,
  discount_type text,
  discount_value numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.business_name,
    i.number as invoice_number,
    coalesce(i.invoice_design, p.default_invoice_design, 'classic') as invoice_design,
    i.invoice_design_config,
    i.amount_cents,
    i.currency,
    i.due_date,
    i.status::text,
    i.client_name,
    i.client_email,
    c.address as client_address,
    c.phone as client_phone,
    c.company_name as client_company_name,
    c.vat_number as client_vat_number,
    i.vat_included,
    coalesce(i.payment_processing_fee_included, false),
    i.payment_processing_fee_cents,
    coalesce(
      (select jsonb_agg(
        jsonb_build_object(
          'description', ili.description,
          'amount_cents', ili.amount_cents,
          'discount_percent', coalesce(ili.discount_percent, 0)
        ) order by ili.sort_order, ili.id
      )
      from public.invoice_line_items ili
      where ili.invoice_id = i.id),
      '[]'::jsonb
    ) as line_items,
    p.logo_url,
    p.address,
    p.phone,
    p.company_number,
    p.vat_number,
    i.discount_type,
    i.discount_value
  from public.invoices i
  join public.profiles p on p.id = i.user_id
  left join lateral (
    select cl.address, cl.phone, cl.company_name, cl.vat_number
    from public.clients cl
    where cl.user_id = i.user_id
      and (
        cl.id = i.client_id
        or (i.client_id is null and nullif(trim(i.client_email), '') is not null and cl.email = i.client_email)
      )
    order by case when cl.id = i.client_id then 0 else 1 end
    limit 1
  ) c on true
  where i.public_id = p_public_id
    and i.status != 'void'
  limit 1;
$$;

grant execute on function public.get_public_invoice(text) to anon, authenticated;
