"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientAutocomplete } from "@/components/clients/client-autocomplete";
import type { ClientRow } from "@/app/clients/actions";
import { listClients } from "@/app/clients/actions";
import { createOfferAction, type CreateOfferResult } from "@/app/offers/actions";
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

type Props = {
  defaultCurrency: string;
  clients: ClientRow[];
};

export function NewOfferForm({ defaultCurrency, clients }: Props) {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [clientsList, setClientsList] = useState(clients);
  const [showMore, setShowMore] = useState(false);
  const [vatIncluded, setVatIncluded] = useState(false);
  const [paymentProcessingFeeIncluded, setPaymentProcessingFeeIncluded] = useState(false);
  const [lineItems, setLineItems] = useState<LineItemInput[]>(() => [
    createEmptyLineItem(),
  ]);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<
    "percent" | "fixed" | "none"
  >("none");
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

  const lineItemsJson = JSON.stringify(
    lineItems
      .filter((item) => item.description.trim() && item.amount.trim())
      .map((item) => {
        const amt = parseFloat(item.amount) || 0;
        const dp = Math.min(
          100,
          Math.max(0, parseFloat(item.discountPercent) || 0)
        );
        return {
          description: item.description.trim(),
          amount: amt,
          discountPercent: dp,
        };
      })
  );

  let subtotalAfterLineDiscounts = lineItems.reduce((sum, item) => {
    const amt = parseFloat(item.amount);
    const dp = Math.min(100, Math.max(0, parseFloat(item.discountPercent) || 0));
    const rawCents = isNaN(amt) || amt < 0 ? 0 : Math.round(amt * 100);
    const afterDiscount = Math.round(rawCents * (1 - dp / 100));
    return sum + afterDiscount;
  }, 0);

  const invDiscPct =
    invoiceDiscountType === "percent"
      ? Math.min(100, Math.max(0, parseFloat(invoiceDiscountPercent) || 0))
      : 0;
  const invDiscCts =
    invoiceDiscountType === "fixed"
      ? Math.max(0, Math.round(parseFloat(invoiceDiscountCents) * 100) || 0)
      : 0;
  if (invoiceDiscountType === "percent" && invDiscPct > 0) {
    subtotalAfterLineDiscounts = Math.round(
      subtotalAfterLineDiscounts * (1 - invDiscPct / 100)
    );
  } else if (invoiceDiscountType === "fixed" && invDiscCts > 0) {
    subtotalAfterLineDiscounts = Math.max(
      0,
      subtotalAfterLineDiscounts - invDiscCts
    );
  }

  const enteredCents = vatIncluded
    ? subtotalAfterLineDiscounts
    : subtotalAfterLineDiscounts +
      Math.round(subtotalAfterLineDiscounts * VAT_RATE);
  const processingFeeCents = paymentProcessingFeeIncluded
    ? calcPaymentProcessingFeeCents(enteredCents, defaultCurrency)
    : 0;
  const totalCents = enteredCents + processingFeeCents;

  const [state, formAction, isPending] = useActionState(
    async (_prev: CreateOfferResult | null, formData: FormData) => {
      if (totalCents < 100) {
        toast.error("Minimum offer amount is £1 (or equivalent)");
        return { error: "Minimum offer amount is £1 (or equivalent)" };
      }
      const intent = formData.get("intent");
      const markSent = intent === "copy";
      return await createOfferAction(formData, { markSent });
    },
    null as CreateOfferResult | null
  );

  useEffect(() => {
    if (!state || "error" in state) return;
    if (state.offerId && state.publicUrl) {
      if (state.number) {
        toast.success("Offer created");
      }
      router.push(`/offers/${state.offerId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="currency" value={defaultCurrency} />
      <input type="hidden" name="clientId" value={selectedClient?.id ?? ""} />
      <input type="hidden" name="clientName" value={selectedClient?.name ?? ""} />
      <input type="hidden" name="clientEmail" value={selectedClient?.email ?? ""} />
      <input type="hidden" name="vatIncluded" value={vatIncluded ? "true" : "false"} />
      <input
        type="hidden"
        name="paymentProcessingFeeIncluded"
        value={paymentProcessingFeeIncluded ? "true" : "false"}
      />
      <input type="hidden" name="discountType" value={invoiceDiscountType} />
      <input
        type="hidden"
        name="discountPercent"
        value={invoiceDiscountType === "percent" ? invoiceDiscountPercent : ""}
      />
      <input
        type="hidden"
        name="discountCents"
        value={
          invoiceDiscountType === "fixed"
            ? String(Math.round((parseFloat(invoiceDiscountCents) || 0) * 100))
            : ""
        }
      />
      <input type="hidden" name="lineItems" value={lineItemsJson} />

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
                  placeholder="e.g. Kitchen renovation"
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
              Tax included in amount (20% VAT)
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
              Include payment processing fee (1.5% + fixed)
            </Label>
          </div>
        </div>
        {totalCents > 0 && (
          <p className="text-xs text-muted-foreground">
            {paymentProcessingFeeIncluded ? (
              <>
                Subtotal: {formatMoney(enteredCents, defaultCurrency)}
                {` + Processing fee: ${formatMoney(processingFeeCents, defaultCurrency)} → `}
                Total: {formatMoney(totalCents, defaultCurrency)}
              </>
            ) : (
              <>Total: {formatMoney(totalCents, defaultCurrency)}</>
            )}
          </p>
        )}
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
              <Label htmlFor="dueDate">Valid until (optional)</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                disabled={isPending}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Internal or client notes"
                disabled={isPending}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Offer discount (optional)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={invoiceDiscountType}
                  onChange={(e) =>
                    setInvoiceDiscountType(
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
                {invoiceDiscountType === "percent" && (
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="10"
                    disabled={isPending}
                    value={invoiceDiscountPercent}
                    onChange={(e) =>
                      setInvoiceDiscountPercent(e.target.value)
                    }
                    className="h-10 w-24"
                  />
                )}
                {invoiceDiscountType === "fixed" && (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isPending}
                    value={invoiceDiscountCents}
                    onChange={(e) =>
                      setInvoiceDiscountCents(e.target.value)
                    }
                    className="h-10 w-28"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <Button
          type="submit"
          name="intent"
          value="copy"
          disabled={isPending}
          className="h-12 min-h-12 w-full rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB] sm:min-w-[200px] sm:w-auto"
        >
          {isPending ? "Creating…" : "Create offer"}
        </Button>
      </div>
    </form>
  );
}
