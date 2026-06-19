"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminSetInvoiceCreationLimit } from "@/lib/admin/actions";
import { UNLIMITED_INVOICE_LIMIT } from "@/lib/invoices/creation-limit";

type Props = {
  userId: string;
  invoiceCount: number;
  statusSummary: string;
  currentLimit: number | null;
  limitNote: string | null;
  reviewedAt: string | null;
  isTargetAdmin?: boolean;
};

export function AdminInvoiceLimitControls({
  userId,
  invoiceCount,
  statusSummary,
  currentLimit,
  limitNote,
  reviewedAt,
  isTargetAdmin,
}: Props) {
  const [partialLimit, setPartialLimit] = useState(
    currentLimit !== null && currentLimit > 0 ? String(currentLimit) : "5"
  );
  const [note, setNote] = useState(limitNote ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: string, limit: number | null) {
    setLoading(action);
    setMessage(null);
    const result = await adminSetInvoiceCreationLimit(userId, limit, note || undefined);
    setLoading(null);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-white/80">
        <p>
          <span className="text-muted-foreground">Status:</span> {statusSummary}
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">Invoices created:</span> {invoiceCount}
        </p>
        {currentLimit !== null && (
          <p className="mt-1">
            <span className="text-muted-foreground">Admin limit:</span>{" "}
            {currentLimit === UNLIMITED_INVOICE_LIMIT
              ? "Unlimited"
              : currentLimit === 0
                ? "Blocked"
                : currentLimit}
          </p>
        )}
        {reviewedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Reviewed: {new Date(reviewedAt).toLocaleString("en-GB")}
          </p>
        )}
        {limitNote && (
          <p className="mt-1 text-xs text-muted-foreground">Note: {limitNote}</p>
        )}
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Admin note (optional)
        </label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason or ticket reference"
          className="mt-1 border-white/10 bg-white/5"
          disabled={!!loading || isTargetAdmin}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!!loading || isTargetAdmin}
          onClick={() => run("unlimited", UNLIMITED_INVOICE_LIMIT)}
        >
          {loading === "unlimited" ? "…" : "Approve unlimited"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!!loading || isTargetAdmin}
          onClick={() => {
            const n = parseInt(partialLimit, 10);
            if (!Number.isFinite(n) || n < 1) {
              setMessage("Enter a positive number for partial limit");
              return;
            }
            void run("partial", n);
          }}
        >
          {loading === "partial" ? "…" : `Set partial (${partialLimit || "?"})`}
        </Button>
        <Input
          type="number"
          min={1}
          value={partialLimit}
          onChange={(e) => setPartialLimit(e.target.value)}
          className="h-8 w-20 border-white/10 bg-white/5"
          disabled={!!loading || isTargetAdmin}
        />
        <Button
          size="sm"
          variant="destructive"
          disabled={!!loading || isTargetAdmin}
          onClick={() => run("block", 0)}
        >
          {loading === "block" ? "…" : "Block invoices"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!!loading || isTargetAdmin}
          onClick={() => run("auto", null)}
        >
          {loading === "auto" ? "…" : "Reset to auto (day 1 rule)"}
        </Button>
      </div>

      {isTargetAdmin && (
        <p className="text-xs text-amber-400">Admin accounts are not subject to invoice limits.</p>
      )}

      {message && <p className="text-sm text-red-400">{message}</p>}

      <p className="text-xs text-muted-foreground">
        New accounts: max 1 invoice in the first 24 hours, then creation is frozen until support
        approves full or partial access.
      </p>
    </div>
  );
}
