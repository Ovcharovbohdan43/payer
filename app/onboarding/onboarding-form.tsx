"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { submitOnboarding } from "./actions";
import { cn } from "@/lib/utils";

const CURRENCIES = ["USD", "EUR", "GBP"];

const COMPANY_TYPES = [
  "Consulting",
  "IT / Software",
  "Design & Creative",
  "Construction & Trades",
  "Retail & E-commerce",
  "Healthcare",
  "Legal",
  "Accounting & Finance",
  "Marketing & PR",
  "Education & Training",
  "Hospitality",
  "Manufacturing",
  "Other",
];

type Props = {
  initialEmail?: string | null;
};

export function OnboardingForm({ initialEmail }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await submitOnboarding(formData);
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="first_name">
            First name <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="first_name"
            name="first_name"
            placeholder="John"
            required
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">
            Last name <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="last_name"
            name="last_name"
            placeholder="Smith"
            required
            disabled={isPending}
            className="h-11"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-muted-foreground">(required)</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          disabled={isPending}
          defaultValue={initialEmail ?? ""}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business_name">
          Company name <span className="text-muted-foreground">(required)</span>
        </Label>
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
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+44 20 7123 4567"
          disabled={isPending}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address (optional)</Label>
        <Input
          id="address"
          name="address"
          placeholder="Street, City, Postcode"
          disabled={isPending}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website (optional)</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://example.com"
          disabled={isPending}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company_type">Company type / Industry (optional)</Label>
        <select
          id="company_type"
          name="company_type"
          disabled={isPending}
          className={cn(
            "flex h-11 w-full rounded-md border border-[#3B82F6]/40 bg-[#121821] px-3 py-2 text-sm text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
          )}
        >
          <option value="">Select…</option>
          {COMPANY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="default_currency">Default currency</Label>
        <select
          id="default_currency"
          name="default_currency"
          required
          disabled={isPending}
          className={cn(
            "flex h-11 w-full rounded-md border border-[#3B82F6]/40 bg-[#121821] px-3 py-2 text-sm text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
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
      <Button
        type="submit"
        size="lg"
        className="w-full rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]"
        disabled={isPending}
      >
        {isPending ? "Saving…" : "Continue to dashboard"}
      </Button>
    </form>
  );
}
