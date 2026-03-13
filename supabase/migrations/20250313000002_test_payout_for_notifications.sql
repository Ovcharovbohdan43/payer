-- Test payout record (successful payout for dashboard/display).
insert into public.payouts (
  user_id,
  stripe_payout_id,
  amount_cents,
  currency,
  status,
  arrival_date
) values (
  'aff8420c-b31c-495d-a8a6-8d28e577707c'::uuid,
  'po_test_002',
  2500,
  'GBP',
  'paid',
  current_date + 2
) on conflict (stripe_payout_id) do nothing;
