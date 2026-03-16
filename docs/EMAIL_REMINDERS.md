# Phase 7: Email & Reminders

## Overview

- **Provider:** Resend
- **Features:** Send invoice by email; manual reminder with rate limit
- **No PII in logs:** Only success/failure and error codes logged

## Setup

1. Create API key at [resend.com/api-keys](https://resend.com/api-keys)
2. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_...
   ```
3. For development: use default `onboarding@resend.dev` as sender (Resend allows this without domain verification)
4. For production: verify your domain in Resend Dashboard → Domains

### Optional

- `EMAIL_FROM` — Sender address (default: `Puyer <onboarding@resend.dev>`)
- `REMINDER_RATE_LIMIT_HOURS` — Limit reminders per invoice (default: 24). Set to `0` to disable during debugging

## Flows

### Send invoice email

- **Create & send email** — On new invoice form when client has email. Creates invoice, sends email, redirects. If email fails, invoice is still created; toast warns user.
- **Send by email** — On invoice detail page. Button visible when invoice has `client_email` and status is not paid/void.

### Send reminder

- **Invoice detail** — "Send reminder" when status is draft/sent/viewed/overdue and client has email.
- **Recent Invoices (dashboard)** — Send icon on each row when applicable.
- **Rate limit:** One reminder per `REMINDER_RATE_LIMIT_HOURS` per invoice. Error message shows wait time.

### Auto-reminders

- **Enable:** On create (More options) or on invoice detail for sent invoices. Requires client email.
- **Schedule:** 1, 3, 7 days after `sent_at`. User can choose subset (e.g. only 3 and 7).
- **Cron:** `/api/cron/reminders` runs daily (Vercel Cron, 9:00 UTC). Protected by `CRON_SECRET` (Bearer token).
  - **Step 1:** Set `status = 'overdue'` for invoices with `status` in (sent, viewed) and `due_date < today` (UTC). So the Overdue filter and dashboard counts stay correct.
  - **Step 2:** Run auto-reminders (scheduled by `auto_remind_days` after `sent_at`).
  - **Step 3 (escalation):** For each invoice with `status = 'overdue'`, `due_date` set, `escalation_sent_at` null, and ≥ 7 days past `due_date`: send one **overdue reminder** to the client (subject "Overdue reminder: Invoice …") and, if the profile setting allows, a **copy to the owner** (email from auth) with subject "[Puyer] Overdue reminder sent: Invoice #X — Client". Then set `escalation_sent_at` and `last_reminder_at` so we never send escalation again for that invoice.
- **Response:** `{ ok, overdueUpdated, sent, errors }`.
- **Stops when:** Invoice status becomes paid or void.
- **Copy to owner:** Controlled by `profiles.escalation_cc_owner` (default true). Owner email is resolved via Supabase Auth (`auth.admin.getUserById(user_id)`). Toggle in **Settings → Reminders**: “Copy to me when overdue reminder is sent”.
- **Setup:** Add `CRON_SECRET` to Vercel env; Vercel sends it as `Authorization: Bearer <CRON_SECRET>`.

## Templates

- `lib/email/templates.ts` — HTML templates for invoice and reminder
- Both include: business name, client name, amount, invoice number, "View & Pay" button, due date (if set)
- All user-provided values escaped to prevent XSS

## Reliability & monitoring (Phase 4)

- **Idempotency:** Each reminder type (1d, 3d, 7d, …) is sent at most once per invoice (`reminder_Xd_sent_at`). Escalation is sent at most once (`escalation_sent_at`). Manual reminders remain rate-limited by `REMINDER_RATE_LIMIT_HOURS`.
- **Unsubscribe:** All reminder and escalation emails to clients go through `sendReminderEmail`, which checks `email_unsubscribes` via `isEmailUnsubscribed`. Owner copy is not marketing and has no unsubscribe.
- **Logging:** Cron logs `[set-overdue] marked N invoice(s) as overdue`; `runAutoReminders` logs send failures and `[auto-remind] escalation sent invoiceId=…` on success (no PII). Response JSON includes `overdueUpdated`, `sent`, `errors`.
- **Tests:** `lib/reminders/reminder-schedule.ts` exposes pure helpers `getScheduledDaysDue` and `isEscalationDue`. Unit tests in `lib/reminders/reminder-schedule.test.ts` (Vitest). Run `npm run test`.

## Version

- 2025-03-17 — Phase 4: logging (escalation sent), reminder-schedule.ts + Vitest unit tests, Reliability & monitoring section in docs.
- 2025-03-17 — Phase 3: Settings → Reminders toggle for copy-to-owner; activity feed shows “Reminder sent (Nd)” and “Overdue reminder sent”; Help FAQ “What are smart reminders and escalation?”.
- 2025-03-17 — Phase 2: escalation (overdue ≥ 7 days → one reminder to client + optional copy to owner). New: `invoices.escalation_sent_at`, `profiles.escalation_cc_owner`. Templates: `buildEscalationCopyToOwnerHtml`, `sendEscalationCopyToOwnerEmail`. See `docs/SMART_REMINDERS_ESCALATION_PLAN.md`.
- 2025-03-15 — Cron: set overdue status before reminders; response includes `overdueUpdated`. See `lib/reminders/set-overdue-status.ts`.
- 2025-02-24 — Auto-reminders (1, 3, 7 days), cron endpoint, UI in create form and invoice detail
- 2025-02-22 — Phase 7 implemented
