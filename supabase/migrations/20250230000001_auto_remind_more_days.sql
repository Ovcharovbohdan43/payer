-- Auto-remind: add support for 2, 5, 10, 14 days (user picks schedule)

alter table public.invoices
  add column if not exists reminder_2d_sent_at timestamptz,
  add column if not exists reminder_5d_sent_at timestamptz,
  add column if not exists reminder_10d_sent_at timestamptz,
  add column if not exists reminder_14d_sent_at timestamptz;

comment on column public.invoices.reminder_2d_sent_at is 'When 2-day reminder was sent';
comment on column public.invoices.reminder_5d_sent_at is 'When 5-day reminder was sent';
comment on column public.invoices.reminder_10d_sent_at is 'When 10-day reminder was sent';
comment on column public.invoices.reminder_14d_sent_at is 'When 14-day reminder was sent';

comment on column public.invoices.auto_remind_days is 'Comma-separated days after sent_at: 1,2,3,5,7,10,14';
