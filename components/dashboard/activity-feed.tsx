"use client";

import { useState } from "react";
import Link from "next/link";
import type { ActivityItem } from "@/lib/dashboard/activity";
import { Check, Send, Eye, AlertCircle, Settings, Banknote, ChevronDown, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const INITIAL_COUNT = 6;

const ICONS: Record<ActivityItem["type"], React.ReactNode> = {
  paid: <Check className="size-4 text-emerald-400" />,
  sent: <Send className="size-4 text-blue-400" />,
  viewed: <Eye className="size-4 text-amber-400" />,
  overdue: <AlertCircle className="size-4 text-red-400" />,
  currency_changed: <Settings className="size-4 text-blue-400" />,
  payout: <Banknote className="size-4 text-emerald-400" />,
  offer_accepted: <ThumbsUp className="size-4 text-emerald-400" />,
  offer_declined: <ThumbsDown className="size-4 text-red-400" />,
};

type Props = {
  items: ActivityItem[];
};

export function ActivityFeed({ items }: Props) {
  const [shown, setShown] = useState(INITIAL_COUNT);
  const visible = items.slice(0, shown);
  const hasMore = items.length > shown;

  if (items.length === 0) return null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[14px] border border-white/5 bg-[#121821]/80 p-3 backdrop-blur sm:rounded-[20px] sm:p-6">
      <h2 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">Recent activity</h2>
      <ul className="space-y-3">
        {visible.map((item) => {
          const href = item.href ?? (item.invoiceId ? `/invoices/${item.invoiceId}` : null);
          const content = (
            <>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5">
                {ICONS[item.type]}
              </span>
              <span className="text-sm">{item.label}</span>
            </>
          );
          return (
            <li key={`${item.invoiceId ?? item.offerId ?? "sys"}-${item.type}-${item.sortAt}`}>
              {href ? (
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-xl p-2">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-muted-foreground hover:text-foreground"
          onClick={() => setShown((n) => n + 10)}
        >
          <ChevronDown className="mr-1 size-4" />
          Load more
        </Button>
      )}
    </section>
  );
}
