# Email Spam Compliance

Puyer sends transactional emails (invoices, reminders) and auth emails (login OTP, password reset, password change). This document describes compliance with anti-spam regulations and best practices.

## CAN-SPAM / GDPR / 2024 Requirements

### Invoice & Reminder Emails

- **Unsubscribe link** — Every invoice and reminder email includes an unsubscribe link in the footer.
- **List-Unsubscribe header** — `List-Unsubscribe: <url>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` are set so Gmail/Yahoo display a native one-click unsubscribe button.
- **Physical address** — Footer includes `MAILING_ADDRESS` (env) or fallback `support@puyer.org`.
- **Reply-To** — Use `EMAIL_FROM` with a valid reply address; recipients can reply to the business.

### Technical Measures

- **SPF / DKIM / DMARC** — Configure these for your sending domain in Resend (required for production).
- **Consistent From** — Use a stable `EMAIL_FROM` (e.g. `Puyer <invoices@puyer.org>`).
- **Avoid spam triggers** — No excessive caps, exclamation marks, or deceptive subject lines.
- **Valid HTML** — Tables for layout; minimal inline CSS; no suspicious attachments.

## Unsubscribe Flow

1. Recipient clicks "Unsubscribe" in the email footer (or Gmail one-click).
2. GET `/unsubscribe?email=...&token=...` — page loads, token is verified, email is added to `email_unsubscribes`.
3. POST (one-click) — same URL; returns 202 Accepted.
4. Future invoice/reminder sends to that email are skipped.

## Password Reset Template (Supabase)

Supabase sends password reset emails. Use a branded template.

**Redirect URL:** Add `https://your-domain.com/auth/reset-password` to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.

1. Open Supabase Dashboard → Authentication → Email Templates → Reset Password.
2. Copy HTML from `docs/email-templates/password-reset.html`.
3. Paste into the template editor. Supabase variables (`{{ .ConfirmationURL }}`, `{{ .Email }}`) remain as-is.
4. Set subject: `Reset your Puyer password`.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `MAILING_ADDRESS` | Physical address in email footer (CAN-SPAM). Default: `Puyer · support@puyer.org` |
| `UNSUBSCRIBE_SECRET` | Signs unsubscribe links. Falls back to `CRON_SECRET`. |
| `EMAIL_FROM` | Sender address. Use verified domain in production. |
