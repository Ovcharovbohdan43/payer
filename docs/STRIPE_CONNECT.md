# Stripe Connect Setup

Puyer uses **Stripe Connect Express** so that:

- Users receive payments directly to their Stripe account
- Puyer does not store or process bank details
- Payouts to users' banks are handled by Stripe

## Configuration

1. **Stripe Dashboard** → Connect → Get started
2. Add webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `payout.paid`
   - Enable **"Events on Connected accounts"** (required for `payout.paid`)
3. Add to `.env.local`:
   - `STRIPE_SECRET_KEY` — platform account
   - `STRIPE_WEBHOOK_SECRET` — from webhook endpoint

## Flow

1. User connects Stripe in Settings → Payments → Connect Stripe account
2. On invoice payment: funds transfer to user's Connect account (destination charge)
3. Stripe automatically pays out to user's bank (default: 2-day rolling)
4. `payout.paid` webhook records each payout; dashboard shows "Paid out" and activity

## Migration

Run `supabase/migrations/20250221000001_stripe_connect_and_payouts.sql`.
