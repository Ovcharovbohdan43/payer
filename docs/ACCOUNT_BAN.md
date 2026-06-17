# Account ban

Restrict user access when an account must be temporarily suspended.

## Database

Migration: `supabase/migrations/20250323000001_account_ban.sql`

- Column `profiles.account_status`: `active` (default) or `banned`
- Users can **read** their own status via RLS but **cannot** change it (trigger `protect_profile_account_status`)
- Admin RPCs (SQL Editor only, not callable from the app):

```sql
-- Ban by user id (auth.users.id = profiles.id)
select ban_user_account('00000000-0000-0000-0000-000000000000');

-- Restore access
select unban_user_account('00000000-0000-0000-0000-000000000000');
```

**Direct SQL** (Supabase SQL Editor as postgres):

```sql
update public.profiles
set account_status = 'banned'
where id = '00000000-0000-0000-0000-000000000000';
```

Find user id by email:

```sql
select id, email from auth.users where email = 'user@example.com';
select id, account_status, business_name from public.profiles where id = '...';
```

## User experience

When `account_status = 'banned'`:

1. After login (password, OTP, magic link, Google OAuth) the user is sent to `/account-restricted`
2. The page shows: account is temporarily restricted; contact **support@puyer.org**
3. User can sign out; dashboard, invoices, settings, API routes, and onboarding are blocked
4. Middleware and app layout both enforce the ban (defense in depth)

## App modules

| Module | Role |
|--------|------|
| `lib/auth/account-status.ts` | Status helpers, redirect/assert |
| `lib/supabase/proxy.ts` | Middleware ban check |
| `app/account-restricted/page.tsx` | Restricted account UI |
| `app/(app)/layout.tsx` | Redirect banned users from app shell |
| `app/login/actions.ts` | Post-login ban check |
| `app/auth/callback/route.ts` | OAuth/magic-link ban check |
| `app/onboarding/page.tsx` | Block banned users from onboarding |

## How to test

1. Apply migration: `supabase db push` or run SQL in Supabase Dashboard
2. Sign in as a test user, note `auth.users.id`
3. Run `select ban_user_account('user-id');`
4. Refresh or sign in again → `/account-restricted` with support email
5. Try `/dashboard` → redirected to `/account-restricted`
6. Run `select unban_user_account('user-id');` → normal access restored

## Limitations

- Ban status is read from `profiles` on each request (not cached in JWT). Changes take effect immediately without waiting for token refresh.
- Existing sessions remain valid until the user hits a protected route; they are then redirected to `/account-restricted` (not signed out automatically).
- Public invoice/offer pages (`/i/*`, `/o/*`) remain accessible; they do not use the banned user's session.

## Version

- **2026-06-17** — Initial account ban system

## Changelog

- [2026-06-17] – Added: `profiles.account_status`, ban/unban RPCs, `/account-restricted` page, middleware and auth checks.
