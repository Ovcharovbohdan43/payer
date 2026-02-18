"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientAutocomplete } from "@/components/clients/client-autocomplete";
import type { ClientRow } from "@/app/clients/actions";
import { listClients } from "@/app/clients/actions";
import { createInvoiceAction, type CreateResult } from "../actions";
import { useActionState, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

const VAT_RATE = 0.2; // 20%

export type LineItemInput = {
  id: string;
  description: string;
  amount: string;
};

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

type NewInvoiceFormProps = {
  defaultCurrency: string;
  clients: ClientRow[];
};

function createEmptyLineItem(): LineItemInput {
  return {
    id: crypto.randomUUID(),
    description: "",
    amount: "",
  };
}

export function NewInvoiceForm({ defaultCurrency, clients }: NewInvoiceFormProps) {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [clientsList, setClientsList] = useState(clients);
  const [showMore, setShowMore] = useState(false);
  const [vatIncluded, setVatIncluded] = useState(false);
  const [lineItems, setLineItems] = useState<LineItemInput[]>(() => [
    createEmptyLineItem(),
  ]);

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
    (id: string, field: "description" | "amount", value: string) => {
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
      .map((item) => ({
        description: item.description.trim(),
        amount: parseFloat(item.amount) || 0,
      }))
  );

  const subtotalCents = lineItems.reduce((sum, item) => {
    const amt = parseFloat(item.amount);
    return sum + (isNaN(amt) || amt < 0 ? 0 : Math.round(amt * 100));
  }, 0);
  const vatCents = Math.round(subtotalCents * VAT_RATE);
  const totalCents = subtotalCents + vatCents;

  const [state, formAction, isPending] = useActionState(
    async (_prev: CreateResult | null, formData: FormData) => {
      const intent = formData.get("intent");
      const markSent = intent === "copy" || intent === "email";
      return await createInvoiceAction(formData, { markSent });
    },
    null as CreateResult | null
  );

  useEffect(() => {
    if (!state || "error" in state) return;
    if (state.invoiceId && state.publicUrl) {
      if (state.intent === "copy") {
        navigator.clipboard.writeText(state.publicUrl).catch(() => {});
      }
      router.push(`/invoices/${state.invoiceId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
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
                  placeholder="e.g. Plumbing repair — kitchen sink"
                  disabled={isPending}
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(item.id, "description", e.target.value)
                  }
                  className="h-10"
                />
              </div>
              <div className="flex gap-2">
                <div className="w-28 flex-shrink-0 space-y-1">
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
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="vatIncluded"
            checked={vatIncluded}
            onChange={(e) => setVatIncluded(e.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-white/20 bg-[#121821]"
          />
          <Label
            htmlFor="vatIncluded"
            className="cursor-pointer text-sm font-normal text-muted-foreground"
          >
            Tax included in amount (20% VAT shown as breakdown)
          </Label>
        </div>
        {vatIncluded ? (
          <p className="text-xs text-muted-foreground">
            VAT (20%) is included in the price.
          </p>
        ) : subtotalCents > 0 ? (
          <p className="text-xs text-muted-foreground">
            Subtotal: {formatMoney(subtotalCents, defaultCurrency)} + VAT
            (20%): {formatMoney(vatCents, defaultCurrency)} → Total:{" "}
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
          </div>
        )}
      </div>

      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          name="intent"
          value="copy"
          disabled={isPending}
          className="min-h-12 w-full rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB] sm:min-w-[200px] sm:w-auto"
        >
          {isPending ? "Creating…" : "Create invoice"}
        </Button>
        {selectedClient?.email && (
          <Button
            type="submit"
            name="intent"
            value="email"
            variant="secondary"
            disabled={isPending}
            className="min-w-[180px]"
          >
            {isPending ? "Creating…" : "Create & send email"}
          </Button>
        )}
      </div>
    </form>
  );
}
