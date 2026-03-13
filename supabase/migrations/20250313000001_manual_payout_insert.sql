-- Manual insert: first payout for user aff8420c-b31c-495d-a8a6-8d28e577707c
-- Transfer: £13.41, Mar 10, 2026. stripe_payout_id uses transfer ID as reference.

insert into public.payouts (
  user_id,
  stripe_payout_id,
  amount_cents,
  currency,
  status,
  arrival_date
) values (
  'aff8420c-b31c-495d-a8a6-8d28e577707c'::uuid,
  'tr_3T9PKSJc76DLK1Jt1zNDXa5m',
  1341,
  'GBP',
  'paid',
  '2026-03-10'
) on conflict (stripe_payout_id) do nothing;
