-- Auto-reminders: schedule (1, 3, 7 days after sent) and track which were sent

alter table public.invoices
  add column if not exists auto_remind_enabled boolean not null default false,
  add column if not exists auto_remind_days text not null default '1,3,7',
  add column if not exists reminder_1d_sent_at timestamptz,
  add column if not exists reminder_3d_sent_at timestamptz,
  add column if not exists reminder_7d_sent_at timestamptz;

comment on column public.invoices.auto_remind_enabled is 'If true, send reminders at days specified in auto_remind_days (e.g. 1,3,7) after sent_at.';
comment on column public.invoices.auto_remind_days is 'Comma-separated days after sent_at to send reminder: 1,3,7';
comment on column public.invoices.reminder_1d_sent_at is 'When 1-day reminder was sent';
comment on column public.invoices.reminder_3d_sent_at is 'When 3-day reminder was sent';
comment on column public.invoices.reminder_7d_sent_at is 'When 7-day reminder was sent';
