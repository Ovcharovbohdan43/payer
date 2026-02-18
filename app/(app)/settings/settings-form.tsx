"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { updateProfileAction } from "./actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const CURRENCIES = ["USD", "EUR", "GBP"];

type Profile = {
  business_name: string | null;
  default_currency: string;
  country: string | null;
  timezone: string | null;
  show_vat_fields: boolean;
};

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await updateProfileAction(formData);
    },
    null as { error?: string } | null
  );

  useEffect(() => {
    if (state && !state.error) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Business profile</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business name</Label>
            <Input
              id="business_name"
              name="business_name"
              placeholder="My Business"
              required
              disabled={isPending}
              defaultValue={profile.business_name ?? ""}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_currency">Default currency</Label>
            <select
              id="default_currency"
              name="default_currency"
              required
              disabled={isPending}
              defaultValue={profile.default_currency}
              className={cn(
                "flex h-10 w-full rounded-lg border border-white/10 bg-[#121821]/50 px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
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
              defaultValue={profile.country ?? ""}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone (optional)</Label>
            <Input
              id="timezone"
              name="timezone"
              placeholder="e.g. Europe/London"
              disabled={isPending}
              defaultValue={profile.timezone ?? "UTC"}
              className="h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show_vat_fields"
              name="show_vat_fields"
              defaultChecked={profile.show_vat_fields}
              disabled={isPending}
              className="h-4 w-4 rounded border-white/20 bg-[#121821]"
            />
            <Label htmlFor="show_vat_fields" className="cursor-pointer font-normal">
              Show VAT / tax fields on invoices
            </Label>
          </div>
        </div>
      </section>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state && !state.error && (
        <p className="text-sm text-emerald-500">Settings saved.</p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="h-10 rounded-xl bg-[#3B82F6] px-6 font-semibold hover:bg-[#2563EB]"
      >
        {isPending ? "Saving…" : "Save changes"}
      </Button>

      <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
        <h2 className="mb-2 text-base font-semibold">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Billing portal and subscription management coming soon.
        </p>
      </section>
    </form>
  );
}
