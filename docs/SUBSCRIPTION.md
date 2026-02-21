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

## Migration

Run `supabase/migrations/20250238000001_subscription_plan.sql`.
