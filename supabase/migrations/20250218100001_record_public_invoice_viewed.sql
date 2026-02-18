-- Record first view of public invoice: set viewed_at and status to 'viewed' when status = 'sent'.
-- Callable by anon (public page load). Idempotent: only updates if viewed_at is null.

create or replace function public.record_public_invoice_viewed(p_public_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.invoices
  set viewed_at = now(),
      status = 'viewed'
  where public_id = p_public_id
    and viewed_at is null
    and status = 'sent';
end;
$$;

comment on function public.record_public_invoice_viewed is 'Records first view of invoice by public_id; only when status is sent. Call from public page.';

grant execute on function public.record_public_invoice_viewed(text) to anon;
grant execute on function public.record_public_invoice_viewed(text) to authenticated;
