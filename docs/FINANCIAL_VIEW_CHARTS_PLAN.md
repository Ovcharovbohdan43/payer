# Plan: Full Financial View — Charts & Animations

**Version:** 1.0  
**Date:** 2025-02-20  
**Library:** Recharts v3.x (installed)  
**Target page:** `/dashboard/analytics`

---

## 1. Overview

Transform the Financial Overview page from static stat blocks into a modern dashboard with animated charts, shadows, and gradients. All visualizations will use **Recharts** (React + D3), which supports:

- Built-in animations (duration, easing)
- SVG-based rendering (smooth, scalable)
- Filters for drop shadows
- Gradient fills
- Responsive containers

---

## 2. Data Sources (unchanged)

Existing `computeAnalytics()` returns:

- **Revenue:** `revenueThisWeekCents`, `revenueThisMonthCents`, `revenueAllTimeCents`
- **Invoices:** `paidCount`, `unpaidCount`, `overdueCount`, `paidSumCents`, `unpaidSumCents`, `overdueSumCents`
- **Payouts:** array of `{ amount_cents, currency, created_at, arrival_date }`
- **Business:** `clientCount`, `offerCount`, `offerAcceptedCount`, `offerDeclinedCount`, `paymentSuccessRate`

---

## 3. New Data Preparations

Extend `computeAnalytics()` or add helpers in `lib/dashboard/analytics.ts`:

### 3.1 Revenue by week (last 6–8 weeks)

```ts
// For AreaChart / LineChart
{ week: "Week 1", revenue: 1200, label: "Jan 1–7" }
```

Derive from invoices with `paid_at` grouped by week.

### 3.2 Invoice status distribution

Already available: `paidCount`, `unpaidCount`, `overdueCount` — for BarChart / PieChart.

### 3.3 Payouts over time

From `payouts[]` — group by month or week for a line/area chart.

---

## 4. Chart Components to Build

### 4.1 Revenue Area Chart

- **Type:** `AreaChart` with gradient fill
- **Data:** Weekly revenue (last 6–8 weeks)
- **Style:**
  - Gradient: `#3B82F6` → transparent (brand blue)
  - Stroke: `#3B82F6`
  - Shadow: SVG `filter` (drop-shadow) on the area
  - `animationDuration={800}` `animationEasing="ease-out"`
- **Responsive:** `ResponsiveContainer` height 220–280px

### 4.2 Invoice Status Bar Chart

- **Type:** `BarChart` (horizontal or vertical)
- **Data:** Paid / Unpaid / Overdue counts (and optionally amounts)
- **Style:**
  - Colors: emerald (paid), amber (unpaid), red (overdue)
  - Rounded bar corners
  - Shadow filter on bars
  - `animationDuration={600}` with stagger

### 4.3 Paid vs Unpaid Donut / Pie Chart

- **Type:** `PieChart` or `Cell`-based donut
- **Data:** `paidSumCents` vs `unpaidSumCents`
- **Style:**
  - Inner radius for donut
  - Gradient or solid brand colors
  - Shadow on segments
  - Animated entrance

### 4.4 Payouts Timeline (Line / Area)

- **Type:** `LineChart` or `AreaChart`
- **Data:** Payouts grouped by week/month
- **Style:**
  - Violet/indigo palette (`#8B5CF6`)
  - Smooth curve
  - Custom tooltip with formatted amounts

### 4.5 KPI Cards (Current)

- Keep existing `StatBlock` layout
- Add subtle `box-shadow` and `backdrop-blur` for depth
- Optional: small sparkline (Recharts `AreaChart` mini) inside each card

---

## 5. Shadow & Layout Styling

### 5.1 SVG drop shadow

```tsx
<defs>
  <filter id="chart-shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" floodColor="#000" />
  </filter>
</defs>
```

Apply to `Area`, `Bar`, `Pie` via `filter="url(#chart-shadow)"`.

### 5.2 Card sections

- `rounded-2xl`, `border border-white/[0.06]`
- `shadow-[0_4px_24px_rgba(0,0,0,0.25)]` or `shadow-xl`
- `bg-[#121821]/90 backdrop-blur`

---

## 6. Page Layout (Updated Structure)

```
1. Header + Back link
2. Revenue section
   - 3 KPI cards (This week, This month, All time)
   - Revenue Area Chart (new)
3. Invoices section
   - 4 stat blocks (Paid, Unpaid, Overdue, Success rate)
   - Invoice Status Bar Chart (new)
   - Paid vs Unpaid Donut Chart (new)
4. Payouts section
   - Payouts Timeline chart (new)
   - Payout list (existing)
5. Business metrics (unchanged)
```

---

## 7. Implementation Order

| Step | Task | Effort |
|------|------|--------|
| 1 | Add `revenueByWeek` / `payoutsByPeriod` to analytics data | S |
| 2 | Create reusable `ChartCard` with shadow & dark theme | S |
| 3 | Revenue Area Chart component | M |
| 4 | Invoice Status Bar Chart | M |
| 5 | Paid vs Unpaid Donut Chart | S |
| 6 | Payouts Timeline chart | M |
| 7 | Integrate into analytics page, responsive polish | M |
| 8 | Add SVG shadow filter, tweak colors & animation | S |

---

## 8. Design Tokens (Dark Theme)

- Background: `#0B0F14`, `#121821`
- Text: white, `white/70`, `white/50`
- Primary: `#3B82F6`
- Paid: `#10B981` (emerald)
- Unpaid: `#F59E0B` (amber)
- Overdue: `#EF4444` (red)
- Payouts: `#8B5CF6` (violet)

---

## 9. Accessibility & Performance

- Provide `aria-label` on chart containers
- Tooltips with formatted currency
- Empty states when no data
- Lazy-load charts (optional) if page gets heavy

---

## 10. Files to Touch

- `lib/dashboard/analytics.ts` — extend data
- `app/(app)/dashboard/analytics/page.tsx` — layout & charts
- `components/dashboard/` — new: `revenue-chart.tsx`, `invoice-chart.tsx`, `payouts-chart.tsx`, `chart-card.tsx`

---

*[2025-02-20] Created — Plan for Financial View charts using Recharts.*

---

## Changelog

- **[2025-02-20]** Implemented: extended `computeAnalytics` with `revenueByWeek`, `payoutsByPeriod`; added `ChartCard`, `RevenueChart`, `InvoiceBarChart`, `InvoiceDonutChart`, `PayoutsChart`; integrated into `/dashboard/analytics`.
