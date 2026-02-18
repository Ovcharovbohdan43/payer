# Supabase Rate Limits

Supabase limits how many **emails** can be sent for auth. This affects:
- **Magic link** sign-in (sends email)
- **Password registration** when "Confirm email" is ON (sends confirmation email)

If users see "email limit exceeded" or "too many requests", adjust the limits.

## How to fix

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **Authentication** → **Rate Limits**
3. Set **Email sign-ins per hour** to 100+ (or disable)
4. Save

## Option: Skip confirmation email for password signup

To avoid sending emails on registration (and thus avoid rate limits):
1. **Authentication** → **Providers** → **Email**
2. Turn **OFF** "Confirm email"
3. Users who sign up with password are logged in immediately (no confirmation email)

Magic link will still work; only the confirmation step for new password signups is skipped.
