"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientRow } from "@/app/clients/actions";
import { createClientAction } from "@/app/clients/actions";
import { useActionState, useRef, useState } from "react";

type ClientAutocompleteProps = {
  clients: ClientRow[];
  value: ClientRow | null;
  onSelect: (client: ClientRow | null) => void;
  onClientAdded?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Reusable client picker: input + dropdown of clients, "Add new" to create and select.
 * Mobile-friendly tap targets.
 */
export function ClientAutocomplete({
  clients,
  value,
  onSelect,
  onClientAdded,
  placeholder = "Search or add client…",
  disabled = false,
}: ClientAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered =
    search.trim() === ""
      ? clients.slice(0, 8)
      : clients.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.email ?? "").toLowerCase().includes(search.toLowerCase())
        );

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={open ? search : value?.name ?? ""}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { onSelect(null); setSearch(""); inputRef.current?.focus(); }}
            disabled={disabled}
            className="shrink-0"
          >
            Clear
          </Button>
        )}
      </div>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[200px] rounded-md border border-border bg-popover py-1 shadow-md"
          role="listbox"
        >
          {filtered.map((client) => (
            <button
              key={client.id}
              type="button"
              className="w-full px-3 py-2.5 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
              onClick={() => {
                onSelect(client);
                setSearch("");
                setOpen(false);
              }}
              role="option"
            >
              <span className="font-medium">{client.name}</span>
              {client.email && (
                <span className="ml-2 text-muted-foreground">{client.email}</span>
              )}
            </button>
          ))}
          <button
            type="button"
            className="w-full border-t border-border px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-accent focus:bg-accent focus:outline-none"
            onClick={() => { setAddOpen(true); setOpen(false); }}
          >
            ＋ Add new client
          </button>
        </div>
      )}

      <AddClientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={(newClient) => {
          onSelect(newClient);
          onClientAdded?.();
        }}
      />
    </div>
  );
}

function AddClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (client: ClientRow) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; data?: ClientRow } | null, formData: FormData) => {
      const result = await createClientAction(formData);
      if (result.data) {
        onSuccess(result.data);
        onOpenChange(false);
      }
      return result;
    },
    null as { error?: string; data?: ClientRow } | null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ac-name">Name</Label>
              <Input id="ac-name" name="name" placeholder="Client name" required disabled={isPending} className="h-10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ac-email">Email (optional)</Label>
                <Input id="ac-email" name="email" type="email" placeholder="email@example.com" disabled={isPending} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ac-phone">Phone (optional)</Label>
                <Input id="ac-phone" name="phone" type="tel" placeholder="+1 234 567 8900" disabled={isPending} className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac-address">Address (optional)</Label>
              <Input id="ac-address" name="address" placeholder="Street, city, postcode" disabled={isPending} className="h-10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ac-company_name">Company (optional)</Label>
                <Input id="ac-company_name" name="company_name" placeholder="Company Ltd" disabled={isPending} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ac-vat_number">VAT (optional)</Label>
                <Input id="ac-vat_number" name="vat_number" placeholder="GB123456789" disabled={isPending} className="h-10" />
              </div>
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add & select"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
