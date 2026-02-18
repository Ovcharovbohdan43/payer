"use client";

import { Button } from "@/components/ui/button";
import {
  voidInvoiceAction,
  markAsPaidManualAction,
  markInvoiceSentAction,
  sendInvoiceEmailAction,
  sendReminderAction,
} from "@/app/invoices/actions";
import type { InvoiceStatus } from "@/lib/invoices/utils";
import { useTransition, useState } from "react";
import { toast } from "sonner";

type Props = {
  invoiceId: string;
  publicUrl: string;
  status: InvoiceStatus;
  canVoid: boolean;
  canMarkPaid: boolean;
  hasClientEmail: boolean;
};

const CAN_SEND_REMINDER: InvoiceStatus[] = ["sent", "viewed", "overdue", "draft"];

export function InvoiceDetailClient({
  invoiceId,
  publicUrl,
  status,
  canVoid,
  canMarkPaid,
  hasClientEmail,
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
        {hasClientEmail && status !== "paid" && status !== "void" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const r = await sendInvoiceEmailAction(invoiceId);
                if (r.error) {
                  setError(r.error);
                  toast.error(r.error);
                } else {
                  setError(null);
                  toast.success("Invoice sent by email");
                }
              });
            }}
          >
            Send by email
          </Button>
        )}
        {hasClientEmail &&
          CAN_SEND_REMINDER.includes(status) &&
          status !== "paid" &&
          status !== "void" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const r = await sendReminderAction(invoiceId);
                  if (r.error) {
                    setError(r.error);
                    toast.error(r.error);
                  } else {
                    setError(null);
                    toast.success("Reminder sent");
                  }
                });
              }}
            >
              Send reminder
            </Button>
          )}
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
