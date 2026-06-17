# Account ban

Restrict user access when an account must be temporarily suspended, and block repeat access via IP, email, and Stripe Connect.

## Database

Migrations:

1. `supabase/migrations/20250323000001_account_ban.sql` — `profiles.account_status`, base ban/unban RPCs
2. `supabase/migrations/20250324000001_account_ban_enforcement.sql` — IP/email blocklists, Stripe revoke tracking, enhanced RPCs

### Core

- Column `profiles.account_status`: `active` (default) or `banned`
- Users can **read** their own status via RLS but **cannot** change it (trigger `protect_profile_account_status`)
- Admin RPCs (SQL Editor only, not callable from the app):

```sql
-- Ban by user id (auth.users.id = profiles.id)
select ban_user_account('00000000-0000-0000-0000-000000000000');

-- Restore access
select unban_user_account('00000000-0000-0000-0000-000000000000');
```

**Important:** Use `ban_user_account()` — not a raw `UPDATE` — to apply IP/email blocklists and Stripe Connect detachment.

### Enforcement tables

| Table | Purpose |
|-------|---------|
| `user_ip_log` | IPs seen per user (updated on authenticated requests) |
| `banned_ip_addresses` | IPs blocked from login/register while ban is active |
| `banned_emails` | Emails blocked from signup/login while ban is active |
| `profiles.stripe_connect_account_id_at_ban` | Snapshot of Connect account id for API revocation |
| `profiles.stripe_connect_revoked_at` | When Stripe deleted the connected account |

### Public RPCs (anon + authenticated)

- `check_ip_banned(text)` — used by middleware and auth actions
- `check_email_banned(text)` — used by register/login
- `log_user_ip(text)` — authenticated users only; called from middleware

Find user id by email:

```sql
select id, email from auth.users where email = 'user@example.com';
select id, account_status, business_name from public.profiles where id = '...';
```

## What happens on ban

When `ban_user_account(user_id)` runs:

1. `profiles.account_status` → `banned`
2. User email added to `banned_emails`
3. All known IPs from `user_ip_log` added to `banned_ip_addresses`
4. `stripe_connect_account_id` cleared; previous id saved in `stripe_connect_account_id_at_ban`
5. Cron job `/api/cron/enforce-bans` calls Stripe `accounts.del()` and sets `stripe_connect_revoked_at`

On `unban_user_account(user_id)`:

1. `account_status` → `active`
2. Email and IP blocklist rows for that user are removed
3. Stripe Connect is **not** restored automatically — user must reconnect in Settings

## User experience

When `account_status = 'banned'`:

1. After login (password, OTP, magic link, Google OAuth) the user is sent to `/account-restricted`
2. The page shows: account is temporarily restricted; contact **support@puyer.org**
3. User can sign out; dashboard, invoices, settings, API routes, and onboarding are blocked
4. Middleware and app layout both enforce the ban (defense in depth)
5. Login, register, and OAuth callback are blocked if the client IP or email is on the blocklist
6. Invoice checkout is rejected for banned merchants (no online payment on their invoices)
7. Stripe Connect onboarding is blocked for banned users

## App modules

| Module | Role |
|--------|------|
| `lib/auth/account-status.ts` | Status helpers, redirect/assert |
| `lib/auth/ban-enforcement.ts` | IP/email ban checks, IP logging |
| `lib/auth/client-ip.ts` | Read client IP from headers |
| `lib/auth/process-ban-stripe.ts` | Batch Stripe Connect revocation |
| `lib/stripe/revoke-connect-account.ts` | `stripe.accounts.del()` |
| `lib/supabase/proxy.ts` | Middleware: IP ban, account ban, IP logging |
| `app/api/cron/enforce-bans/route.ts` | Daily cron to revoke Stripe accounts |
| `app/account-restricted/page.tsx` | Restricted account UI |
| `app/register/actions.ts` | Block banned email/IP on signup |
| `app/login/actions.ts` | Block banned email/IP on sign-in |
| `app/auth/callback/route.ts` | OAuth/magic-link ban + IP checks |
| `app/api/checkout/route.ts` | Reject checkout for banned invoice owners |
| `app/api/stripe/connect/route.ts` | Block Connect onboarding when banned |

## Cron

`vercel.json` runs `GET /api/cron/enforce-bans` once daily at 09:00 UTC (`0 9 * * *`). Vercel Hobby allows at most one run per cron per day.

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://puyer.org/api/cron/enforce-bans
```

Manual trigger after banning a user with Connect speeds up Stripe disconnection.

## How to test

1. Apply migrations in Supabase Dashboard (or `supabase db push`)
2. Sign in as a test user, browse a few pages (populates `user_ip_log`)
3. Run `select ban_user_account('user-id');`
4. Refresh or sign in again → `/account-restricted`
5. Try `/register` or `/login` from same network → redirected to `/account-restricted`
6. Try signup with same email → blocked with support message
7. If user had Stripe Connect, run enforce-bans cron → account deleted on Stripe
8. Run `select unban_user_account('user-id');` → login works; Stripe must be reconnected manually

## Limitations

- **IP blocking** depends on `x-forwarded-for` / `x-real-ip` and only covers IPs logged before the ban. New IPs or VPNs can bypass until logged and re-banned manually.
- **Email blocking** covers the exact email on the banned account; new emails are not blocked unless the same IP is blocklisted.
- **Stripe revoke** is asynchronous (daily cron, or manual trigger from `/admin`). `stripe_connect_account_id` is cleared immediately so new checkouts fail even before cron runs.
- Ban status is read from `profiles` on each request (not cached in JWT).
- Public invoice/offer pages (`/i/*`, `/o/*`) remain viewable; checkout API rejects payment for banned merchants.

## Version

- **2026-06-17** — IP/email blocklists, Stripe Connect revocation, enhanced ban RPCs

## Changelog

- [2026-06-17] – Added: IP/email blocklists, Stripe Connect detach + cron revoke, middleware and auth enforcement.
- [2026-06-17] – Added: `profiles.account_status`, ban/unban RPCs, `/account-restricted` page, middleware and auth checks.
