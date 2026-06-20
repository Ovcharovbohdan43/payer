# Payment risk & seller verification

Puyer limits fraud and prohibited-goods risk before sellers can accept invoice payments via Stripe Connect.

## Platform liability (Stripe Connect)

New connected accounts are created with:

- `controller.fees.payer = account` — **sellers pay Stripe processing fees**, not Puyer
- `controller.losses.payments = stripe` — **Stripe** is liable for connected-account payment losses (not the platform)
- Direct charges only (no `transfer_data` / destination charges)

See [STRIPE_CONNECT.md](./STRIPE_CONNECT.md).

## Seller verification (before payments)

New sellers default to `payments_enabled = false` and `payment_risk_status = pending_verification`.

Required before **Connect Stripe** and before **Checkout** accepts payment:

| Check | Source |
|--------|--------|
| Email confirmed | Supabase Auth `email_confirmed_at` |
| Onboarding complete | `profiles.onboarding_completed` |
| Name, phone, business name | Profile |
| Business description (≥20 chars) | `profiles.business_description` |
| Website **or** industry | `website` / `company_type` |
| Country + currency match | `country` + `default_currency` |
| No prohibited keywords | Automated scan on description, website, company type |

**Admin approval:** In Admin → User → *Payment risk & verification* → **Approve payments**. This sets `payments_enabled`, `payment_risk_status = active`, and marks invoice review complete.

Existing connected sellers (before this migration) are grandfathered as `active`.

## New account limits (first 30 days after verification)

Configurable via env:

| Variable | Default |
|----------|---------|
| `PUYER_NEW_SELLER_DAILY_LIMIT_MAJOR` | 100 (£/€/$ total per UTC day) |
| `PUYER_NEW_SELLER_DAILY_MAX_PAYMENTS` | 5 |
| `PUYER_NEW_SELLER_PAYOUT_HOLD_DAYS` | 14 |
| `PUYER_NEW_SELLER_PERIOD_DAYS` | 30 |

- Stripe payouts are **manual** until `payout_hold_until` (cron releases to daily when hold expires and account is active).
- Checkout enforces daily volume and payment count.

## Automatic risk rules

After each successful invoice payment, and on profile updates, the system may **flag** the seller (`payment_risk_status = flagged|paused`, `payments_enabled = false`) and pause Stripe payouts when:

- 3+ payments of the same amount in 24h
- 3+ payments within 1 hour of signup
- Invoice currency mismatches profile currency
- Prohibited keywords in business text
- Stripe `account.updated` with restrictions / disabled charges
- `charge.dispute.created`

Flagged accounts require admin review.

## Webhooks to enable (Connect endpoint)

Add to Connect webhook listener:

- `account.updated`
- `charge.dispute.created`
- `charge.dispute.funds_withdrawn`

## Cron

`GET /api/cron/enforce-bans` (existing) also releases due payout holds.

## Testing

```bash
npm test -- lib/risk lib/stripe/connect.test.ts
```

## Changelog

[2025-06-20] – Added seller verification gate, new-account payment limits, automated risk flags, Stripe payout pause, and admin payment approval controls.
