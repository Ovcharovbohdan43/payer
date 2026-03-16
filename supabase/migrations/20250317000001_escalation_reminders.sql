-- Escalation: one overdue reminder with optional copy to owner
-- invoices: when we sent the escalation (so we only send once)
alter table public.invoices
  add column if not exists escalation_sent_at timestamptz;

comment on column public.invoices.escalation_sent_at is 'When overdue escalation reminder was sent to client (and optionally copy to owner). Sent at most once per invoice.';

-- profiles: opt-in for copy to owner on escalation (default on)
alter table public.profiles
  add column if not exists escalation_cc_owner boolean not null default true;

comment on column public.profiles.escalation_cc_owner is 'When true, send a copy of overdue escalation reminder to the account email.';
