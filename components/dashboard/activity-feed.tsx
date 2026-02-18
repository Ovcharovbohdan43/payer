import Link from "next/link";
import type { ActivityItem } from "@/lib/dashboard/activity";
import { Check, Send, Eye, AlertCircle } from "lucide-react";

const ICONS: Record<ActivityItem["type"], React.ReactNode> = {
  paid: <Check className="size-4 text-emerald-400" />,
  sent: <Send className="size-4 text-blue-400" />,
  viewed: <Eye className="size-4 text-amber-400" />,
  overdue: <AlertCircle className="size-4 text-red-400" />,
};

type Props = {
  items: ActivityItem[];
};

export function ActivityFeed({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
      <h2 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">Recent activity</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={`${item.invoiceId}-${item.type}-${item.sortAt}`}>
            <Link
              href={`/invoices/${item.invoiceId}`}
              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5">
                {ICONS[item.type]}
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
