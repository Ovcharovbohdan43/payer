"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActionState, useEffect, useState } from "react";
import { updateProfileAction, setPasswordAction } from "./actions";
import { ConnectStripeButton } from "./connect-stripe-button";
import { useRouter } from "next/navigation";

const CURRENCIES = ["USD", "EUR", "GBP"];

type Profile = {
  business_name: string | null;
  default_currency: string;
  country: string | null;
  timezone: string | null;
  stripe_connect_account_id: string | null;
};

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [currency, setCurrency] = useState(profile.default_currency);
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
    <form action={formAction} className="space-y-6" key={profile.default_currency}>
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
            <p className="text-xs text-muted-foreground">
              Changing currency resets dashboard counters (revenue, money owed, overdue) — only invoices in the selected currency are counted.
            </p>
            <Select
              value={currency}
              onValueChange={setCurrency}
              disabled={isPending}
            >
              <SelectTrigger
                id="default_currency"
                className="h-10 w-full rounded-lg border-white/10 bg-[#121821]/50"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#121821] text-white [&_[data-slot=select-item]]:focus:bg-white/10 [&_[data-slot=select-item][data-highlighted]]:bg-white/10">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="default_currency" value={currency} />
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
        <h2 className="mb-2 text-base font-semibold">Account security</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Set a password so you can always sign in with email and password, even if
          magic links don&apos;t work.
        </p>
        <SetPasswordForm />
      </section>

      <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
        <h2 className="mb-2 text-base font-semibold">Payments</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Connect Stripe to receive payments directly. Payer does not store bank details.
        </p>
        {profile.stripe_connect_account_id ? (
          <div className="flex items-center gap-2 text-sm text-emerald-500">
            <span className="size-2 rounded-full bg-emerald-500" />
            Stripe connected
          </div>
        ) : (
          <ConnectStripeButton />
        )}
      </section>
    </form>
  );
}

function SetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await setPasswordAction(formData);
    },
    null as { error?: string; success?: boolean } | null
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          disabled={isPending}
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          placeholder="Repeat password"
          autoComplete="new-password"
          required
          disabled={isPending}
          className="h-10"
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={isPending}
        className="rounded-lg"
      >
        {isPending ? "Saving…" : "Set password"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-500">Password set.</p>}
    </form>
  );
}
