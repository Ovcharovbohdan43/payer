"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { InvoiceRow } from "./actions";
import { formatAmount, STATUS_LABELS, type InvoiceStatus } from "@/lib/invoices/utils";
import { useState, useMemo } from "react";

const STATUS_VARIANTS: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  viewed: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  overdue: "bg-destructive/15 text-destructive",
  void: "bg-muted text-muted-foreground",
};

const UNPAID_STATUSES = ["draft", "sent", "viewed", "overdue"];

function mapInitialFilter(status?: string): string {
  if (status === "unpaid" || status === "paid" || status === "overdue") return status;
  return "all";
}

export function InvoiceList({
  invoices,
  initialStatusFilter,
}: {
  invoices: InvoiceRow[];
  initialStatusFilter?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(() =>
    mapInitialFilter(initialStatusFilter)
  );

  const filtered = useMemo(() => {
    let list = invoices.filter((inv) => {
      const matchSearch =
        !search.trim() ||
        inv.number.toLowerCase().includes(search.toLowerCase()) ||
        inv.client_name.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "unpaid") return UNPAID_STATUSES.includes(inv.status);
      if (statusFilter === "paid") return inv.status === "paid";
      if (statusFilter === "overdue") return inv.status === "overdue";
      return inv.status === statusFilter;
    });
    list.sort((a, b) => {
      const aUnpaid = UNPAID_STATUSES.includes(a.status);
      const bUnpaid = UNPAID_STATUSES.includes(b.status);
      if (aUnpaid !== bUnpaid) return aUnpaid ? -1 : 1;
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
    return list;
  }, [invoices, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search by number or client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search invoices"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          {(Object.keys(STATUS_LABELS) as InvoiceStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/10 py-12 text-center text-muted-foreground">
          {invoices.length === 0 ? (
            <>
              <p className="font-medium">No invoices yet</p>
              <p className="mt-1 text-sm">Create your first invoice to get started.</p>
              <Button asChild className="mt-4">
                <Link href="/invoices/new">Create invoice</Link>
              </Button>
            </>
          ) : (
            "No invoices match your search."
          )}
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card/50">
          {filtered.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/invoices/${inv.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{inv.number}</p>
                  <p className="text-sm text-muted-foreground truncate">{inv.client_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium tabular-nums">
                    {formatAmount(inv.amount_cents, inv.currency)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_VARIANTS[inv.status as InvoiceStatus] ?? STATUS_VARIANTS.draft
                    }`}
                  >
                    {STATUS_LABELS[inv.status as InvoiceStatus] ?? inv.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
