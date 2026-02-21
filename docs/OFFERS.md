# Offers (Quotes / Estimates)

Offers allow you to send a price quote or estimate to a client before creating an invoice. The client can accept or decline, with an optional comment when declining.

## Flow

1. **Create offer** — Add client, line items (services), amounts, discounts, VAT, payment processing fee (optional). Same structure as invoices.
2. **Share link** — Copy the public URL (`/o/[publicId]`) and send it to the client (email, messaging, etc.).
3. **Client views** — Public page shows the offer total, line items, business info.
4. **Client action:**
   - **Accept** → Invoice is created from the offer; client is redirected to the invoice payment page.
   - **Decline** → Client can add a reason (optional); you see it in the offer detail and in activity.

## Statuses

| Status    | Description                          |
|-----------|--------------------------------------|
| Draft     | Created, not yet sent                |
| Sent      | Link shared, awaiting client action  |
| Viewed    | Client opened the link               |
| Accepted  | Client accepted; invoice created     |
| Declined  | Client declined (reason stored)      |
| Expired   | (Reserved for future use)            |

## Activity Feed

- **Offer accepted** — "ClientName accepted your offer" → links to offer detail.
- **Offer declined** — "ClientName declined your offer" → links to offer detail where you can see the reason.

## Database

- **offers** — Main table: user_id, client, number (OFF-YYYY-NNNNNN), public_id, status, amount_cents, decline_comment, invoice_id (when accepted).
- **offer_line_items** — Description, amount_cents, discount_percent, sort_order.
- **audit_logs** — entity_type: "offer", action: "accepted" | "declined", meta: client_name, comment (declined).

## Migrations

Apply in Supabase SQL Editor or via `supabase db push`:

1. `20250235000001_offers.sql` — Tables offers, offer_line_items.
2. `20250235000002_offers_rpc.sql` — RPCs get_public_offer, record_public_offer_viewed, next_offer_number.
3. `20250236000001_offers_payment_processing_fee.sql` — payment_processing_fee_included, payment_processing_fee_cents on offers.
