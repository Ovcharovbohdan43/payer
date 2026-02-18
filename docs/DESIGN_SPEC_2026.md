# Dashboard & UX Design Spec 2026

**Version:** 1.0  
**Date:** 2025-02-17

## Product philosophy

> The dashboard should not just show data. It should show: **money**, **debts**, **quick actions**.

---

## Layout structure

### 1. Header (top)
- **Left:** Payer (logo/brand)
- **Right:** Notifications icon, Business name, Sign out

### 2. Sidebar (left, always visible on desktop)
- Dashboard
- Invoices
- Clients
- Settings

### 3. Main KPI block
3 large cards:
- **Revenue this month** — paid this month total
- **Money owed** — unpaid total
- **Overdue** — overdue amount

Design: large numbers, soft gradient background, glow on hover, radius 20px.

### 4. Create Invoice CTA
- Primary action: full-width button, 56–64px height, accent color
- Mobile: sticky bottom bar with Create Invoice

### 5. Recent Invoices
- Client name — Amount — Status (colored)
- Quick actions: Copy link, Send reminder

### 6. Activity Feed
- ✓ John paid £300
- ✓ Invoice sent to Mike
- ⚠ Sarah overdue

### 7. Empty state
- "Create your first invoice in 15 seconds"
- [Create invoice] button

---

## Visual style 2026

| Element | Value |
|--------|-------|
| Background | `#0B0F14` |
| Card | `#121821` |
| Accent | Electric blue `#3B82F6` |
| Border | Almost invisible (`white/5`–`white/10`) |

### Card style
- Glass effect (backdrop-blur)
- Soft shadows
- Large padding
- Radius 20px
- Minimal borders

### Typography
- Large KPI numbers (3xl–4xl)
- Less text, more whitespace

### Micro-animations
- Hover glow
- Smooth transitions
- Loading skeleton (where applicable)

---

## Mobile UX

- KPI cards: horizontal scroll
- Create Invoice: sticky bottom bar
- Recent invoices: full width

---

## Create Invoice flow

**1 screen (primary):**
- Client name
- Service
- Amount
- [Create invoice]

**Expandable "More options":**
- Due date
- Notes

---

## Invoice detail page

- Status badge (PAID / UNPAID / etc.)
- Amount (large)
- Client name
- Timeline: Created → Sent → Viewed → Paid
- Actions: Copy link, Send reminder, Download PDF

---

## Public invoice page (client view)

Minimal layout:
- Business name
- Amount
- Service description
- [Pay]
- [Download PDF]

---

## File structure

```
Dashboard
  KPI cards
  Create invoice CTA
  Recent invoices
  Activity feed

Invoices
  List + filters

Invoice detail
  Status, amount, timeline, actions

Create invoice
  1 screen + More options

Clients
  Add form + list

Settings
  Placeholder (Phase 8)
```
