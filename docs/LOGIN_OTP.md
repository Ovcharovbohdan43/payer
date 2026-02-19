# Login OTP (Password + Email Code)

## Overview

When a user signs in with **email + password**, they must enter a 5-digit code sent to their email before accessing the app. Magic link sign-in does not require OTP.

## Flow

1. User enters email + password on `/login` (Password tab).
2. If password is wrong → error shown, no email sent.
3. If password is correct and user has "remember 30 days" cookie → redirect to app (skip OTP).
4. Else: generate 5-digit code, store hash in `login_otps`, send email via Resend, set `otp_pending` cookie, redirect to `/login/verify-otp`.
5. User enters code. If correct: clear `otp_pending`, optionally set "remember 30 days" cookie, redirect to app.
6. Middleware: if user has session + `otp_pending` cookie and tries to access protected routes → redirect to `/login/verify-otp`.

## Details

- **Code:** 5 digits, 10000–99999. Validity: 5 minutes.
- **Remember:** Checkbox "Remember this device for 30 days". Signed cookie `puyer_remember`.
- **Storage:** `login_otps` table. Code stored as HMAC-SHA256 hash (never plaintext).

## Env

- `LOGIN_OTP_SECRET` — optional; used for OTP hashing. Fallback exists.
- `LOGIN_VERIFY_SECRET` — optional; used for remember cookie. Uses `CRON_SECRET` or fallback.
- `RESEND_API_KEY` — required for sending OTP emails.

## Version

- 2025-02-25 — Initial implementation
