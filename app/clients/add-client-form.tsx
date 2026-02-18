"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { createClientAction } from "./actions";

export function AddClientForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; data?: { id: string } } | null, formData: FormData) => {
      return await createClientAction(formData);
    },
    null as { error?: string; data?: { id: string } } | null
  );

  return (
    <form action={formAction} className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-[14px] border border-white/5 bg-[#121821]/80 p-3 sm:rounded-[20px] sm:flex-row sm:items-end sm:gap-4 sm:p-6">
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Client name" required disabled={isPending} className="h-10 min-h-10 max-w-full" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" name="email" type="email" placeholder="email@example.com" disabled={isPending} className="h-10 max-w-full" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" type="tel" placeholder="+1 234 567 8900" disabled={isPending} className="h-10 max-w-full" />
        </div>
      </div>
        <Button type="submit" disabled={isPending} className="min-h-10 h-10 w-full min-w-0 sm:min-w-[120px] sm:w-auto touch-manipulation">
        {isPending ? "Adding…" : "Add client"}
      </Button>
      {state?.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
    </form>
  );
}
