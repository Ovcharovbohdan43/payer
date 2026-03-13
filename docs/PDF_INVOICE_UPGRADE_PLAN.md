# Plan: Upgrade PDF Invoice Generator

**Version:** 1.0  
**Date:** 2025-02-20  
**Current:** pdf-lib v1.17.1  
**Target:** @react-pdf/renderer v4.x (installed)

---

## 1. Overview

Migrate from **pdf-lib** (low-level, imperative) to **@react-pdf/renderer** (React components, declarative) for invoice PDF generation. Benefits:

- **React components** — `Document`, `Page`, `View`, `Text`, `Image`, `StyleSheet`
- **Flexbox layout** — no manual Y-positioning
- **StyleSheet** — CSS-like styling, maintainable
- **Better typography** — hyphenation, text wrapping, custom fonts
- **Unicode** — proper support (no Cyrillic→Latin transliteration hacks)
- **Image** — logos with built-in handling; possible WebP via fetch+convert

---

## 2. Current Implementation

**File:** `lib/pdf/invoice-pdf.ts` (~620 lines)

- Uses `PDFDocument`, `StandardFonts.Helvetica`, manual `page.drawText`, `page.drawRectangle`
- `toAsciiSafe()` — Cyrillic transliteration (StandardFonts are WinAnsi)
- Logo: `embedPng` / `embedJpg` (no WebP)
- Structure: header (logo + contact) → INVOICE # → Bill to → items table → discount / fee / VAT / total → due date → notes → footer

**API:**  
`generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array>` — returns raw bytes.

**Consumers:**
- `GET /api/invoices/[id]/pdf`
- `GET /api/invoices/public/[publicId]/pdf`

---

## 3. Target Stack

| Item | Choice |
|------|--------|
| Library | @react-pdf/renderer |
| Render | `renderToBuffer()` (returns `Promise<Buffer>`) |
| Layout | Flexbox via `View`, `StyleSheet` |
| Fonts | Built-in Helvetica (or register custom for Cyrillic) |
| Logo | `Image` component, `src` from URL (fetch or data URI) |

---

## 4. New Structure

### 4.1 Components

```
components/pdf/
  InvoiceDocument.tsx    — Document wrapper
  InvoicePage.tsx       — Single Page
  InvoiceHeader.tsx     — Logo + business name + contact
  InvoiceTitle.tsx      — INVOICE #, date
  BillTo.tsx            — Client block
  InvoiceTable.tsx      — Line items table
  InvoiceTotals.tsx     — Discount, fee, VAT, total
  InvoiceFooter.tsx     — Thank you, Puyer, terms
  styles.ts             — StyleSheet.create({...})
```

### 4.2 Data Contract

Keep `InvoicePdfData` unchanged so API routes require no changes. Only `generateInvoicePdf` internals change.

---

## 5. Implementation Steps

| Step | Task | Effort |
|------|------|--------|
| 1 | Create `components/pdf/` folder, `styles.ts` | S |
| 2 | `InvoiceDocument` + `InvoicePage` (blank A4) | S |
| 3 | `InvoiceHeader` (logo via Image, business name, contact) | M |
| 4 | `InvoiceTitle` (#, date) | S |
| 5 | `BillTo` (client name, company, address, email, etc.) | S |
| 6 | `InvoiceTable` (Description, Amount; line items, wrap) | M |
| 7 | `InvoiceTotals` (discount, fee, VAT, total) | M |
| 8 | `InvoiceFooter` (thank you, Powered by Puyer, terms) | S |
| 9 | `generateInvoicePdf` — render `<InvoiceDocument data={...} />` via `renderToBuffer` | M |
| 10 | Remove `toAsciiSafe` (or keep only for legacy edge cases) | S |
| 11 | WebP logo: fetch → canvas/node-canvas → PNG buffer, or skip (same as today) | S |
| 12 | Test: owner PDF, public PDF, multi-line items, discount, fee, VAT | M |
| 13 | Remove pdf-lib dependency | S |

---

## 6. Technical Notes

### 6.1 renderToBuffer

```ts
import { renderToBuffer } from "@react-pdf/renderer";
const buffer = await renderToBuffer(<InvoiceDocument data={data} />);
return new Uint8Array(buffer);
```

### 6.2 StyleSheet

- Use `StyleSheet.create()` for performance
- Flexbox: `flexDirection: "row"`, `justifyContent: "space-between"`, `alignItems`
- Page: `padding`, `fontSize`, `fontFamily: "Helvetica"`
- Table: `flexDirection: "row"`, borders via `borderWidth`, `borderColor`

### 6.3 Image / Logo

- `Image src={logoUrl}` — react-pdf fetches URLs
- WebP: react-pdf may not support; fallback: skip or convert server-side

### 6.4 Unicode

- Built-in fonts (Helvetica) in react-pdf support more glyphs than pdf-lib’s StandardFonts
- Test Cyrillic; if needed, register custom font (e.g. Inter, Noto Sans)

### 6.5 Page Break

- Long tables: wrap rows in `<View wrap>` or use `<Text break>` for automatic flow

---

## 7. Files to Change

| File | Action |
|------|--------|
| `lib/pdf/invoice-pdf.ts` | Replace pdf-lib logic with `renderToBuffer(<InvoiceDocument data={data} />)`; keep `InvoicePdfData` type and export |
| `components/pdf/*.tsx` | New React components |
| `app/api/invoices/[id]/pdf/route.ts` | No change (uses `generateInvoicePdf`) |
| `app/api/invoices/public/[publicId]/pdf/route.ts` | No change |
| `package.json` | Remove `pdf-lib` after migration |

---

## 8. Rollback

Keep `lib/pdf/invoice-pdf-pdflib.ts` (or git) as backup during migration. Switch back by restoring the old `generateInvoicePdf` implementation.

---

## 9. Design Tokens (Match Current)

- Page: A4 (595 × 842 pt)
- Margins: 52 pt
- Colors: text ~#262626, muted ~#666, borders ~#d1d1d1
- Typography: Helvetica 10/11/16/22 pt

---

*[2025-02-20] Created — Plan for migrating invoice PDF from pdf-lib to @react-pdf/renderer.*

---

## 10. Troubleshooting

### PDF won't open after download (corrupted file)

**Symptom:** Downloaded invoice PDF cannot be opened by Acrobat/Preview/other viewers; file appears invalid or corrupted.

**Cause:** Next.js (especially with Turbopack) can incorrectly bundle `@react-pdf/renderer`, causing it to produce invalid binary output.

**Fix (applied 2025-03-13):**
- Add `serverComponentsExternalPackages: ["@react-pdf/renderer"]` to `next.config.ts` → `experimental` so the library is loaded as an external Node.js module.
- Ensure PDF API routes use `runtime = "nodejs"` and `dynamic = "force-dynamic"`.
- Add `Content-Length` header for correct binary delivery.

**If issue persists:** Use Node.js 22+ (helps with ESM), or try `next dev --no-turbopack` to rule out Turbopack bundling.

---

## Changelog

- **[2025-03-13]** Fixed PDF download: added `serverComponentsExternalPackages`, `runtime`, `Content-Length`; PDF opens correctly after download.
- **[2025-02-20]** Implemented: migrated from pdf-lib to @react-pdf/renderer. New components: `InvoiceDocument`, `InvoiceHeader`, `InvoiceTitle`, `BillTo`, `InvoiceTable`, `InvoiceTotals`, `InvoiceFooter`. `generateInvoicePdf` uses `renderToBuffer`. Removed pdf-lib dependency.
