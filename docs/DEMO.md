# Demo flow

## Overview

Users can try Puyer without signing up by creating a demo invoice. The flow is designed to showcase the product while preventing abuse.

## Flow

1. **Landing** → User clicks "Try now"
2. **Demo form** (`/demo`) → Simplified invoice form: client name, line items, currency, optional VAT
3. **Success** (`/demo/success`) → CTA: "Liked it? Create an account"
4. **Public invoice** (`/i/[publicId]`) → Demo invoices show a special payment area instead of Stripe Checkout:
   - Explains that clients would pay here
   - "This is demo mode — no real payments"
   - CTA: "Sign up to enable payments"
   - QR code links to same page (scan to view)

## Anti-abuse

- **Rate limit**: 3 demo invoices per IP per 24 hours
- **Expiry**: Demo invoices expire after 24 hours
- **IP hashing**: Uses `DEMO_RATE_LIMIT_SECRET` (or fallback) for privacy-preserving hashing
- No Stripe, no email sending, no PDF download for demos

## Technical

- Table: `demo_invoices` (ephemeral)
- RPC: `get_demo_public_invoice(public_id)` — same shape as `get_public_invoice`
- Server action: `createDemoInvoiceAction` (rate limited, uses admin client)
- Public page checks real invoices first, then demo

## Changelog

- [2025-02-22] Added: Demo flow with "Try now" button, rate limiting, demo payment area
