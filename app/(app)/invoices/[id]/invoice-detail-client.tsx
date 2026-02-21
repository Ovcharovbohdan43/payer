"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  voidInvoiceAction,
  markAsPaidManualAction,
  markInvoiceSentAction,
  sendInvoiceEmailAction,
  sendReminderAction,
  updateAutoRemindAction,
} from "@/app/invoices/actions";
import type { InvoiceStatus } from "@/lib/invoices/utils";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import {
  Link2,
  Pencil,
  FileDown,
  Mail,
  Bell,
  CheckCircle2,
  Ban,
  BellRing,
} from "lucide-react";

const AUTO_REMIND_DAYS = [1, 2, 3, 5, 7, 10, 14] as const;

type Props = {
  invoiceId: string;
  publicUrl: string;
  status: InvoiceStatus;
  canVoid: boolean;
  canMarkPaid: boolean;
  hasClientEmail: boolean;
  autoRemindEnabled: boolean;
  autoRemindDays: string;
};

const CAN_SEND_REMINDER: InvoiceStatus[] = ["sent", "viewed", "overdue", "draft"];

function parseDays(s: string): number[] {
  return s
    .split(",")
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !isNaN(n) && AUTO_REMIND_DAYS.includes(n as (typeof AUTO_REMIND_DAYS)[number]))
    .sort((a, b) => a - b);
}

export function InvoiceDetailClient({
  invoiceId,
  publicUrl,
  status,
  canVoid,
  canMarkPaid,
  hasClientEmail,
  autoRemindEnabled: initialAutoRemind,
  autoRemindDays,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [copyDone, setCopyDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRemindEnabled, setAutoRemindEnabled] = useState(initialAutoRemind);
  const [selectedDays, setSelectedDays] = useState<number[]>(() =>
    parseDays(autoRemindDays)
  );

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

  const btnClass =
    "min-h-10 touch-manipulation gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm font-medium transition-colors hover:bg-white/8 hover:border-white/15";

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5 backdrop-blur sm:p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
        Actions
      </h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={btnClass}
            onClick={handleCopyLink}
            disabled={pending}
          >
            <Link2 className="size-4 shrink-0" />
            {copyDone ? "Copied!" : "Copy link"}
          </Button>
          {status !== "paid" && status !== "void" && (
            <Button variant="outline" size="sm" className={btnClass} asChild>
              <Link href={`/invoices/${invoiceId}/edit`}>
                <Pencil className="size-4 shrink-0" />
                Edit
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" className={btnClass} asChild>
            <a
              href={`/api/invoices/${invoiceId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex min-h-10 items-center gap-2"
            >
              <FileDown className="size-4 shrink-0" />
              Download PDF
            </a>
          </Button>
          {hasClientEmail && status !== "paid" && status !== "void" && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={btnClass}
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
                <Mail className="size-4 shrink-0" />
                Send by email
              </Button>
              {CAN_SEND_REMINDER.includes(status) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={btnClass}
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
                  <Bell className="size-4 shrink-0" />
                  Send reminder
                </Button>
              )}
            </>
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
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className={`${btnClass} border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30`}
                disabled={pending}
              >
                <CheckCircle2 className="size-4 shrink-0" />
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
                className={`${btnClass} border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30`}
                disabled={pending}
              >
                <Ban className="size-4 shrink-0" />
                Void invoice
              </Button>
            </form>
          )}
        </div>

        {hasClientEmail &&
          status !== "paid" &&
          status !== "void" &&
          status !== "draft" && (
            <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={autoRemindEnabled}
                    disabled={pending}
                    onChange={(e) => {
                      const next = e.target.checked;
                      const days =
                        next && selectedDays.length === 0 ? [1, 3, 7] : selectedDays;
                      if (next) setSelectedDays(days);
                      setAutoRemindEnabled(next);
                      startTransition(async () => {
                        const r = await updateAutoRemindAction(
                          invoiceId,
                          next,
                          days.join(",")
                        );
                        if (r.error) {
                          setError(r.error);
                          toast.error(r.error);
                          setAutoRemindEnabled(!next);
                        } else {
                          setError(null);
                          toast.success(
                            next
                              ? `Auto-reminders enabled (${days.join(", ")} days)`
                              : "Auto-reminders disabled"
                          );
                        }
                      });
                    }}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-md border-2 border-white/20 bg-transparent transition-colors peer-checked:border-[#3B82F6] peer-checked:bg-[#3B82F6] peer-focus-visible:ring-2 peer-focus-visible:ring-[#3B82F6]/50 peer-disabled:opacity-50" />
                  <BellRing className="absolute size-3 text-white opacity-0 transition-opacity peer-checked:opacity-100 peer-disabled:opacity-30" />
                </div>
                <span className="text-sm font-medium text-foreground/90">
                  Auto-remind client
                </span>
                <span className="text-sm text-muted-foreground">
                  — pick days after send
                </span>
              </label>
              {autoRemindEnabled && (
                <div className="flex flex-wrap gap-2 pl-8">
                  {AUTO_REMIND_DAYS.map((d) => (
                    <label
                      key={d}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm transition-colors hover:border-white/20 hover:bg-white/5 has-[:checked]:border-[#3B82F6]/40 has-[:checked]:bg-[#3B82F6]/10"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(d)}
                        disabled={pending}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selectedDays, d].sort((a, b) => a - b)
                            : selectedDays.filter((x) => x !== d);
                          const days = next.length > 0 ? next : [1];
                          setSelectedDays(next);
                          startTransition(async () => {
                            const r = await updateAutoRemindAction(
                              invoiceId,
                              true,
                              days.join(",")
                            );
                            if (r.error) {
                              toast.error(r.error);
                              setSelectedDays(selectedDays);
                            } else {
                              toast.success(`Reminders: ${days.join(", ")} days`);
                            }
                          });
                        }}
                        className="sr-only"
                      />
                      <span className="text-muted-foreground has-[:checked]:text-foreground">
                        {d} {d === 1 ? "day" : "days"}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-400">{error}</p>
      )}
    </section>
  );
}
