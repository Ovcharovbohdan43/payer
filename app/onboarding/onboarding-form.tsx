"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { submitOnboarding } from "./actions";
import { cn } from "@/lib/utils";

const CURRENCIES = ["USD", "EUR", "GBP"];

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await submitOnboarding(formData);
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="business_name">Business name</Label>
        <Input
          id="business_name"
          name="business_name"
          placeholder="My Business"
          required
          disabled={isPending}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="default_currency">Default currency</Label>
        <select
          id="default_currency"
          name="default_currency"
          required
          disabled={isPending}
          className={cn(
            "flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Country (optional)</Label>
        <Input
          id="country"
          name="country"
          placeholder="e.g. United Kingdom"
          disabled={isPending}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone (optional)</Label>
        <Input
          id="timezone"
          name="timezone"
          placeholder="e.g. Europe/London"
          disabled={isPending}
          className="h-11"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Continue to dashboard"}
      </Button>
    </form>
  );
}
