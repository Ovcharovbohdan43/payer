# Changelog

All notable changes to the Payer project.

## [Unreleased]

### [2025-02-18] – Dashboard & UX redesign (Design Spec 2026)

- **Layout:** AppShell with sidebar (Dashboard, Invoices, Clients, Settings), header with business name and sign out. Routes moved under `(app)` route group.
- **Theme:** Dark palette `#0B0F14` bg, `#121821` card, electric blue `#3B82F6` accent; glass effect, radius 20px, minimal borders.
- **Dashboard:** KPI cards (Revenue this month, Money owed, Overdue) with large numbers and glow; full-width Create Invoice CTA; Recent Invoices block with quick actions (copy link, send reminder); Activity Feed derived from invoice events.
- **Stats:** Added `overdueSumCents` to `computeDashboardStats` (Overdue shows amount, not just count).
- **Create invoice:** Simplified labels (Client name, Service, Amount); "More options" expandable; primary CTA "Create invoice".
- **Invoice detail:** Updated styling, status badge with color variants, timeline, actions.
- **Public invoice:** Minimal layout (business name, amount, service); [Pay] and [Download PDF] buttons.
- **Mobile:** Sticky bottom bar for Create Invoice on mobile; KPI cards horizontal scroll.
- **Empty state:** "Create your first invoice in 15 seconds" with CTA.
- **Docs:** `docs/DESIGN_SPEC_2026.md` — product design specification.

### [2025-02-18] – Phase 6: Dashboard cards + list sort + FAB; email rate limit docs

- **Email rate limit:** README documents Supabase Auth rate limits (Dashboard → Authentication → Rate Limits) and that app has no own limit; `.env.example` adds `REMINDER_RATE_LIMIT_HOURS=0` placeholder for Phase 7.
- **Dashboard:** Cards for Unpaid (sum + count), Paid this month (sum + count), Overdue (count); `lib/dashboard/stats.ts` with `computeDashboardStats(invoices, defaultCurrency)`; cards link to `/invoices?status=unpaid|paid|overdue`.
- **Invoices list:** `initialStatusFilter` from `?status=`; sort unpaid first then by `created_at` desc; filter options include Unpaid, Paid, Overdue.
- **FAB:** `DashboardFab` / `NewInvoiceFab` on dashboard and invoices page, visible only on mobile (`sm:hidden`), fixed bottom-right.

### [2025-02-18] – Phase 5: Viewed tracking + Stripe Checkout & webhook

- **Viewed tracking:** Migration `20250218100001_record_public_invoice_viewed.sql` adds RPC `record_public_invoice_viewed(p_public_id)`. Public page calls it when status is `sent`, then re-fetches so UI shows “viewed”.
- **Stripe:** Added `stripe` package; `lib/supabase/admin.ts` (service role client); `getSupabaseServiceRoleKey()` in `lib/supabase/env.ts`.
- **Checkout:** `POST /api/checkout` with body `{ publicId }` — fetches invoice by public_id (admin client), creates Stripe Checkout Session, stores `stripe_checkout_session_id`, returns `{ url }`. Public page “Pay” uses client `PayButton` that calls API and redirects to Stripe.
- **Webhook:** `POST /api/webhooks/stripe` — verifies signature, on `checkout.session.completed` updates invoice (`paid_at`, status `paid`) and inserts `payments` with `stripe_event_id` (idempotent). Uses admin client.
- **Env:** `.env.example` extended with `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; Stripe and service role required for Pay and webhooks.

### [2025-02-18] – Public invoice page (fix 404 on copy link)

- **Added:** Route `/i/[publicId]` — public invoice page. Fetches data via RPC `get_public_invoice(public_id)`; shows business name, invoice number, amount, status, description, due date, client; “Pay” placeholder for Phase 5 Stripe. Not found/void → 404.

### [2025-02-18] – Phase 4 completed (Invoices CRUD core)

- **Added:** `InvoiceDetailClient` component on `/invoices/[id]`: Copy link (and mark as sent if draft), Void invoice, Mark as paid (manual), placeholders for Download PDF and Send reminder.
- **Added:** Description and notes display on invoice detail page.
- **Added:** Dashboard quick links: “+ New invoice”, “Invoices”, “Clients”.
- **Fixed:** `useActionState` typing in `NewInvoiceForm`: use exported `CreateResult` from actions; discriminate union in `useEffect` and error display (`"error" in state`).
- **Fixed:** Zod v4 compatibility: `amountMajorSchema` uses `error` instead of `invalid_type_error` in `lib/validations/index.ts`.

### [2025-02-17] – Phase 2–3, Phase 4 (partial)

- Database migration: clients, invoices, payments, audit_logs; RLS; RPCs `get_public_invoice`, `next_invoice_number`.
- Clients CRUD: list, create, update, delete; ClientAutocomplete.
- Invoices: validations, actions (create, list, get, mark sent, void, mark paid manual), new form, list page, detail page (server); timeline and payment block.
