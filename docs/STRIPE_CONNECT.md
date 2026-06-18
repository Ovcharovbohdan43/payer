# Stripe Connect Setup

Puyer uses **Stripe Connect Express** so that:

- Users receive payments directly to their Stripe account
- Puyer does not store or process bank details
- Payouts to users' banks are handled by Stripe
- **Connected accounts pay their own Stripe payment processing fees** (direct charges)

## Configuration

1. **Stripe Dashboard** → Connect → Get started
2. Add **two** webhook endpoints to `https://your-domain.com/api/webhooks/stripe`:
   - **Platform** (Listen to: your account): `checkout.session.completed` (Pro subscriptions only), `customer.subscription.updated`, `customer.subscription.deleted` → `STRIPE_WEBHOOK_SECRET`
   - **Connect** (Listen to: Connected accounts): `checkout.session.completed` (invoice payments), `payout.paid` → `STRIPE_WEBHOOK_SECRET_CONNECT`
3. Add to `.env.local`:
   - `STRIPE_SECRET_KEY` — platform account
   - `STRIPE_WEBHOOK_SECRET` — platform webhook signing secret
   - `STRIPE_WEBHOOK_SECRET_CONNECT` — Connect webhook signing secret (invoice payments + payouts)
   - `STRIPE_CONNECT_COUNTRY` — default country for new Connect accounts (`GB`, `US`, etc.)

## Charge type: direct charges (invoice payments)

Invoice payments use **direct charges**: Checkout is created on the connected account (`Stripe-Account` header). Funds and Stripe processing fees go to/from the connected account.

Previously Puyer used **destination charges** (`transfer_data`), which transferred the **full** charge to the connected account while Stripe billed processing fees to the **platform** — causing a negative platform balance. Direct charges are equivalent to “transfer only the net amount”: the connected account receives the charge minus Stripe fees automatically.

Before checkout, clients see a disclaimer that card fees are paid by the seller (connected account), not Puyer. Stripe Checkout also shows `custom_text` with the same notice.

Previously Puyer used **destination charges** (`transfer_data`), which always bill Stripe fees to the platform account regardless of Connect fee settings.

| Flow | Who pays Stripe processing fees |
|------|----------------------------------|
| Invoice payment (direct charge) | Connected account |
| Pro subscription (`/api/subscription/checkout`) | Platform (normal platform payment, not Connect) |

## Express accounts and fees

New Connect accounts are created as `type: express`. With direct charges, Express accounts (`fees.payer: application_express`) have **payment processing fees** billed to the connected account.

`controller.fees.payer = account` cannot be combined with Express Dashboard per Stripe API rules. Direct charges are the correct approach for Express SaaS platforms.

**Existing connected accounts** do not need to be recreated for this fee change — only the charge type (direct vs destination) matters.

## Flow

1. User connects Stripe in Settings → Payments → Connect Stripe account
2. Client pays invoice: Checkout runs on the user's Connect account (direct charge)
3. Stripe automatically pays out to the user's bank (default: 2-day rolling)
4. `payout.paid` webhook records each payout; dashboard shows "Paid out" and activity
5. `checkout.session.completed` on the **Connect** webhook marks the invoice as paid

## Migration

Run `supabase/migrations/20250221000001_stripe_connect_and_payouts.sql`.

After deploying direct charges, ensure the **Connect** webhook includes `checkout.session.completed`.
