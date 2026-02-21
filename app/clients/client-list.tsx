"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientRow } from "./actions";
import { deleteClientAction, updateClientAction } from "./actions";
import { useActionState, useState } from "react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

export function ClientList({ clients }: { clients: ClientRow[] }) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ClientRow | null>(null);

  const filtered = search.trim()
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (c.company_name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  return (
    <>
      <div className="min-w-0 space-y-4">
        <div className="relative">
          <input
            type="search"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-10 w-full min-w-0 rounded-lg border border-white/10 bg-[#121821]/50 px-3 py-2.5 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
            aria-label="Search clients"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground sm:py-8">
            {clients.length === 0 ? "No clients yet. Add one above." : "No clients match your search."}
          </p>
        ) : (
          <ul className="divide-y divide-white/5 min-w-0 overflow-hidden rounded-[14px] border border-white/5 bg-[#121821]/80 sm:rounded-[20px]">
            {filtered.map((client) => (
              <li
                key={client.id}
                className="flex min-h-[52px] min-w-0 items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3"
              >
                <Link
                  href={`/clients/${client.id}`}
                  className="min-w-0 flex-1 cursor-pointer transition-colors hover:text-foreground"
                >
                  <p className="font-medium truncate">{client.name}</p>
                  {(client.company_name || client.email || client.phone) && (
                    <p className="text-sm text-muted-foreground truncate">
                      {[client.company_name, client.email, client.phone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 min-h-10 w-10 shrink-0 touch-manipulation" aria-label="Actions">
                      <MoreHorizontalIcon className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(client)}>
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={async (e) => {
                        e.preventDefault();
                        if (confirm("Delete this client? Invoices will keep the name but link will be removed.")) {
                          await deleteClientAction(client.id);
                        }
                      }}
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditClientDialog client={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function EditClientDialog({ client, onClose }: { client: ClientRow | null; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      if (!client) return null;
      const result = await updateClientAction(formData);
      if (!result.error) onClose();
      return result;
    },
    null as { error?: string } | null
  );

  if (!client) return null;

  return (
    <Dialog open={!!client} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[min(100%,calc(100vw-2rem))] max-w-md sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="clientId" value={client.id} />
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={client.name}
                required
                disabled={isPending}
                className="h-10"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email (optional)</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={client.email ?? ""}
                  disabled={isPending}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone (optional)</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  type="tel"
                  defaultValue={client.phone ?? ""}
                  disabled={isPending}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address (optional)</Label>
              <Input
                id="edit-address"
                name="address"
                placeholder="Street, city, postcode"
                defaultValue={client.address ?? ""}
                disabled={isPending}
                className="h-10"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-company_name">Company name (optional)</Label>
                <Input
                  id="edit-company_name"
                  name="company_name"
                  defaultValue={client.company_name ?? ""}
                  disabled={isPending}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vat_number">VAT number (optional)</Label>
                <Input
                  id="edit-vat_number"
                  name="vat_number"
                  defaultValue={client.vat_number ?? ""}
                  disabled={isPending}
                  className="h-10"
                />
              </div>
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
