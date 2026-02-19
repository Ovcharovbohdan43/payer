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
- **Stops when:** Invoice status becomes paid or void.
- **Setup:** Add `CRON_SECRET` to Vercel env; Vercel sends it as `Authorization: Bearer <CRON_SECRET>`.

## Templates

- `lib/email/templates.ts` — HTML templates for invoice and reminder
- Both include: business name, client name, amount, invoice number, "View & Pay" button, due date (if set)
- All user-provided values escaped to prevent XSS

## Version

- 2025-02-24 — Auto-reminders (1, 3, 7 days), cron endpoint, UI in create form and invoice detail
- 2025-02-22 — Phase 7 implemented
