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
    <form action={formAction} className="flex flex-col gap-3 rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 sm:rounded-[20px] sm:flex-row sm:items-end sm:gap-4 sm:p-6">
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Client name" required disabled={isPending} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" name="email" type="email" placeholder="email@example.com" disabled={isPending} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" type="tel" placeholder="+1 234 567 8900" disabled={isPending} className="h-10" />
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="h-10 w-full min-w-0 sm:min-w-[120px] sm:w-auto">
        {isPending ? "Adding…" : "Add client"}
      </Button>
      {state?.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
    </form>
  );
}
