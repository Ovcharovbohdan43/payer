# Supabase Rate Limits (Magic Links)

Magic link sign-in is limited by Supabase. If users often see "too many requests" or cannot receive new links, adjust the limits.

## How to change

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **Authentication** → **Rate Limits**
3. Adjust:
   - **Email sign-ins per hour** — increase (e.g. 100–500) or disable
   - **SMS OTP per hour** — only if using SMS
4. Save

## Recommendation for Payer

- **Development:** Disable rate limits or set Email sign-ins to 100+
- **Production:** Set to 100+ per hour per IP so users can reliably sign in

Supabase default is often 4–10 per hour, which blocks frequent sign-ins.
