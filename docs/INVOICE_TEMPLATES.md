# Invoice templates

## Purpose

Save a **service** (one line) or a **set of lines** as a template and apply it to a new invoice in one click. Speeds up creating invoices for recurring work.

## How to save a template

- **Create invoice page:** Fill in at least one line (description + amount). Click **Save as template**, enter a name (e.g. "Consulting 1h"), then **Save**.
- **Edit invoice page:** Same: adjust the lines as needed, click **Save as template**, enter a name, **Save**.

Templates are stored per account. Name is required; max **200 characters**. Each template must have **1–50 line items** (description + amount; discount % optional).

## How to apply a template

- On **Create invoice**, if you have any templates you’ll see **Use a template**: choose one from the dropdown. The template’s lines are **added** to the current Services list. You can apply the same template again to add another copy of those lines, or add more services manually, then edit and submit as usual.

## Manage templates

- On the create invoice page, click **Manage templates** to open a list of your templates. From there you can **Delete** any template. Deleted templates cannot be restored.

## Limits and validation

- **Template name:** 1–200 characters, required.
- **Lines per template:** 1–50. Only lines with a non‑empty description and a valid amount are saved.
- When creating an invoice, the usual validation applies (e.g. at least one line; see `invoiceCreateSchema`).

## Currency

Templates store only **line content** (description, amount in cents, discount %). They do **not** store currency or other invoice settings. When you apply a template, amounts are shown in the form and interpreted in whatever currency you choose for the new invoice. The same template can be used with any currency.

## Technical

- **Tables:** `invoice_templates` (id, user_id, name, created_at), `invoice_template_items` (template_id, description, amount_cents, discount_percent, sort_order). RLS by user_id.
- **Actions:** `app/invoices/template-actions.ts` — listInvoiceTemplates, getInvoiceTemplate, createInvoiceTemplate, deleteInvoiceTemplate, renameInvoiceTemplate.

## Version

- 2025-03-18 — Initial doc (Phase 4).
