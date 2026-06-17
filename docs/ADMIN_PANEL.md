# Admin panel

In-app platform administration at `/admin`.

## Access

1. Apply migration `supabase/migrations/20250325000001_admin_panel.sql`
2. Grant admin to your user (Supabase SQL Editor):

```sql
select set_user_admin('your-auth-user-uuid', true);
```

**Alternative (env):** set `ADMIN_USER_IDS` to a comma-separated list of user UUIDs (useful before migration or for bootstrap).

Non-admins who open `/admin` are redirected to `/dashboard`.

## Features

| Section | URL | Description |
|---------|-----|-------------|
| Overview | `/admin` | User counts, traffic summary, recent admin actions, manual Stripe ban cron |
| Users | `/admin/users` | Search/filter users, open detail |
| User detail | `/admin/users/[id]` | Full profile, ban/unban, Pro grant/revoke, Stripe Connect revoke, IP log, invoices, audit |
| Analytics | `/admin/analytics` | Daily page views, signups, top paths |

## Admin actions

All mutations use the **service role** server-side after `requireAdmin()`:

- **Ban / Unban** — `ban_user_account` / `unban_user_account` RPCs (IP/email blocklists + Stripe detach on ban)
- **Grant / Revoke Pro** — `grant_pro_subscription` / `revoke_pro_subscription`
- **Revoke Stripe Connect** — `stripe.accounts.del()` for the user's Connect account
- **Run Stripe ban cron** — processes pending revocations for all banned users

Actions are logged in `admin_actions_log`.

## Site analytics

Middleware logs GET page views (excluding `/api/*` and `/admin`) into `site_analytics_events` via `log_site_page_view` RPC.

Complements Vercel Analytics with server-side path-level data stored in your database.

## Security

- `profiles.is_admin` cannot be changed by the user (trigger `protect_profile_is_admin`)
- Admin UI never exposes `SUPABASE_SERVICE_ROLE_KEY`
- Ban/unban and subscription RPCs remain non-callable from the browser client; only server actions after admin check
- Admin routes are auth-protected in middleware; role check in `requireAdmin()` layout

## Modules

| File | Role |
|------|------|
| `lib/auth/require-admin.ts` | Admin gate (`is_admin` + `ADMIN_USER_IDS`) |
| `lib/admin/queries.ts` | Read-only admin data |
| `lib/admin/actions.ts` | Ban, Pro, Stripe mutations |
| `components/layout/admin-shell.tsx` | Admin navigation shell |
| `app/(admin)/admin/` | Admin pages |

## How to test

1. Run migration and `set_user_admin` for your test account
2. Sign in → open `/admin`
3. Search users, open a test user, try ban/unban on a non-production account
4. Browse public pages, then check `/admin/analytics` for page view rows
5. Sign in as non-admin → `/admin` redirects to `/dashboard`

## Limitations

- User list email search is partial (profile fields in DB query + email match on loaded page); full email search may need a dedicated RPC
- Page view logging adds one async RPC per GET request (negligible on Vercel; exclude heavy bots in future if needed)
- No role hierarchy (single `is_admin` flag)
- No in-app admin user promotion UI — use SQL `set_user_admin`

## Version

- **2026-06-17** — Initial admin panel (overview, users, analytics, ban/Pro/Stripe actions)

## Changelog

- [2026-06-17] – Added: admin panel, `is_admin`, site analytics, admin audit log.
