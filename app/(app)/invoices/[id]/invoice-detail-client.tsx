"use client";

import { Button } from "@/components/ui/button";
import {
  voidInvoiceAction,
  markAsPaidManualAction,
  markInvoiceSentAction,
} from "@/app/invoices/actions";
import type { InvoiceStatus } from "@/lib/invoices/utils";
import { useTransition, useState } from "react";

type Props = {
  invoiceId: string;
  publicUrl: string;
  status: InvoiceStatus;
  canVoid: boolean;
  canMarkPaid: boolean;
};

export function InvoiceDetailClient({
  invoiceId,
  publicUrl,
  status,
  canVoid,
  canMarkPaid,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [copyDone, setCopyDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyDone(true);
      setError(null);
      if (status === "draft") {
        startTransition(async () => {
          await markInvoiceSentAction(invoiceId);
        });
      }
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setError("Could not copy");
    }
  };

  return (
    <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground sm:mb-3">
        Actions
      </h2>
      <div className="flex flex-wrap items-center gap-2 [&_button]:min-h-10 [&_button]:touch-manipulation [&_a]:min-h-10 [&_a]:inline-flex [&_a]:items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          disabled={pending}
        >
          {copyDone ? "Copied!" : "Copy link"}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`/api/invoices/${invoiceId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            Download PDF
          </a>
        </Button>
        <Button variant="outline" size="sm" disabled title="Coming in Phase 7">
          Send reminder
        </Button>
        {canMarkPaid && (
          <form
            action={() => {
              startTransition(async () => {
                const r = await markAsPaidManualAction(invoiceId);
                if (r.error) setError(r.error);
              });
            }}
            className="inline"
          >
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              Mark as paid
            </Button>
          </form>
        )}
        {canVoid && (
          <form
            action={async () => {
              const r = await voidInvoiceAction(invoiceId);
              if (r.error) setError(r.error);
            }}
            className="inline"
          >
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={pending}
              className="text-destructive hover:text-destructive"
            >
              Void invoice
            </Button>
          </form>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </section>
  );
}
