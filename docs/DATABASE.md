# Puyer — Database

## Migrations

Run in order (Supabase SQL Editor or `supabase db push`):

1. `supabase/migrations/20250217000001_create_profiles.sql` — profiles + trigger
2. `supabase/migrations/20250218000001_create_clients_invoices_payments_audit.sql` — clients, invoices, payments, audit_logs, RLS, indexes, `get_public_invoice`, `next_invoice_number`
3. `supabase/migrations/20250218100001_record_public_invoice_viewed.sql` — RPC `record_public_invoice_viewed(public_id)` to set `viewed_at` and status `viewed` on first public page load (callable by anon)
4. `supabase/migrations/20250219000001_add_invoice_vat.sql` — vat_included, get_public_invoice update
5. `supabase/migrations/20250220000001_add_invoice_line_items.sql` — invoice_line_items, line_items in get_public_invoice
6. `supabase/migrations/20250221000001_stripe_connect_and_payouts.sql` — stripe_connect_account_id, payouts table
7. `supabase/migrations/20250222000001_add_last_reminder_at.sql` — last_reminder_at for reminder rate limiting
8. `supabase/migrations/20250223000001_profile_from_signup_metadata.sql` — handle_new_user uses business_name from signUp user_metadata
9. `supabase/migrations/20250231000001_email_unsubscribes.sql` — email_unsubscribes table for opt-out from invoice/reminder emails
10. `supabase/migrations/20250232000001_business_contact_logo.sql` — profiles: address, phone, company_number, vat_number, logo_url (contact & legal info for invoices)
11. `supabase/migrations/20250232000002_get_public_invoice_contact_logo.sql` — get_public_invoice returns logo_url, address, phone, company_number, vat_number
12. `supabase/migrations/20250232000003_storage_logos_bucket.sql` — storage bucket `logos` (public, 1MB, PNG/JPEG/WebP); RLS for authenticated upload/delete in own folder
13. `supabase/migrations/20250232000004_storage_logos_policies_fix.sql` — fix logos RLS (path prefix check + SELECT for upsert)
14. `supabase/migrations/20250233000001_invoice_discounts.sql` — invoice_line_items.discount_percent, invoices.discount_type, discount_value
15. `supabase/migrations/20250233000002_get_public_invoice_discounts.sql` — get_public_invoice returns discount fields
16. `supabase/migrations/20250238000001_subscription_plan.sql` — profiles: stripe_customer_id, subscription_status (free/active/canceled/past_due/trialing)
17. `supabase/migrations/20250238000002_subscription_manual_grant.sql` — RPCs grant_pro_subscription, revoke_pro_subscription (manual Pro grant via Supabase)
18. `supabase/migrations/20250318000001_invoice_templates.sql` — invoice_templates, invoice_template_items (saved line-item sets for one-click apply on new invoice); RLS by user_id

## Public invoice access

- **Never** expose `invoices` by internal `id` or `user_id` to unauthenticated users.
- Public invoice data is available **only** by `public_id` via:
  - **RPC:** `select * from get_public_invoice('...public_id...')`  
  - Returns: `business_name`, `invoice_number`, `amount_cents`, `currency`, `line_items`, `due_date`, `status`, `client_name`, `logo_url`, `address`, `phone`, `company_number`, `vat_number` (no `user_id`, no internal `id`).
- Use this from the public invoice page; call with anon client.
- **Record view:** Call `record_public_invoice_viewed(public_id)` on first load when status is `sent`; RPC updates `viewed_at` and status to `viewed` (idempotent).

## Invoice numbers

- Format: `INV-YYYY-NNNNNN` (e.g. INV-2025-000001), unique per user per year.
- Generate in app: `select next_invoice_number(auth.uid());` (requires authenticated session).

## Payments insert

- RLS on `payments` allows only **SELECT** for users (for their invoices).
- **INSERT** into `payments` must be done with **service role** (e.g. Stripe webhook handler); anon/authenticated cannot insert.
