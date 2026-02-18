# Payer

Web SaaS for micro-businesses and freelancers: create invoices in 15–30 seconds, send payment links, track payments via Stripe, and send reminders.

- **Stack:** Next.js 15+ (App Router), TypeScript, Tailwind, shadcn/ui, Supabase (Auth + Postgres + RLS), Stripe, Resend.
- **UI:** English only, mobile-first, responsive (phones + laptops). Dark theme by default.
- **Deploy:** Vercel.

## Documentation

- **[Technical development plan (phases 0–10)](docs/TECHNICAL_PLAN.md)** — what to build and in what order.

## Quick start

1. `npm install` then `npm run dev`.
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase project → Settings → API).
   - Optionally `NEXT_PUBLIC_APP_URL` for magic link redirect (e.g. `http://localhost:3000` in dev).
3. In Supabase Dashboard: **Authentication → URL Configuration** → add your app URL to **Redirect URLs** (e.g. `http://localhost:3000/auth/callback` for dev, or `https://yourdomain.com/auth/callback` for production). Without this, magic link sign-in will redirect back to login.
4. **Authentication → Providers → Email** → enable; turn **Confirm email** off if you want magic link without confirmation.
5. **Email rate limits (while debugging):** Supabase applies rate limits to magic link (sign-in) emails. To avoid hitting them during development: in **Supabase Dashboard → Authentication → Rate Limits**, increase or temporarily disable the limits (e.g. "Email sign-ins per hour"). The app does not implement its own email rate limit; when Phase 7 (reminders) is added, a configurable limit (e.g. env `REMINDER_RATE_LIMIT_HOURS=0` for "no limit") will be used.
6. Run migrations in order: open Supabase SQL Editor and run `20250217000001_create_profiles.sql`, then `20250218000001_create_clients_invoices_payments_audit.sql`, then `20250218100001_record_public_invoice_viewed.sql` (or use `supabase db push`). See `docs/DATABASE.md`.

**Phase 0–3 done:** Foundation, Auth, onboarding; DB + RLS; Clients CRUD, /clients page, ClientAutocomplete for invoice form.

---

*Last updated: 2025-02-17*
