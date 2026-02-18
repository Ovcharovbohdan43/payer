# Payer — Technical Development Plan

**Product:** Web SaaS for micro-businesses to create invoices in 15–30 seconds, send payment links, track payments via Stripe, and send reminders.

**Constraints:** MVP simple, mobile-first, English UI, responsive (phones + laptops).

**Last updated:** 2025-02-17

---

## Overview of Phases

| Phase | Name | Goal | Depends on |
|-------|------|------|------------|
| 0 | Foundation | Next.js, Tailwind, shadcn, Supabase client | — |
| 1 | Auth & Profiles | Magic link, onboarding, profiles | 0 |
| 2 | Database & RLS | Schema, migrations, RLS policies | 0, 1 |
| 3 | Clients CRUD | Client management, autocomplete | 1, 2 |
| 4 | Invoices CRUD | Create/edit invoices, numbering, statuses | 2, 3 |
| 5 | Public Invoice & Stripe | Public page by `public_id`, Stripe Checkout, webhooks | 2, 4 |
| 6 | Dashboard & List | Dashboard cards, list, filters, quick actions | 4, 5 |
| 7 | Email & Reminders | Send invoice email, manual reminder, (optional) auto-remind | 4, 5 |
| 8 | PDF & Polish | PDF generation, Settings, theme, i18n check | 4, 6 |
| 9 | Security & Reliability | Headers, rate limit, Sentry, audit, DoD | 2–8 |
| 10 | Landing & Deploy | Landing page, pricing, deploy to Vercel, docs | 9 |

---

## Phase 0: Foundation

**Goal:** Project scaffold, UI stack, Supabase connection. No auth yet.

### 0.1 Next.js project

- [x] Create Next.js 15+ app (App Router), TypeScript, ESLint.
- [x] Configure `next.config` (images, env), base path if needed.
- [x] Add Tailwind CSS, configure (Tailwind v4 + `globals.css` theme vars for dark/light).
- [x] Add Geist font, optimize loading (`display: swap`).

### 0.2 shadcn/ui

- [x] Init shadcn/ui, use a neutral theme compatible with “glass” panels and gradients.
- [x] Install and tune: Button, Input, Label, Card, Badge, Select, Dialog, DropdownMenu, Skeleton, Toast/Sonner.
- [x] Ensure all text is in English (labels, placeholders, buttons).

### 0.3 Forms & state

- [x] Add `react-hook-form`, `zod`, `@hookform/resolvers`.
- [x] TanStack Query deferred for MVP; use Server Actions + minimal client state.
- [x] Create shared `lib/validations` with zod schemas (reused server-side later).

### 0.4 Supabase client (no auth yet)

- [x] Add `@supabase/supabase-js` and `@supabase/ssr`.
- [x] Create `lib/supabase/client.ts` (browser, anon key only).
- [x] Create `lib/supabase/server.ts` (cookies, for use in Server Components/Actions).
- [x] Add `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (no service role in client).

### 0.5 Layout & responsiveness

- [x] Root layout: theme provider (dark default, light toggle), font, meta viewport.
- [x] Responsive breakpoints: mobile-first; key pages work on 320px–1920px.
- [x] Document in README: “Fully in English, mobile-first, responsive.”

**Deliverables:** App runs locally; Tailwind + shadcn work; Supabase client/server helpers; no leaked secrets; English UI.

---

## Phase 1: Auth & Profiles

**Goal:** Magic link sign-in, post-signup onboarding, `profiles` row per user.

### 1.1 Supabase Auth

- [x] Enable Email (Magic Link) in Supabase Dashboard (README).
- [x] Auth callback route: `app/auth/callback/route.ts` — exchange code for session, redirect to `/onboarding` or `/dashboard`.
- [x] Login page: single field “Email”, “Send magic link”, copy: “We’ll email a secure link.”
- [x] Logout: clear session, redirect to `/`.

### 1.2 Profiles table (from Phase 2 schema, create here if doing schema incrementally)

- [x] Table `profiles`: `id` (uuid, PK, = `auth.users.id`), `business_name`, `default_currency`, `country`, `timezone`, `show_vat_fields`, `created_at`, `updated_at`.
- [x] Trigger: on `auth.users` insert, insert row in `profiles` with defaults (`supabase/migrations/20250217000001_create_profiles.sql`).

### 1.3 Onboarding

- [x] Route: `/onboarding` (protected; if profile incomplete, redirect here after login).
- [x] Form: Business name (required), Default currency, Country/Timezone, Toggle “Show VAT fields” (default off).
- [x] On submit: upsert `profiles` for `auth.uid()`, then redirect to `/dashboard`.
- [x] All labels and hints in English.

### 1.4 Auth middleware

- [x] Middleware: protect `/dashboard`, `/invoices`, `/clients`, `/settings`, `/onboarding`; redirect unauthenticated to `/login`.
- [x] Redirect already-onboarded users from `/onboarding` to `/dashboard` (in onboarding page server-side).

**Deliverables:** Magic link works; onboarding completes; profile exists for every user; middleware protects private routes; English only.

---

## Phase 2: Database & RLS

**Goal:** Full schema, migrations, RLS so frontend uses only anon key safely.

### 2.1 Tables

- [x] **profiles** — (see Phase 1).
- [x] **clients** — migration 20250218000001 (FK profiles), `name`, `email`, `phone`, `created_at`.
- [x] **invoices** — migration 20250218000001 (nullable), `client_name`, `client_email`, `number` (unique per user), `status` (draft/sent/viewed/paid/overdue/void), `amount_cents`, `currency`, `description`, `notes`, `due_date`, `public_id` (unique, ULID or UUID), `stripe_checkout_session_id`, `stripe_payment_intent_id`, `created_at`, `sent_at`, `viewed_at`, `paid_at`, `voided_at`.
- [x] **payments** — migration 20250218000001 (FK), `amount_cents`, `currency`, `stripe_event_id` (unique), `paid_at`, `created_at`.
- [x] **audit_logs** — migration 20250218000001, `entity_type`, `entity_id`, `action`, `meta` (jsonb), `created_at`.

### 2.2 Indexes

- [x] `invoices(user_id, status)`, `invoices(public_id)`, `invoices(stripe_checkout_session_id)`.
- [x] `clients(user_id)`, `payments(invoice_id)`, `audit_logs(user_id, created_at)`.

### 2.3 RLS policies

- [x] **profiles:** SELECT/UPDATE where `id = auth.uid()` (Phase 1).
- [x] **clients:** SELECT/INSERT/UPDATE/DELETE where `user_id = auth.uid()`.
- [x] **invoices:** SELECT/INSERT/UPDATE/DELETE where `user_id = auth.uid()`.
- [x] **payments:** SELECT only where invoice owned by user; no INSERT for anon/authenticated (service role only).
- [x] **audit_logs:** INSERT/SELECT where `user_id = auth.uid()`.

### 2.4 Public invoice data (no RLS on public read)

- [x] RPC get_public_invoice(public_id); do **not** expose `invoices` table by public_id to client. Use either:
  - **Option A:** Postgres function `get_public_invoice(public_id text)` returning only safe fields (business_name from profile, invoice number, amount, description, etc.) with SECURITY DEFINER and checks, called from API route with anon; or
  - **Option B:** API route (e.g. `GET /api/invoices/public/[publicId]`) that uses service role to fetch by `public_id`, then returns only safe fields (no `user_id`, no internal `id`).
- [ ] Document: “Public invoice access only by public_id; no internal IDs or PII leakage.”

### 2.5 Invoice number generation

- [x] Function `next_invoice_number(user_id uuid)` returns INV-YYYY-NNNNNN unique per user per year.

**Deliverables:** Migrations apply; RLS enabled on all tables; public invoice data access only by public_id with minimal fields; numbering defined; English comments in SQL.

---

## Phase 3: Clients CRUD

**Goal:** Add/list clients; autocomplete for invoice form.

### 3.1 Clients API / Server Actions

- [x] List clients: Server Action `listClients()`, ordered by name.
- [x] Create client: name (required), email, phone; validate with zod; insert with `user_id`.
- [x] Update/delete client via `updateClientAction`, `deleteClientAction`; RLS enforced.

### 3.2 Clients UI (optional dedicated page)

- [x] Page `/clients`: list with search; add client (inline form); edit (dialog), delete. All English.

### 3.3 Client autocomplete component

- [x] Reusable ClientAutocomplete: input + dropdown of existing clients (name/email); “Add new” inline to create and select. Used on Create Invoice form.
- [x] Mobile-friendly: adequate tap targets, no tiny dropdowns.

**Deliverables:** Clients CRUD; autocomplete on Create Invoice; English labels; responsive.

---

## Phase 4: Invoices CRUD

**Goal:** Create/edit invoices, generate `public_id`, status lifecycle (draft → sent → viewed → paid/overdue/void).

### 4.1 Create invoice (speed form)

- [x] Page `/invoices/new`: Client (autocomplete + add new), Service/description (one line), Amount + currency (from profile default), optional “More”: due date, notes, VAT (if profile.show_vat_fields).
- [x] Buttons: “Create & copy link”, “Create & send email” (if client email present).
- [x] On create: generate `public_id` (UUIDv4), set `number` (INV-YYYY-NNNNNN), status `draft` or `sent` when markSent; then copy link to clipboard and redirect to detail (send-email in Phase 7).
- [x] Form validation: zod client + server (Server Action).

### 4.2 Invoice list (minimal for Phase 4)

- [x] Fetch invoices for user (RLS); show in a simple table: number, client, amount, status, link to detail; search and status filter.

### 4.3 Invoice detail (owner view)

- [x] Page `/invoices/[id]`: only by internal `id`, with auth and RLS. Header: status badge, amount, client, description/notes. Timeline: Created → Sent → Viewed → Paid (or Overdue). Client component: Copy link, Download PDF (Phase 8 placeholder), Send reminder (Phase 7 placeholder), Void invoice, Mark as paid (manual).
- [x] Void: set status to `void`, `voided_at`; audit log.
- [x] Payment section: show `paid_at` when paid.

### 4.4 Mark as sent / viewed

- [x] When “Create & copy link” or “Create & send email” is used, set `sent_at` and status to `sent` (markSent). When user clicks “Copy link” on detail for a draft, call `markInvoiceSentAction` to set `sent_at` and status to `sent`.
- [x] “Viewed”: set when public invoice page is loaded (first time only); set `viewed_at`, status to `viewed` if still `sent` (Phase 5).

### 4.5 Overdue

- [ ] Cron or scheduled job: set status to `overdue` where `due_date < today` and status in (`sent`, `viewed`). Can be Phase 6 or 7.

**Deliverables:** Create invoice (speed form); list and detail pages; copy link; void; status flow; English; mobile-first.

---

## Phase 5: Public Invoice Page & Stripe

**Goal:** Public page by `public_id` only; Stripe Checkout; webhook sets paid; viewed tracking.

### 5.1 Public invoice endpoint

- [x] Server Component loads via RPC `get_public_invoice(public_id)`; returns business_name, invoice number, amount, currency, description, due_date, status. No `user_id`, no internal `id`.
- [x] If not found or void: 404.

### 5.2 Public page UI

- [x] Route: `/i/[publicId]`. Clean layout: business name, invoice number, amount, description, “Pay” button. Footer: “Powered by Payer”.
- [x] On first load when status = sent: RPC `record_public_invoice_viewed(public_id)` sets `viewed_at` and status to `viewed` (migration 20250218100001).
- [ ] Rate limit this route (Phase 9); no auth required.

### 5.3 Stripe Checkout

- [x] `POST /api/checkout`: body `{ publicId }`; service role fetches invoice by `public_id`, creates Stripe Checkout Session (amount, currency), stores `stripe_checkout_session_id` on invoice, returns `{ url }`. Success URL: `/i/[publicId]`, cancel: same.
- [x] “Pay” on public page (client `PayButton`) calls API and redirects to Stripe Checkout.
- [x] After payment, redirect to success URL (public page shows “Paid” after webhook).

### 5.4 Stripe webhook

- [x] Route: `POST /api/webhooks/stripe`. Verify signature with `STRIPE_WEBHOOK_SECRET`. On `checkout.session.completed`: find invoice by `stripe_checkout_session_id`; if already paid, skip; else set `paid_at`, status `paid`, insert `payments` with `stripe_event_id` (unique). Service role via `createAdminClient()`.
- [x] Idempotency: duplicate events no-op (unique `stripe_event_id`).

### 5.5 Manual “Mark as paid”

- [x] On invoice detail: “Mark as paid” (manual) sets `paid_at`, status `paid`, optional payment row; audit log (Phase 4).

**Deliverables:** Public page by public_id only; no IDOR; Stripe Checkout + webhook; viewed once; idempotent webhook; English UI.

---

## Phase 6: Dashboard & List

**Goal:** Dashboard cards (Unpaid, Paid this month, Overdue); invoice list with filters and quick actions; FAB on mobile.

### 6.1 Dashboard layout

- [x] Page `/dashboard`: top cards — Unpaid (sum in default_currency), Paid this month, Overdue (count). Data from listInvoices + `computeDashboardStats` in `lib/dashboard/stats.ts`. Cards link to `/invoices?status=unpaid|paid|overdue`.

### 6.2 Invoice list

- [x] Default sort: unpaid first, then by created_at desc. Filters: status (all, unpaid, paid, overdue, and individual statuses). Search by number/client.
- [ ] Row actions: Copy link, Mark as paid, Send reminder (Phase 7). Mobile: dropdown or swipe actions.

### 6.3 Create invoice entry point

- [x] “Create invoice” button in header; on mobile: FAB “+ Invoice” (`NewInvoiceFab`, visible on dashboard and invoices list, hidden sm and up).

### 6.4 Responsive

- [x] Cards grid (3 cols on sm); list usable on small width; FAB visible on mobile (fixed bottom-right).

**Deliverables:** Dashboard with metrics; filterable list; quick actions; FAB; English; responsive.

---

## Phase 7: Email & Reminders

**Goal:** Send invoice by email (link + optional PDF); manual “Send reminder”; optional auto-remind (3/7/14 days).

### 7.1 Email provider (Resend recommended)

- [ ] Resend API key in env; server-only send function. Template: subject, body with “View & Pay” button (link to public page), optional PDF attachment (Phase 8).

### 7.2 Send invoice email

- [ ] After “Create & send email” or from detail “Send by email”: send email to `client_email`; set `sent_at` and status `sent` if not already. Handle errors (log, show toast); do not block invoice creation if email fails (graceful degradation).

### 7.3 Manual reminder

- [ ] “Send reminder” button: same email template (or shorter “reminder” text); no change to status. Rate limit per invoice (e.g. 1 per 24h) to avoid spam.

### 7.4 Auto-reminders (MVP-lite)

- [ ] Toggle in settings or per-invoice: “Auto remind”. Default rule: 3, 7, 14 days after sent if not paid. Implement via Vercel Cron (e.g. daily job) or Supabase pg_cron: find invoices due for reminder, send email, log. Optional for MVP.

**Deliverables:** Send invoice email; manual reminder; optional auto-remind; English emails; no PII in logs.

---

## Phase 8: PDF, Settings & Polish

**Goal:** PDF generation (on-demand, stream); Settings page; theme and copy in English.

### 8.1 PDF generation

- [x] Server-side: `pdf-lib` for invoice PDF. `GET /api/invoices/[id]/pdf` (auth), `GET /api/invoices/public/[publicId]/pdf` (public). Download links in invoice detail and public page.

### 8.2 Settings page

- [x] `/settings`: Business profile (name, logo optional), default currency, country/timezone, “Show VAT fields” toggle. Billing portal link (Stripe Customer Portal) for future; Email templates (Pro) placeholder. All English.

### 8.3 Theme & accessibility

- [x] Dark default; “2026” style: glass panels, soft gradients, thin borders. Micro-animations 150–250ms. Ensure contrast and touch targets for mobile.

### 8.4 Copy and i18n

- [x] All user-facing strings in English.

**Deliverables:** PDF download (owner + public); Settings; theme; full English; responsive.

---

## Phase 9: Security, Rate Limiting & Observability

**Goal:** Secure headers, rate limits, Sentry, audit logging, DoD checks.

### 9.1 Secure headers (middleware or next.config)

- [ ] CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy. Tune CSP for Stripe (frames/scripts).

### 9.2 Rate limiting

- [ ] Middleware or Vercel config: limit `/api/invoices` (create), `/api/invoices/public/*`, send-email/reminder endpoints. Use Vercel KV or Upstash or in-memory (with caveats). Return 429 with Retry-After.

### 9.3 Input validation & sanitization

- [ ] All mutations: zod on server; sanitize notes/description (no HTML); parameterized queries only (Supabase SDK).

### 9.4 Audit logging

- [ ] On status change, create/void, payment: write to `audit_logs` (user_id, entity_type, entity_id, action, meta). Do not log secrets.

### 9.5 Sentry

- [ ] Install Sentry for Next.js; capture exceptions and optional performance; no PII in events.

### 9.6 Definition of Done checks

- [ ] Lighthouse mobile performance ≥ 85 on key pages.
- [ ] Time to interactive on Create invoice &lt; 2s (4G).
- [ ] RLS tests or manual verification for all tables.
- [ ] Stripe webhook idempotency test (replay event).
- [ ] Public invoice: no `user_id` or internal id in response/HTML.
- [ ] Rate limit returns 429 on public endpoint when exceeded.
- [ ] All forms validated client + server; errors logged to Sentry.

**Deliverables:** Headers; rate limits; Sentry; audit log; DoD satisfied; security checklist (IDOR, XSS, CSRF, injection) documented.

---

## Phase 10: Landing & Deploy

**Goal:** Landing page (hero, benefits, pricing, CTA); deploy on Vercel; docs.

### 10.1 Landing page (English)

- [ ] Hero: “Invoice in 15 seconds. Get paid faster.”
- [ ] Three benefit cards: Pay link + tracking; Auto reminders; Made for trades & freelancers.
- [ ] Mock screenshots or UI preview.
- [ ] Pricing: Free / Basic / Pro (placeholders or Stripe products later).
- [ ] CTA: “Start free” → sign up (Magic link).

### 10.2 Deploy

- [ ] Vercel project; connect repo; set env (Supabase, Stripe, Resend, Sentry). Use only anon key in client; service role only in server/webhook.
- [ ] Stripe webhook URL: `https://yourdomain.com/api/webhooks/stripe`; verify in Stripe Dashboard.

### 10.3 Documentation

- [ ] README: project name, stack, how to run locally, env vars (`.env.example`), deploy steps.
- [ ] Optional: `docs/DEPLOY.md`, `docs/CHANGELOG.md` with [YYYY-MM-DD] entries.

**Deliverables:** Landing live; app deployed; README and .env.example; changelog started.

---

## Dependency Graph (summary)

```
0 (Foundation)
  → 1 (Auth & Profiles)
  → 2 (DB & RLS) — can start after 0, needs 1 for profile table
  → 3 (Clients) — needs 1, 2
  → 4 (Invoices) — needs 2, 3
  → 5 (Public + Stripe) — needs 2, 4
  → 6 (Dashboard) — needs 4, 5
  → 7 (Email) — needs 4, 5
  → 8 (PDF, Settings) — needs 4, 6
  → 9 (Security, DoD) — needs 2–8
  → 10 (Landing, Deploy) — needs 9
```

---

## Language & Responsiveness (reminder)

- **Language:** All UI, emails, errors, and docs in **English**.
- **Responsiveness:** Design for 320px (phone) first; test on 768px and 1024px+ (laptop). Use responsive utilities and FAB on mobile. Touch targets ≥ 44px where possible.

---

## Changelog

- [2025-02-18] Phase 3 implemented: Clients CRUD (list, create, update, delete), /clients page with search and edit dialog, ClientAutocomplete component.
- [2025-02-18] Phase 2 implemented: clients, invoices, payments, audit_logs tables; RLS and indexes; get_public_invoice(public_id) RPC; next_invoice_number(user_id) for INV-YYYY-NNNNNN; docs/DATABASE.md.
- [2025-02-17] Phase 1 implemented: Magic link auth, auth callback, login/logout, profiles table + migration + trigger, onboarding form, middleware protecting routes.
- [2025-02-17] Phase 0 implemented: Next.js 16, Tailwind v4, shadcn/ui, react-hook-form + zod, Supabase client/server, theme provider, responsive layout.
- [2025-02-17] Created technical plan; phases 0–10; English and mobile-first noted.
