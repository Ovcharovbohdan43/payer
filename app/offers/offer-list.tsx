"use client";

import Link from "next/link";
import type { OfferRow } from "./actions";
import { formatAmount } from "@/lib/invoices/utils";
import { OFFER_STATUS_LABELS, type OfferStatus } from "@/lib/offers/utils";
import { useState, useMemo } from "react";

const STATUS_VARIANTS: Record<OfferStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  viewed: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  accepted: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  declined: "bg-red-500/15 text-red-600 dark:text-red-400",
  expired: "bg-muted text-muted-foreground",
};

export function OfferList({ offers }: { offers: OfferRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = offers.filter((o) => {
      const matchSearch =
        !search.trim() ||
        o.number.toLowerCase().includes(search.toLowerCase()) ||
        o.client_name.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === "all") return true;
      return o.status === statusFilter;
    });
    list.sort((a, b) =>
      (b.created_at ?? "").localeCompare(a.created_at ?? "")
    );
    return list;
  }, [offers, search, statusFilter]);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search by number or client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-10 flex-1 rounded-lg border border-white/10 bg-[#121821]/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
          aria-label="Search offers"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 min-h-10 rounded-lg border border-white/10 bg-[#121821]/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
        >
          <option value="all">All statuses</option>
          {(Object.keys(OFFER_STATUS_LABELS) as OfferStatus[]).map((s) => (
            <option key={s} value={s}>
              {OFFER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/10 py-12 text-center text-muted-foreground">
          {offers.length === 0 ? (
            <>
              <p className="font-medium">No offers yet</p>
              <p className="mt-1 text-sm">Create your first offer (quote/estimate).</p>
              <Link
                href="/offers/new"
                className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#3B82F6] px-4 font-semibold text-white hover:bg-[#2563EB]"
              >
                Create offer
              </Link>
            </>
          ) : (
            "No offers match your search."
          )}
        </div>
      ) : (
        <ul className="min-w-0 overflow-hidden divide-y divide-white/5 rounded-[16px] border border-white/5 bg-[#121821]/80 sm:rounded-[20px]">
          {filtered.map((o) => (
            <li key={o.id}>
              <Link
                href={`/offers/${o.id}`}
                className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-white/5 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{o.number}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {o.client_name}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
                  <span className="text-sm font-medium tabular-nums">
                    {formatAmount(o.amount_cents, o.currency)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_VARIANTS[o.status as OfferStatus] ?? STATUS_VARIANTS.draft
                    }`}
                  >
                    {OFFER_STATUS_LABELS[o.status as OfferStatus] ?? o.status}
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
