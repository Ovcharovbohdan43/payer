# Puyer

Web SaaS for micro-businesses and freelancers: create invoices in 15–30 seconds, send payment links, track payments via Stripe, and send reminders.

- **Stack:** Next.js 15+ (App Router), TypeScript, Tailwind, shadcn/ui, Supabase (Auth + Postgres + RLS), Stripe, Resend.
- **UI:** English only, mobile-first, responsive (phones + laptops). Dark theme by default.
- **Deploy:** Vercel.

## Documentation

- **[Technical development plan (phases 0–10)](docs/TECHNICAL_PLAN.md)** — what to build and in what order.
- **[Changelog](docs/CHANGELOG.md)** — detailed release history.
- **[GitHub account cleanup](docs/GITHUB_ACCOUNT_CLEANUP.md)** — how to keep only payer & desboard repos and tidy profile.

## Updates

**2025-03-15**

- **Register (bug fix):** "Next" is disabled until required fields are filled — step 1: first name and last name; step 2: company name. Error message shown under the button if validation fails.
- **Onboarding:** Step-by-step flow (same as register) for all users, including after Google sign-in: Step 1 — Name + email; Step 2 — Company name + optional (phone, address, website, company type); Step 3 — Currency, country, timezone + "Continue to dashboard". Progress bar and Back/Next.
- **Google prefill:** After Google OAuth, onboarding form is pre-filled from `user_metadata` (name, email) and profile (business name when available); user can edit before submitting.
- **Privacy Policy:** Production-ready Privacy Policy at `/privacy`; links in footer, Terms page, register form, and sitemap.

## Quick start

1. `npm install` then `npm run dev`.
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase project → Settings → API).
   - `NEXT_PUBLIC_APP_URL` — app URL for auth redirect, checkout, QR codes. Production: `https://puyer.org`. Local dev: `http://localhost:3000`.
3. In Supabase Dashboard: **Authentication → URL Configuration** → add `https://puyer.org/auth/callback`, `https://www.puyer.org/auth/reset-password` to **Redirect URLs** (and `http://localhost:3000/auth/callback` for local dev).
4. **Authentication → Providers → Email** → enable; turn **Confirm email** off if you want magic link without confirmation.
5. **Magic link rate limits:** Supabase limits magic link sends by default. If sign-in often fails with "too many requests", go to **Supabase Dashboard → Authentication → Rate Limits** and either disable the limits or set "Email sign-ins per hour" to a high value (e.g. 100+). See `docs/SUPABASE_RATE_LIMITS.md`.
6. Run migrations in order: open Supabase SQL Editor and run `20250217000001_create_profiles.sql`, then `20250218000001_create_clients_invoices_payments_audit.sql`, then `20250218100001_record_public_invoice_viewed.sql` (or use `supabase db push`). See `docs/DATABASE.md`.

**Phase 0–3 done:** Foundation, Auth, onboarding; DB + RLS; Clients CRUD, /clients page, ClientAutocomplete for invoice form.

---

*Last updated: 2025-03-15*
