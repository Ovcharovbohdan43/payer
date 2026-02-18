"use client";

import Link from "next/link";
import type { InvoiceRow } from "@/app/invoices/actions";
import { formatAmount, STATUS_LABELS, type InvoiceStatus } from "@/lib/invoices/utils";
import { getPublicInvoiceUrl } from "@/lib/invoices/utils";
import { Button } from "@/components/ui/button";
import { Copy, Send, ExternalLink } from "lucide-react";
import { useTransition, useState } from "react";
import { markInvoiceSentAction } from "@/app/invoices/actions";
import { useRouter } from "next/navigation";

const STATUS_VARIANTS: Record<InvoiceStatus, string> = {
  draft: "bg-white/10 text-muted-foreground",
  sent: "bg-blue-500/20 text-blue-400",
  viewed: "bg-amber-500/20 text-amber-400",
  paid: "bg-emerald-500/20 text-emerald-400",
  overdue: "bg-red-500/20 text-red-400",
  void: "bg-white/10 text-muted-foreground",
};

type Props = {
  invoices: InvoiceRow[];
  baseUrl: string;
};

export function RecentInvoices({ invoices, baseUrl }: Props) {
  const recent = invoices.slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[14px] border border-white/5 bg-[#121821]/80 p-3 backdrop-blur sm:rounded-[20px] sm:p-6">
      <h2 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">Recent invoices</h2>
      <ul className="space-y-2">
        {recent.map((inv) => (
          <RecentInvoiceRow key={inv.id} invoice={inv} baseUrl={baseUrl} />
        ))}
      </ul>
      <Link
        href="/invoices"
        className="mt-4 flex items-center gap-2 text-sm font-medium text-[#3B82F6] hover:underline"
      >
        View all
        <ExternalLink className="size-4" />
      </Link>
    </section>
  );
}

function RecentInvoiceRow({ invoice, baseUrl }: { invoice: InvoiceRow; baseUrl: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const status = (invoice.status ?? "draft") as InvoiceStatus;
  const publicUrl = getPublicInvoiceUrl(invoice.public_id, baseUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (status === "draft") {
        startTransition(async () => {
          await markInvoiceSentAction(invoice.id);
          router.refresh();
        });
      }
    } catch {
      // ignore
    }
  };

  return (
    <li className="group flex min-w-0 items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 transition-all hover:bg-white/5 sm:rounded-xl sm:p-3 sm:gap-3">
      <Link href={`/invoices/${invoice.id}`} className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:flex-nowrap sm:gap-3">
          <span className="font-medium truncate">{invoice.client_name}</span>
          <span className="text-base font-semibold tabular-nums text-foreground sm:text-lg">
            {formatAmount(invoice.amount_cents, invoice.currency)}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              STATUS_VARIANTS[status] ?? STATUS_VARIANTS.draft
            }`}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          disabled={pending}
          aria-label={copied ? "Copied" : "Copy link"}
        >
          {copied ? (
            <span className="text-xs text-emerald-400">✓</span>
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          disabled
          title="Send reminder (coming soon)"
          aria-label="Send reminder"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </li>
  );
}
