"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { InvoiceRow } from "./actions";
import { deleteInvoicesAction } from "./actions";
import {
  formatAmount,
  getDisplayAmountCents,
  STATUS_LABELS,
  type InvoiceStatus,
} from "@/lib/invoices/utils";
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

const DELETABLE_STATUSES = ["draft", "void"];

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const deletable = filtered.filter((inv) => DELETABLE_STATUSES.includes(inv.status));
    if (selectedIds.size === deletable.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletable.map((inv) => inv.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} invoice(s)? Only draft and void invoices can be deleted.`)) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteInvoicesAction(Array.from(selectedIds));
    setIsDeleting(false);
    if ("error" in result) {
      setDeleteError(result.error);
      return;
    }
    setSelectedIds(new Set());
    setDeleteError(null);
  };

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
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search by number or client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-10 flex-1 rounded-lg border border-white/10 bg-[#121821]/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
          aria-label="Search invoices"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 min-h-10 rounded-lg border border-white/10 bg-[#121821]/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
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
        {filtered.length > 0 && (
          <>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={
                  filtered.filter((inv) => DELETABLE_STATUSES.includes(inv.status)).length > 0 &&
                  filtered.filter((inv) => DELETABLE_STATUSES.includes(inv.status)).every((inv) =>
                    selectedIds.has(inv.id)
                  )
                }
                onChange={selectAllFiltered}
                className="h-4 w-4 rounded border-white/20 bg-[#121821] accent-[#3B82F6]"
                aria-label="Select all draft/void"
              />
              Select to delete
            </label>
            {selectedIds.size > 0 && (
              <Button
                type="button"
                variant="destructive"
                className="h-10 shrink-0"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : `Delete (${selectedIds.size})`}
              </Button>
            )}
          </>
        )}
      </div>
      {deleteError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {deleteError}
        </p>
      )}

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
        <ul className="divide-y divide-white/5 min-w-0 overflow-hidden rounded-[16px] border border-white/5 bg-[#121821]/80 sm:rounded-[20px]">
          {filtered.map((inv) => {
            const canDelete = DELETABLE_STATUSES.includes(inv.status);
            return (
              <li key={inv.id} className="flex items-stretch">
                {canDelete && (
                  <div
                    className="flex items-center pl-3 sm:pl-4"
                    onClick={(e) => e.preventDefault()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-white/20 bg-[#121821] accent-[#3B82F6]"
                      aria-label={`Select ${inv.number} for deletion`}
                    />
                  </div>
                )}
                {!canDelete && <div className="w-7 shrink-0 sm:w-8" />}
                <Link
                  href={`/invoices/${inv.id}`}
                  className="flex flex-1 flex-col gap-1 px-2 py-3 transition-colors hover:bg-white/5 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between sm:gap-3 sm:px-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{inv.number}</p>
                    <p className="text-sm text-muted-foreground truncate">{inv.client_name}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
                    <span className="text-sm font-medium tabular-nums">
                      {formatAmount(
                        getDisplayAmountCents(inv.amount_cents, inv.vat_included),
                        inv.currency
                      )}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
