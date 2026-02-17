# Payer

Web SaaS for micro-businesses and freelancers: create invoices in 15–30 seconds, send payment links, track payments via Stripe, and send reminders.

- **Stack:** Next.js 15+ (App Router), TypeScript, Tailwind, shadcn/ui, Supabase (Auth + Postgres + RLS), Stripe, Resend.
- **UI:** English only, mobile-first, responsive (phones + laptops). Dark theme by default.
- **Deploy:** Vercel.

## Documentation

- **[Technical development plan (phases 0–10)](docs/TECHNICAL_PLAN.md)** — what to build and in what order.

## Quick start

1. `npm install` then `npm run dev`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` when you add Supabase (Phase 1).
3. Run Supabase migrations when you reach Phase 2 (see `docs/TECHNICAL_PLAN.md`).

**Phase 0 (Foundation) is done:** Next.js 15+, Tailwind, shadcn/ui, react-hook-form + zod, Supabase client/server stubs, theme provider (dark by default), responsive layout. UI is in English and mobile-first.

---

*Last updated: 2025-02-17*
