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
    <form action={formAction} className="min-w-0 space-y-3 overflow-hidden rounded-[14px] border border-white/5 bg-[#121821]/80 p-3 sm:rounded-[20px] sm:p-6">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
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
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-3">
          <Label htmlFor="address">Address (optional)</Label>
          <Input id="address" name="address" placeholder="Street, city, postcode" disabled={isPending} className="h-10 max-w-full" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company_name">Company name (optional)</Label>
          <Input id="company_name" name="company_name" placeholder="Company Ltd" disabled={isPending} className="h-10 max-w-full" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vat_number">VAT number (optional)</Label>
          <Input id="vat_number" name="vat_number" placeholder="GB123456789" disabled={isPending} className="h-10 max-w-full" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="min-h-10 h-10 min-w-[120px] touch-manipulation">
          {isPending ? "Adding…" : "Add client"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
