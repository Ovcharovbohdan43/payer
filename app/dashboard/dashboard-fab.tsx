"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

/** Sticky bottom CTA for "Create Invoice" on mobile. Hidden on larger breakpoints. */
export function DashboardFab() {
  return <NewInvoiceFab />;
}

/** FAB linking to new invoice. Use on dashboard and invoices list. */
export function NewInvoiceFab() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0B0F14]/95 p-4 backdrop-blur sm:hidden">
      <Link
        href="/invoices/new"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] font-semibold text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all hover:bg-[#2563EB]"
        aria-label="Create invoice"
      >
        <Plus className="size-5" />
        Create Invoice
      </Link>
    </div>
  );
}
