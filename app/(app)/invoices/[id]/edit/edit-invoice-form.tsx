"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientAutocomplete } from "@/components/clients/client-autocomplete";
import type { ClientRow } from "@/app/clients/actions";
import { listClients } from "@/app/clients/actions";
import type { InvoiceRow } from "@/app/invoices/actions";
import { updateInvoiceAction, type UpdateResult } from "@/app/invoices/actions";
import { useActionState, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { calcPaymentProcessingFeeCents } from "@/lib/invoices/utils";

const VAT_RATE = 0.2;

export type LineItemInput = {
  id: string;
  description: string;
  amount: string;
  discountPercent: string;
};

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

function createEmptyLineItem(): LineItemInput {
  return {
    id: crypto.randomUUID(),
    description: "",
    amount: "",
    discountPercent: "",
  };
}

function invoiceToLineItems(invoice: InvoiceRow): LineItemInput[] {
  const items = invoice.line_items ?? [];
  if (items.length === 0) return [createEmptyLineItem()];
  return items.map((i) => ({
    id: crypto.randomUUID(),
    description: i.description,
    amount: (i.amount_cents / 100).toFixed(2),
    discountPercent: String(i.discount_percent ?? 0),
  }));
}

function invoiceToSyntheticClient(invoice: InvoiceRow): ClientRow | null {
  if (!invoice.client_name?.trim()) return null;
  return {
    id: "",
    name: invoice.client_name,
    email: invoice.client_email ?? null,
    phone: null,
    created_at: "",
  };
}

type Props = {
  invoice: InvoiceRow;
  clients: ClientRow[];
  defaultCurrency: string;
};

export function EditInvoiceForm({ invoice, clients, defaultCurrency }: Props) {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(() =>
    invoiceToSyntheticClient(invoice)
  );
  const [clientsList, setClientsList] = useState(clients);
  const [showMore, setShowMore] = useState(
    !!(invoice.due_date || invoice.notes || (invoice.discount_type && invoice.discount_type !== "none"))
  );
  const [vatIncluded, setVatIncluded] = useState(invoice.vat_included ?? false);
  const [paymentProcessingFeeIncluded, setPaymentProcessingFeeIncluded] = useState(
    invoice.payment_processing_fee_included ?? false
  );
  const [autoRemind, setAutoRemind] = useState(invoice.auto_remind_enabled ?? false);
  const AUTO_REMIND_DAYS = [1, 2, 3, 5, 7, 10, 14] as const;
  const [autoRemindDays, setAutoRemindDays] = useState<number[]>(() => {
    const s = invoice.auto_remind_days ?? "1,3,7";
    return s
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => !isNaN(n) && AUTO_REMIND_DAYS.includes(n as (typeof AUTO_REMIND_DAYS)[number]))
      .sort((a, b) => a - b);
  });

  const [lineItems, setLineItems] = useState<LineItemInput[]>(() =>
    invoiceToLineItems(invoice)
  );

  const dueDateInitial =
    invoice.due_date != null
      ? new Date(invoice.due_date).toISOString().slice(0, 10)
      : "";
  const [dueDateState, setDueDateState] = useState(dueDateInitial);
  const [notesState, setNotesState] = useState(invoice.notes ?? "");

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
    (id: string, field: "description" | "amount" | "discountPercent", value: string) => {
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

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

  const invoiceDiscountType = (invoice.discount_type as "percent" | "fixed" | null) ?? "none";
  const [localDiscountType, setLocalDiscountType] = useState<"percent" | "fixed" | "none">(
    invoiceDiscountType
  );
  const [invoiceDiscountPercent, setInvoiceDiscountPercent] = useState(() =>
    invoiceDiscountType === "percent" ? String(invoice.discount_value ?? 0) : ""
  );
  const [invoiceDiscountCents, setInvoiceDiscountCents] = useState(() =>
    invoiceDiscountType === "fixed"
      ? ((invoice.discount_value ?? 0) / 100).toFixed(2)
      : ""
  );

  let subtotalAfterLineDiscounts = lineItems.reduce((sum, item) => {
    const amt = parseFloat(item.amount);
    const dp = Math.min(100, Math.max(0, parseFloat(item.discountPercent) || 0));
    const rawCents = isNaN(amt) || amt < 0 ? 0 : Math.round(amt * 100);
    const afterDiscount = Math.round(rawCents * (1 - dp / 100));
    return sum + afterDiscount;
  }, 0);

  const invDiscPct =
    localDiscountType === "percent"
      ? Math.min(100, Math.max(0, parseFloat(invoiceDiscountPercent) || 0))
      : 0;
  const invDiscCts =
    localDiscountType === "fixed"
      ? Math.max(0, Math.round(parseFloat(invoiceDiscountCents) * 100) || 0)
      : 0;
  if (localDiscountType === "percent" && invDiscPct > 0) {
    subtotalAfterLineDiscounts = Math.round(
      subtotalAfterLineDiscounts * (1 - invDiscPct / 100)
    );
  } else if (localDiscountType === "fixed" && invDiscCts > 0) {
    subtotalAfterLineDiscounts = Math.max(0, subtotalAfterLineDiscounts - invDiscCts);
  }

  const enteredCents = subtotalAfterLineDiscounts;
  const vatCents = vatIncluded ? 0 : Math.round(enteredCents * VAT_RATE);
  const amountBeforeFeeCents = vatIncluded ? enteredCents : enteredCents + vatCents;
  const processingFeeCents = paymentProcessingFeeIncluded
    ? calcPaymentProcessingFeeCents(amountBeforeFeeCents, defaultCurrency)
    : 0;
  const totalCents = amountBeforeFeeCents + processingFeeCents;

  const [state, formAction, isPending] = useActionState(
    async (_prev: UpdateResult | null, formData: FormData) => {
      if (totalCents < 100) {
        toast.error("Minimum invoice amount is £1 (or equivalent in your currency)");
        return {
          error: "Minimum invoice amount is £1 (or equivalent in your currency)",
        };
      }
      return await updateInvoiceAction(formData);
    },
    null as UpdateResult | null
  );

  useEffect(() => {
    if (!state || "error" in state) return;
    if ("success" in state && state.success) {
      toast.success("Invoice updated");
      router.push(`/invoices/${invoice.id}`);
    }
  }, [state, router, invoice.id]);


  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="invoiceId" value={invoice.id} />
      <input type="hidden" name="currency" value={defaultCurrency} />
      <input
        type="hidden"
        name="clientId"
        value={selectedClient?.id ?? ""}
      />
      <input
        type="hidden"
        name="clientName"
        value={selectedClient?.name ?? ""}
      />
      <input
        type="hidden"
        name="clientEmail"
        value={selectedClient?.email ?? ""}
      />
      <input
        type="hidden"
        name="vatIncluded"
        value={vatIncluded ? "true" : "false"}
      />
      <input
        type="hidden"
        name="paymentProcessingFeeIncluded"
        value={paymentProcessingFeeIncluded ? "true" : "false"}
      />
      <input
        type="hidden"
        name="autoRemindEnabled"
        value={autoRemind ? "true" : "false"}
      />
      <input
        type="hidden"
        name="autoRemindDays"
        value={
          autoRemind && autoRemindDays.length > 0
            ? autoRemindDays.slice().sort((a, b) => a - b).join(",")
            : "1,3,7"
        }
      />
      <input type="hidden" name="discountType" value={localDiscountType} />
      <input
        type="hidden"
        name="discountPercent"
        value={localDiscountType === "percent" ? invoiceDiscountPercent : ""}
      />
      <input
        type="hidden"
        name="discountCents"
        value={
          localDiscountType === "fixed"
            ? String(Math.round((parseFloat(invoiceDiscountCents) || 0) * 100))
            : ""
        }
      />
      <input type="hidden" name="lineItems" value={lineItemsJson} />
      <input type="hidden" name="dueDate" value={dueDateState} />
      <input type="hidden" name="notes" value={notesState} />

      <div className="space-y-2">
        <Label htmlFor="client">Client name</Label>
        <ClientAutocomplete
          clients={clientsList}
          value={selectedClient}
          onSelect={setSelectedClient}
          onClientAdded={async () => {
            const next = await listClients();
            setClientsList(next);
          }}
          placeholder="Search or add client…"
          disabled={isPending}
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
            Add service
          </Button>
        </div>
        <div className="space-y-3">
          {lineItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-end sm:gap-2"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`desc-${item.id}`} className="text-xs">
                  Description
                </Label>
                <Input
                  id={`desc-${item.id}`}
                  placeholder="e.g. Plumbing repair — kitchen sink"
                  disabled={isPending}
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(item.id, "description", e.target.value)
                  }
                  className="h-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="w-24 flex-shrink-0 space-y-1">
                  <Label htmlFor={`amt-${item.id}`} className="text-xs">
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
                <div className="w-20 flex-shrink-0 space-y-1">
                  <Label
                    htmlFor={`disc-${item.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Disc. %
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
                  className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Remove service"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-1">
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
              Tax included in amount (20% VAT shown as breakdown)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="paymentProcessingFeeIncluded"
              checked={paymentProcessingFeeIncluded}
              onChange={(e) => setPaymentProcessingFeeIncluded(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-white/20 bg-[#121821] accent-[#3B82F6]"
            />
            <Label
              htmlFor="paymentProcessingFeeIncluded"
              className="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              Include payment processing fee in invoice (1.5% + fixed)
            </Label>
          </div>
        </div>
        {vatIncluded && !paymentProcessingFeeIncluded ? (
          <p className="text-xs text-muted-foreground">
            VAT (20%) is included in the price.
          </p>
        ) : enteredCents > 0 ? (
          <p className="text-xs text-muted-foreground">
            Subtotal: {formatMoney(enteredCents, defaultCurrency)}
            {!vatIncluded &&
              ` + VAT (20%): ${formatMoney(vatCents, defaultCurrency)}`}
            {paymentProcessingFeeIncluded &&
              ` + Processing fee: ${formatMoney(processingFeeCents, defaultCurrency)}`}
            {" → Total: "}
            {formatMoney(totalCents, defaultCurrency)}
          </p>
        ) : null}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {showMore ? "− Less" : "+ More options"}
        </button>
        {showMore && (
          <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date (optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDateState}
                onChange={(e) => setDueDateState(e.target.value)}
                disabled={isPending}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Internal or client notes"
                value={notesState}
                onChange={(e) => setNotesState(e.target.value)}
                disabled={isPending}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice discount (optional)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={localDiscountType}
                  onChange={(e) =>
                    setLocalDiscountType(
                      e.target.value as "percent" | "fixed" | "none"
                    )
                  }
                  disabled={isPending}
                  className="h-10 rounded-md border border-border bg-[#121821] px-3 text-sm"
                >
                  <option value="none">None</option>
                  <option value="percent">Percent %</option>
                  <option value="fixed">Fixed amount</option>
                </select>
                {localDiscountType === "percent" && (
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="10"
                    disabled={isPending}
                    value={invoiceDiscountPercent}
                    onChange={(e) => setInvoiceDiscountPercent(e.target.value)}
                    className="h-10 w-24"
                  />
                )}
                {localDiscountType === "fixed" && (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isPending}
                    value={invoiceDiscountCents}
                    onChange={(e) => setInvoiceDiscountCents(e.target.value)}
                    className="h-10 w-28"
                  />
                )}
              </div>
            </div>
            {selectedClient?.email && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRemind"
                    checked={autoRemind}
                    onChange={(e) => setAutoRemind(e.target.checked)}
                    disabled={isPending}
                    className="h-4 w-4 rounded border-white/20 bg-[#121821] accent-[#3B82F6]"
                  />
                  <Label
                    htmlFor="autoRemind"
                    className="cursor-pointer text-sm font-normal text-muted-foreground"
                  >
                    Auto-remind client — pick days after send
                  </Label>
                </div>
                {autoRemind && (
                  <div className="flex flex-wrap gap-3 pl-6">
                    {AUTO_REMIND_DAYS.map((d) => (
                      <label
                        key={d}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={autoRemindDays.includes(d)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAutoRemindDays((prev) =>
                                [...prev, d].sort((a, b) => a - b)
                              );
                            } else {
                              const next = autoRemindDays.filter((x) => x !== d);
                              setAutoRemindDays(next.length > 0 ? next : [1]);
                            }
                          }}
                          disabled={isPending}
                          className="h-4 w-4 rounded border-white/20 bg-[#121821] accent-[#3B82F6]"
                        />
                        <span className="text-sm">
                          {d} {d === 1 ? "day" : "days"}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 min-h-12 w-full rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB] sm:min-w-[200px] sm:w-auto"
        >
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.push(`/invoices/${invoice.id}`)}
          className="h-12 min-h-12"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
