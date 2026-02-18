# Payer — Database

## Migrations

Run in order (Supabase SQL Editor or `supabase db push`):

1. `supabase/migrations/20250217000001_create_profiles.sql` — profiles + trigger
2. `supabase/migrations/20250218000001_create_clients_invoices_payments_audit.sql` — clients, invoices, payments, audit_logs, RLS, indexes, `get_public_invoice`, `next_invoice_number`
3. `supabase/migrations/20250218100001_record_public_invoice_viewed.sql` — RPC `record_public_invoice_viewed(public_id)` to set `viewed_at` and status `viewed` on first public page load (callable by anon)

## Public invoice access

- **Never** expose `invoices` by internal `id` or `user_id` to unauthenticated users.
- Public invoice data is available **only** by `public_id` via:
  - **RPC:** `select * from get_public_invoice('...public_id...')`  
  - Returns: `business_name`, `invoice_number`, `amount_cents`, `currency`, `description`, `due_date`, `status`, `client_name` (no `user_id`, no internal `id`).
- Use this from the public invoice page; call with anon client.
- **Record view:** Call `record_public_invoice_viewed(public_id)` on first load when status is `sent`; RPC updates `viewed_at` and status to `viewed` (idempotent).

## Invoice numbers

- Format: `INV-YYYY-NNNNNN` (e.g. INV-2025-000001), unique per user per year.
- Generate in app: `select next_invoice_number(auth.uid());` (requires authenticated session).

## Payments insert

- RLS on `payments` allows only **SELECT** for users (for their invoices).
- **INSERT** into `payments` must be done with **service role** (e.g. Stripe webhook handler); anon/authenticated cannot insert.
