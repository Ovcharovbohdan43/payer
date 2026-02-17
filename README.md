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
5. Run the profiles migration: `supabase db push` or run `supabase/migrations/20250217000001_create_profiles.sql` in the SQL editor.

**Phase 0–1 done:** Foundation + Magic link auth, onboarding, profiles table, protected routes (middleware). UI in English, mobile-first.

---

*Last updated: 2025-02-17*
