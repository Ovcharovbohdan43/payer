# Payer

Web SaaS for micro-businesses and freelancers: create invoices in 15–30 seconds, send payment links, track payments via Stripe, and send reminders.

- **Stack:** Next.js 15+ (App Router), TypeScript, Tailwind, shadcn/ui, Supabase (Auth + Postgres + RLS), Stripe, Resend.
- **UI:** English only, mobile-first, responsive (phones + laptops). Dark theme by default.
- **Deploy:** Vercel.

## Documentation

- **[Technical development plan (phases 0–10)](docs/TECHNICAL_PLAN.md)** — what to build and in what order.

## Quick start (after implementation)

1. Copy `.env.example` to `.env.local` and set Supabase and Stripe keys.
2. `npm install` then `npm run dev`.
3. Run Supabase migrations (see `docs/TECHNICAL_PLAN.md` Phase 2).

---

*Last updated: 2025-02-17*
