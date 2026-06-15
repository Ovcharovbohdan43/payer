# Invoice design templates

## Purpose

Invoice design templates let a user customize and preview the visual style of invoices. The selected style is used consistently for:

- PDF invoice downloads
- Public invoice payment pages
- Invoice and reminder emails

This is separate from **service templates** in `invoice_templates`, which only store reusable line items.

## Detailed description

Puyer supports:

- **Built-in base styles:** `Classic`, `Modern`, `Minimal`
- **Visual editor:** accent color, header style, logo/business details/notes visibility, pay button style
- **PDF preview:** A4-like preview beside Services, updated as the user edits line items, discounts, VAT, fee, due date, and notes
- **Saved visual templates:** user-defined configs stored in `invoice_visual_templates`
- **Per-invoice snapshot:** full config stored in `invoices.invoice_design_config`

Business data and logo come from the user profile. New invoices snapshot the chosen visual config, so changing defaults later does not unexpectedly alter already-created invoices.

## How to use

1. Go to **Settings → Invoice design** and optionally choose a default saved visual template.
2. Create or edit an invoice and open the **Visual invoice editor** block.
3. Adjust colors, header style, and visibility toggles while watching the **Live preview**.
4. Fill **Services** and review the **PDF invoice preview** to see the downloaded PDF structure before creating the invoice.
5. Click **Save visual template** to reuse the design later.
6. Create/send the invoice and verify the public page, PDF, and email match the preview.

Existing invoices can be edited while they are not paid or voided. The edit page includes the same visual editor and live preview.

## Examples

- A contractor can save a branded blue template with logo and business details visible.
- A consultant can use a dark header with a green accent and filled pay button.
- A freelancer can use a light minimal template with outline pay button.

## How to test

1. Run migrations including `20250320000001_invoice_design_templates.sql` and `20250321000001_invoice_visual_templates.sql`.
2. Create an invoice, change accent color/header style, and confirm the live preview updates immediately.
3. Add services, discounts, VAT/fee, due date, and notes; confirm the PDF preview updates immediately.
4. Save a visual template, apply it to a new invoice, and set it as default in Settings.
5. Create the invoice and verify `invoice_design_config` is stored.
6. Open `/i/[publicId]` and confirm the public page matches the preview.
7. Download owner and public PDFs and confirm colors/styles match the saved config.
8. Send invoice and reminder emails and confirm the HTML uses the saved accent/button colors.
9. Edit an unpaid invoice, change the visual config/services, and verify outputs update.

## Limitations

- No drag-and-drop block reordering in MVP.
- Preview is web-based and closely matches the public page; PDF uses the same theme tokens but is not pixel-perfect.
- Logos are still stored as one profile logo and reused across all invoice designs.
- WebP logos are supported in the web UI, but PDF embedding still supports PNG/JPEG best.
- Offer-to-invoice conversion currently uses the Classic invoice design.

## Modules affected

- `lib/invoice-designs.ts`
- `lib/invoice-visual-config.ts`
- `app/invoices/visual-template-actions.ts`
- `components/invoices/invoice-visual-editor.tsx`
- `components/invoices/invoice-visual-preview.tsx`
- `components/invoices/invoice-pdf-preview.tsx`
- `lib/validations/index.ts`
- `app/invoices/actions.ts`
- `app/invoices/new/new-invoice-form.tsx`
- `app/(app)/invoices/new/page.tsx`
- `app/(app)/invoices/[id]/edit/edit-invoice-form.tsx`
- `app/(app)/settings/page.tsx`
- `app/(app)/settings/settings-form.tsx`
- `app/(app)/settings/actions.ts`
- `app/i/[publicId]/page.tsx`
- `lib/pdf/invoice-pdf.ts`
- `components/pdf/*`
- `lib/email/templates.ts`
- `supabase/migrations/20250320000001_invoice_design_templates.sql`
- `supabase/migrations/20250321000001_invoice_visual_templates.sql`

## Version

- [2026-06-15] – Added: PDF-like services preview for the downloaded invoice layout.
- [2026-06-15] – Added: visual invoice editor with live preview and saved visual templates.
- [2026-06-15] – Added: built-in invoice design templates for PDF, public invoice pages, and emails.
