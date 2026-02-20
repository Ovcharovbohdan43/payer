# Changelog

All notable changes to the Puyer project.

## [Unreleased]

### [2025-02-28] – Recurring invoices

- **Create invoice:** Checkbox "Recurring invoice — auto-generate and send at interval" in More options. Requires client email. Interval: every X minutes (test) or X days.
- **Form:** Interval selector: minutes (1–60, test mode) or days (1–365). Recurring only works with "Create & send email".
- **Cron:** `GET /api/cron/recurring` runs every minute. Finds templates (recurring=true, sent) due for next run, creates copy, sends email, updates last_recurred_at.
- **Migration:** `20250228000001_recurring_invoices.sql` — recurring, recurring_interval, recurring_interval_value, last_recurred_at, recurring_parent_id.
- **Detail:** Shows "Recurring: every X days/minutes" or "Auto-generated from recurring template".

### [2025-02-27] – Payment processing fee (Stripe 1.5% + fixed)

- **Create invoice:** Checkbox "Include payment processing fee in invoice (1.5% + fixed)" next to VAT. When enabled, fee is added to total.
- **Calculation:** `calcPaymentProcessingFeeCents()` — 1.5% + fixed per currency (GBP 20p, USD/EUR/other 30¢). Amount is derived so that after Stripe deduction the net equals subtotal+VAT.
- **PDF:** Row "Payment processing fee" with amount; Total always uses canonical `amount_cents`.
- **Migration:** `20250227000001_payment_processing_fee.sql` — `payment_processing_fee_included`, `payment_processing_fee_cents`; `get_public_invoice` returns both.

### [2025-02-25] – Login OTP (password + email code)

- **Flow:** Password sign-in → 5-digit code sent by email (5 min validity) → enter code → access. Magic link unchanged (no OTP).
- **Remember 30 days:** After entering the correct code, user can tick "Remember this device for 30 days" to skip OTP on next password login.
- **Migration:** `20250225000001_login_otps.sql` — table for OTP hashes (HMAC). RLS: users manage own OTPs.
- **Env:** `LOGIN_OTP_SECRET` (optional), `LOGIN_VERIFY_SECRET` (optional, for remember cookie).

### [2025-02-24] – Auto-reminders (1, 3, 7 days after send)

- **Create form:** "More options" — checkbox "Auto-remind client" and select days (1, 3, 7). Shown when client has email.
- **Invoice detail:** Toggle "Auto-remind client (1, 3, 7 days after sent)" for sent/viewed/overdue invoices with client email.
- **Cron:** `GET /api/cron/reminders` protected by `CRON_SECRET` (Bearer). Vercel Cron runs daily at 9:00 UTC.
- **Logic:** `lib/reminders/run-auto-reminders.ts` selects invoices with `auto_remind_enabled`, status sent/viewed/overdue, sends reminders at 1/3/7 days after `sent_at`, updates `reminder_1d_sent_at` etc. Stops when invoice becomes paid/void.
- **Migration:** `20250224000001_auto_remind.sql` — `auto_remind_enabled`, `auto_remind_days`, `reminder_1d_sent_at`, `reminder_3d_sent_at`, `reminder_7d_sent_at`.

### [2025-02-23] – Rebrand Payer → Puyer (puyer.org)

- Renamed app/brand from Payer to Puyer across UI, docs, emails, PDF, package.json.

### [2025-02-23] – Password registration & login

- **Register:** `/register` — form: email, name, business name, password. Creates account with Supabase signUp; profile gets business_name from user_metadata (trigger updated).
- **Login:** Toggle "Magic link" | "Password". Magic link unchanged; password sign-in via `signInWithPassword`. Link to Create account.
- **Settings:** "Account security" — Set password (for magic-link users). Explanation: "so you can always sign in with email and password, even if magic links don't work."
- **Migration:** `20250223000001_profile_from_signup_metadata.sql` — trigger uses business_name from signUp metadata.

### [2025-02-22] – Landing page, mobile-first responsive

- **Landing:** Full landing page with Hero, Features (6 cards), How it works (3 steps), Pricing, CTA, Footer. Same palette (#0B0F14, #121821, #3B82F6).
- **Mobile:** min-w-0 overflow-x-hidden, responsive typography (text-3xl→6xl), touch-manipulation on buttons (min 44px), min-[375px] breakpoints, responsive padding/gaps.

### [2025-02-22] – Activity feed Load more, Supabase rate limits docs

- **Activity feed:** Shows first 6 items; "Load more" button reveals the rest (no infinite stretch).
- **Docs:** `docs/SUPABASE_RATE_LIMITS.md` — how to increase/disable magic link rate limits in Supabase Dashboard.

### [2025-02-22] – Phase 7: Email & Reminders

- **Resend:** `resend` package; `lib/email/send.ts` and `lib/email/templates.ts` for HTML email templates. Env: `RESEND_API_KEY`, optional `EMAIL_FROM` (default `Puyer <onboarding@resend.dev>`).
- **Send invoice email:** "Create & send email" on new invoice form sends email after create; "Send by email" button on invoice detail. Graceful: if email fails, invoice is still created; toast warns user.
- **Manual reminder:** "Send reminder" button on invoice detail and Recent Invoices (dashboard). Rate limit: 1 per `REMINDER_RATE_LIMIT_HOURS` (default 24; 0 = no limit for debug).
- **Migration:** `20250222000001_add_last_reminder_at.sql` — adds `last_reminder_at` to invoices for rate limiting.
- **Templates:** Invoice and reminder HTML emails with "View & Pay" button, business name, amount, due date. All strings escaped to prevent injection.

### [2025-02-20] – Multiple services per invoice

- **Form:** Create invoice with multiple line items (services). Add/remove rows via “Add service” and trash icon. Each row: description + amount.
- **Validation:** `invoiceCreateSchema` requires `lineItems` array (min 1). Legacy `description`/`amount` removed.
- **Create action:** Inserts `invoice_line_items` per row; `invoices.amount_cents` = sum (with VAT when `vat_included=false`).
- **PDF:** Renders each line item in the table; VAT and Total rows unchanged. Falls back to single “Invoice payment” row when `lineItems` empty (legacy).
- **Public page & detail:** Display line items with description and amount instead of single description.
- **Migration:** `20250220000001_add_invoice_line_items.sql` — table `invoice_line_items`, migrates existing invoices, updates `get_public_invoice` RPC to return `line_items`.

### [2025-02-19] – VAT / tax support

- **Settings:** Toggle "VAT included in price" — when checked, entered amount is gross; when unchecked, VAT 20% is added on top.
- **Create invoice:** When VAT included: shows "VAT (20%) is included in the price." When not: shows live preview "+ VAT (20%): X → Total: Y".
- **PDF:** VAT row and Total row when vat_included is set. vat_included=true: Subtotal (net), VAT (20% incl.), Total. vat_included=false: Subtotal, VAT (20%), Total. Legacy invoices (vat_included null) render without VAT row.
- **Checkout:** Charges total with VAT when vat_included=false.
- **Display:** Invoice list, detail, public page, dashboard stats, activity use getDisplayAmountCents (total with VAT when applicable).
- **Migration:** `20250219000001_add_invoice_vat.sql` adds vat_included column, updates get_public_invoice.

### [2025-02-18] – Invoice PDF generator improvements

- **PDF layout:** Professional invoice layout with header (business name, INVOICE, invoice number, date), Bill to (client name, email), items table (description with word wrap, amount), due date, status, notes, footer.
- **Word wrap:** Long description and notes wrap to fit page width via `font.widthOfTextAtSize`.
- **Metadata:** PDF title and author set for better file properties.
- **Owner PDF:** Passes `createdAt`, `clientEmail`, `notes` for full invoice details.

### [2025-02-18] – Payment success screen

- **Public invoice:** After successful Stripe payment, user is redirected to `/i/[publicId]?paid=1` and sees a dedicated "Payment successful" screen with checkmark, thank-you message, invoice summary, and Download PDF. Shows success optimistically when `?paid=1` (even before webhook updates DB) or when `status=paid`.

### [2025-02-18] – Stripe CLI setup

- **Stripe CLI:** Downloaded v1.35.1 (Windows x86_64) to `tools/stripe.exe`. Run `npm run stripe:login` to authenticate; `npm run stripe:listen` for webhook forwarding. Add printed `whsec_...` to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### [2025-02-18] – Phase 8: PDF, Settings & Polish

- **PDF:** `pdf-lib` for invoice PDF. `GET /api/invoices/[id]/pdf` (owner), `GET /api/invoices/public/[publicId]/pdf` (public). Download PDF in invoice detail and public page.
- **Settings:** Full page: business name, currency, country, timezone, VAT toggle. Billing placeholder. `updateProfileAction`, `SettingsForm`.

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
