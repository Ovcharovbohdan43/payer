"use client";

import { useActionState, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export type LineItemInput = {
  id: string;
  description: string;
  amount: string;
  discountPercent: string;
};

function createEmptyLineItem(): LineItemInput {
  return {
    id: crypto.randomUUID(),
    description: "",
    amount: "",
    discountPercent: "",
  };
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "GBP",
  }).format(cents / 100);
}

type DemoInvoiceFormProps = {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
};

export function DemoInvoiceForm({ action }: DemoInvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LineItemInput[]>([
    createEmptyLineItem(),
  ]);
  const [vatIncluded, setVatIncluded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [currency, setCurrency] = useState("GBP");
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<"percent" | "fixed" | "none">("none");
  const [invoiceDiscountPercent, setInvoiceDiscountPercent] = useState("");
  const [invoiceDiscountCents, setInvoiceDiscountCents] = useState("");

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setLineItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length > 0 ? next : [createEmptyLineItem()];
    });
  }, []);

  const updateLineItem = useCallback(
    (
      id: string,
      field: "description" | "amount" | "discountPercent",
      value: string
    ) => {
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  let subtotalAfterLineDiscounts = lineItems.reduce((sum, item) => {
    const amt = parseFloat(item.amount) || 0;
    const dp = Math.min(100, Math.max(0, parseFloat(item.discountPercent) || 0));
    const rawCents = isNaN(amt) || amt < 0 ? 0 : Math.round(amt * 100);
    const afterDiscount = Math.round(rawCents * (1 - dp / 100));
    return sum + afterDiscount;
  }, 0);

  const invDiscPct = invoiceDiscountType === "percent" ? Math.min(100, Math.max(0, parseFloat(invoiceDiscountPercent) || 0)) : 0;
  const invDiscCts = invoiceDiscountType === "fixed" ? Math.max(0, Math.round((parseFloat(invoiceDiscountCents) || 0) * 100)) : 0;
  if (invoiceDiscountType === "percent" && invDiscPct > 0) {
    subtotalAfterLineDiscounts = Math.round(subtotalAfterLineDiscounts * (1 - invDiscPct / 100));
  } else if (invoiceDiscountType === "fixed" && invDiscCts > 0) {
    subtotalAfterLineDiscounts = Math.max(0, subtotalAfterLineDiscounts - invDiscCts);
  }

  const vatCents = vatIncluded ? 0 : Math.round(subtotalAfterLineDiscounts * 0.2);
  const totalCents = vatIncluded ? subtotalAfterLineDiscounts : subtotalAfterLineDiscounts + vatCents;

  const lineItemsJson = JSON.stringify(
    lineItems
      .filter((item) => item.description.trim() && item.amount.trim())
      .map((item) => {
        const amt = parseFloat(item.amount) || 0;
        const dp = Math.min(100, Math.max(0, parseFloat(item.discountPercent) || 0));
        return {
          description: item.description.trim(),
          amount: amt,
          discountPercent: dp,
        };
      })
  );

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await action(formData)) ?? null;
    },
    null as { error?: string } | null
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-white/10 bg-[#121821]/80 p-6 shadow-xl sm:p-8"
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="clientName" className="text-muted-foreground">Client name</Label>
          <Input
            id="clientName"
            name="clientName"
            placeholder="e.g. Acme Ltd"
            required
            disabled={isPending}
            className="h-11"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Services</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addLineItem}
              disabled={isPending}
              className="h-8 gap-1 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          {lineItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-end sm:gap-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`desc-${item.id}`} className="text-xs text-muted-foreground">
                  Description
                </Label>
                <Input
                  id={`desc-${item.id}`}
                  placeholder="e.g. Plumbing repair"
                  disabled={isPending}
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(item.id, "description", e.target.value)
                  }
                  className="h-10"
                />
              </div>
              <div className="flex flex-wrap items-end gap-4 sm:gap-4">
                <div className="w-28 flex-shrink-0 space-y-1">
                  <Label htmlFor={`amt-${item.id}`} className="text-xs text-muted-foreground">
                    Amount
                  </Label>
                  <Input
                    id={`amt-${item.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isPending}
                    value={item.amount}
                    onChange={(e) =>
                      updateLineItem(item.id, "amount", e.target.value)
                    }
                    className="h-10"
                  />
                </div>
                <div className="w-24 flex-shrink-0 space-y-1">
                  <Label htmlFor={`disc-${item.id}`} className="text-xs text-muted-foreground">
                    Discount %
                  </Label>
                  <Input
                    id={`disc-${item.id}`}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="0"
                    disabled={isPending}
                    value={item.discountPercent}
                    onChange={(e) =>
                      updateLineItem(item.id, "discountPercent", e.target.value)
                    }
                    className="h-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLineItem(item.id)}
                  disabled={isPending || lineItems.length === 1}
                  className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="vatIncluded"
            checked={vatIncluded}
            onChange={(e) => setVatIncluded(e.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-white/20 bg-[#121821] accent-[#3B82F6]"
          />
          <Label
            htmlFor="vatIncluded"
            className="cursor-pointer text-sm font-normal text-muted-foreground"
          >
            Tax included in amount
          </Label>
        </div>

        {subtotalAfterLineDiscounts > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-muted-foreground">
              Subtotal: {formatMoney(subtotalAfterLineDiscounts, currency)}
              {!vatIncluded && vatCents > 0 && (
                <> + VAT (20%): {formatMoney(vatCents, currency)}</>
              )}
              {" → "}
              <span className="font-semibold text-white">
                Total: {formatMoney(totalCents, currency)}
              </span>
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {showMore ? "− Less" : "+ More options"}
        </button>
        {showMore && (
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="space-y-1">
              <Label htmlFor="clientEmail" className="text-muted-foreground">
                Client email (optional, but recommended)
              </Label>
              <p className="text-xs text-muted-foreground/80">
                With email you can send reminders and recurring invoices.
              </p>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                placeholder="client@example.com"
                disabled={isPending}
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dueDate" className="text-muted-foreground">Due date (optional)</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                disabled={isPending}
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Invoice discount (optional)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={invoiceDiscountType}
                  onChange={(e) =>
                    setInvoiceDiscountType(e.target.value as "percent" | "fixed" | "none")
                  }
                  disabled={isPending}
                  className="h-10 rounded-md border border-white/10 bg-[#121821] px-3 text-sm"
                >
                  <option value="none">None</option>
                  <option value="percent">Percent %</option>
                  <option value="fixed">Fixed amount</option>
                </select>
                {invoiceDiscountType === "percent" && (
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="Discount %"
                    disabled={isPending}
                    value={invoiceDiscountPercent}
                    onChange={(e) => setInvoiceDiscountPercent(e.target.value)}
                    className="h-10 w-28"
                  />
                )}
                {invoiceDiscountType === "fixed" && (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Discount"
                    disabled={isPending}
                    value={invoiceDiscountCents}
                    onChange={(e) => setInvoiceDiscountCents(e.target.value)}
                    className="h-10 w-28"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 opacity-60">
                <input
                  type="checkbox"
                  id="demoAutoRemind"
                  disabled
                  className="h-4 w-4 rounded border-white/20 bg-[#121821] accent-[#3B82F6]"
                />
                <Label
                  htmlFor="demoAutoRemind"
                  className="cursor-not-allowed text-sm font-normal text-muted-foreground"
                >
                  Auto-remind client — pick days after send (demo)
                </Label>
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <input
                  type="checkbox"
                  id="demoRecurring"
                  disabled
                  className="h-4 w-4 rounded border-white/20 bg-[#121821] accent-[#3B82F6]"
                />
                <Label
                  htmlFor="demoRecurring"
                  className="cursor-not-allowed text-sm font-normal text-muted-foreground"
                >
                  Recurring invoice — auto-generate at interval (demo)
                </Label>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency" className="text-muted-foreground">Currency</Label>
              <select
                id="currency"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={isPending}
                className="h-10 w-full rounded-md border border-white/10 bg-[#121821] px-3 text-sm"
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <input type="hidden" name="vatIncluded" value={vatIncluded ? "true" : "false"} />
      <input type="hidden" name="lineItems" value={lineItemsJson} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="discountType" value={invoiceDiscountType} />
      <input type="hidden" name="discountPercent" value={invoiceDiscountType === "percent" ? invoiceDiscountPercent : ""} />
      <input
        type="hidden"
        name="discountCents"
        value={
          invoiceDiscountType === "fixed"
            ? String(Math.round((parseFloat(invoiceDiscountCents) || 0) * 100))
            : ""
        }
      />

      {state?.error && (
        <p className="mt-4 text-sm text-destructive">{state.error}</p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="mt-6 h-12 w-full rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]"
      >
        {isPending ? "Creating…" : "Create demo invoice"}
      </Button>
    </form>
  );
}
