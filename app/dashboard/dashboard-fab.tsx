"use client";

/** Desktop: one Create button in content. Mobile: bottom nav Create. No floating FAB. */
export function DashboardFab() {
  return <NewInvoiceFab />;
}

/** Hidden — desktop has content button, mobile has bottom nav Create. */
export function NewInvoiceFab() {
  return null;
}
