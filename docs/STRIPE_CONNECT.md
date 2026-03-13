# Stripe Connect Setup

Puyer uses **Stripe Connect Express** so that:

- Users receive payments directly to their Stripe account
- Puyer does not store or process bank details
- Payouts to users' banks are handled by Stripe

## Configuration

1. **Stripe Dashboard** → Connect → Get started
2. Add **two** webhook endpoints to `https://your-domain.com/api/webhooks/stripe`:
   - **Platform** (Listen to: your account): `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → `STRIPE_WEBHOOK_SECRET`
   - **Connect** (Listen to: Connected accounts): `payout.paid` → `STRIPE_WEBHOOK_SECRET_CONNECT`
3. Add to `.env.local`:
   - `STRIPE_SECRET_KEY` — platform account
   - `STRIPE_WEBHOOK_SECRET` — platform webhook signing secret
   - `STRIPE_WEBHOOK_SECRET_CONNECT` — Connect webhook signing secret (for payouts)

## Flow

1. User connects Stripe in Settings → Payments → Connect Stripe account
2. On invoice payment: funds transfer to user's Connect account (destination charge)
3. Stripe automatically pays out to user's bank (default: 2-day rolling)
4. `payout.paid` webhook records each payout; dashboard shows "Paid out" and activity

## Migration

Run `supabase/migrations/20250221000001_stripe_connect_and_payouts.sql`.
