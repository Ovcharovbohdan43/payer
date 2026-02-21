# Puyer Subscription (Pro Plan)

## Overview

- **Free plan:** 3 invoices, all features
- **Pro plan:** $3/month, unlimited invoices

## Stripe Setup

1. **Webhook events** — Add to existing endpoint `https://your-domain.com/api/webhooks/stripe`:
   - `checkout.session.completed` (already used for invoices; now also handles subscription)
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

2. **Billing Portal** — Stripe Dashboard → Settings → Billing → Customer portal  
   Enable so users can manage/cancel subscription from Settings.

## Flow

1. User clicks "Upgrade to Pro" in Settings → POST `/api/subscription/checkout` → Stripe Checkout
2. After payment → `checkout.session.completed` → profile: `stripe_customer_id`, `subscription_status: 'active'`
3. User clicks "Manage subscription" → POST `/api/subscription/portal` → Stripe Billing Portal
4. On cancel/update → `customer.subscription.updated` / `deleted` → profile `subscription_status` updated

## Manual Pro grant (Supabase)

To give someone Pro access without payment, run in **Supabase SQL Editor**:

```sql
-- Grant Pro
select grant_pro_subscription('user-uuid-here');

-- Revoke Pro (back to Free)
select revoke_pro_subscription('user-uuid-here');
```

Or edit manually: Table Editor → profiles → find user → set `subscription_status` = `active` (Pro) or `free` (Free).

## Migrations

1. `supabase/migrations/20250238000001_subscription_plan.sql`
2. `supabase/migrations/20250238000002_subscription_manual_grant.sql`
