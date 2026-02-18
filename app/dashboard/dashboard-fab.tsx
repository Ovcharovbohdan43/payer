"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

/** Sticky bottom CTA for "Create Invoice" on tablet/desktop. Hidden on mobile (use MobileNav Create). */
export function DashboardFab() {
  return <NewInvoiceFab />;
}

/** FAB linking to new invoice. Shown on sm+ (mobile uses bottom nav Create). */
export function NewInvoiceFab() {
  return (
    <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
      <Link
        href="/invoices/new"
        className="flex h-14 items-center gap-2 rounded-xl bg-[#3B82F6] px-5 font-semibold text-white shadow-lg transition-all hover:bg-[#2563EB]"
        aria-label="Create invoice"
      >
        <Plus className="size-5" />
        Create Invoice
      </Link>
    </div>
  );
}
