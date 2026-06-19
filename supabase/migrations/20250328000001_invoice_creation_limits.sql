-- Invoice creation limits: 1 invoice in first 24h for new accounts; admin can approve or restrict.

alter table public.profiles
  add column if not exists invoice_creation_limit integer,
  add column if not exists invoice_creation_reviewed_at timestamptz,
  add column if not exists invoice_creation_limit_note text;

comment on column public.profiles.invoice_creation_limit is
  'NULL=auto (max 1 invoice first 24h, then pending review). -1=unlimited. 0=blocked. N>0=max total invoices.';
comment on column public.profiles.invoice_creation_reviewed_at is
  'Set when Puyer support approves full or partial invoice access.';
comment on column public.profiles.invoice_creation_limit_note is
  'Admin note for invoice limit decision.';

create or replace function public.protect_profile_invoice_limits()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_creation_limit is distinct from old.invoice_creation_limit
     or new.invoice_creation_reviewed_at is distinct from old.invoice_creation_reviewed_at
     or new.invoice_creation_limit_note is distinct from old.invoice_creation_limit_note then
    if current_setting('app.allow_invoice_limit_change', true) = 'true' then
      return new;
    end if;
    if auth.uid() = old.id then
      new.invoice_creation_limit := old.invoice_creation_limit;
      new.invoice_creation_reviewed_at := old.invoice_creation_reviewed_at;
      new.invoice_creation_limit_note := old.invoice_creation_limit_note;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_invoice_limits on public.profiles;
create trigger protect_profile_invoice_limits
  before update on public.profiles
  for each row
  execute function public.protect_profile_invoice_limits();

-- Admin / SQL Editor: set invoice creation limit for a user.
-- p_limit: -1 unlimited, 0 blocked, N>0 max total invoices, NULL reset to auto policy
create or replace function public.set_invoice_creation_limit(
  p_user_id uuid,
  p_limit integer,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_limit is not null and p_limit < -1 then
    raise exception 'p_limit must be NULL, -1 (unlimited), 0 (blocked), or a positive integer';
  end if;

  perform set_config('app.allow_invoice_limit_change', 'true', true);

  update public.profiles
  set
    invoice_creation_limit = p_limit,
    invoice_creation_reviewed_at = case
      when p_limit is null then null
      else coalesce(invoice_creation_reviewed_at, now())
    end,
    invoice_creation_limit_note = coalesce(p_note, invoice_creation_limit_note)
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found for user_id %', p_user_id;
  end if;
end;
$$;

revoke all on function public.set_invoice_creation_limit(uuid, integer, text) from public;
grant execute on function public.set_invoice_creation_limit(uuid, integer, text) to service_role;
