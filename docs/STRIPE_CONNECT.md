# Stripe Connect Setup

Puyer uses **Stripe Connect** so that:

- Users receive payments directly to their Stripe account
- Puyer does not store or process bank details
- Payouts to users' banks are handled by Stripe
- **Connected accounts pay their own Stripe payment processing fees** (direct charges + `controller.fees.payer = account`)

## Connected account creation

New accounts are created in `lib/stripe/connect.ts` via `buildConnectAccountParams()` with explicit controller settings (not `type: express`):

```ts
controller: {
  fees: { payer: "account" },           // seller pays Stripe processing fees
  losses: { payments: "stripe" },     // Stripe liable for connected-account losses
  requirement_collection: "stripe",
  stripe_dashboard: { type: "full" },
}
```

**Existing Express accounts** created before this change keep their original fee payer (`application_express` or platform defaults). Only **new** Connect onboarding uses the updated configuration. To migrate a seller, they must connect a new Stripe account (or contact Stripe Support).

Run `node scripts/check-stripe-connect-fees.mjs` to audit `controller.fees.payer` per account.

## Seller verification & risk

Invoice Checkout is blocked until `profiles.payments_enabled = true` and risk status is `active`. See **[PAYMENT_RISK.md](./PAYMENT_RISK.md)**.

Connect webhook should also listen for: `account.updated`, `charge.dispute.created`, `charge.dispute.funds_withdrawn`.

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

New Connect accounts use `controller.fees.payer = account` and Full Stripe Dashboard (`stripe_dashboard.type = full`). Connected accounts pay Stripe payment processing fees on direct charges; Puyer is not billed for those fees.

Legacy Express accounts (`type: express`, `application_express`) may still exist from earlier onboarding — audit with `scripts/check-stripe-connect-fees.mjs`.

## Flow

1. User connects Stripe in Settings → Payments → Connect Stripe account
2. Client pays invoice: Checkout runs on the user's Connect account (direct charge)
3. Stripe automatically pays out to the user's bank (default: 2-day rolling)
4. `payout.paid` webhook records each payout; dashboard shows "Paid out" and activity
5. `checkout.session.completed` on the **Connect** webhook marks the invoice as paid

## Migration

Run `supabase/migrations/20250221000001_stripe_connect_and_payouts.sql`.

After deploying direct charges, ensure the **Connect** webhook includes `checkout.session.completed`.
