"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientAutocomplete } from "@/components/clients/client-autocomplete";
import type { ClientRow } from "@/app/clients/actions";
import { listClients } from "@/app/clients/actions";
import { createInvoiceAction, type CreateResult } from "../actions";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NewInvoiceFormProps = {
  defaultCurrency: string;
  showVatFields: boolean;
  clients: ClientRow[];
};

export function NewInvoiceForm({ defaultCurrency, showVatFields, clients }: NewInvoiceFormProps) {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [clientsList, setClientsList] = useState(clients);
  const [showMore, setShowMore] = useState(false);

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

      <div className="space-y-2">
        <Label htmlFor="description">Service</Label>
        <Input
          id="description"
          name="description"
          placeholder="e.g. Plumbing repair — kitchen sink"
          required
          disabled={isPending}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
          disabled={isPending}
          className="h-11"
        />
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
