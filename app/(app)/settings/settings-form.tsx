"use client";

import Link from "next/link";
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
import { Pencil } from "lucide-react";
import { updateProfileAction, setPasswordAction, sendPasswordResetEmailAction } from "./actions";
import { maskEmail } from "@/lib/utils";
import { ConnectStripeButton } from "./connect-stripe-button";
import { useRouter } from "next/navigation";

const CURRENCIES = ["USD", "EUR", "GBP"];

type Profile = {
  business_name: string | null;
  default_currency: string;
  country: string | null;
  timezone: string | null;
  stripe_connect_account_id: string | null;
  hasPassword?: boolean;
  email?: string | null;
};

export function SettingsForm({ profile, recovery = false }: { profile: Profile; recovery?: boolean }) {
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
    <div className="space-y-6" key={profile.default_currency}>
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
      </form>

      <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
        <h2 className="mb-2 text-base font-semibold">Account security</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Set a password so you can always sign in with email and password, even if
          magic links don&apos;t work.
        </p>
        <SetPasswordForm
          hasPassword={profile.hasPassword ?? false}
          email={profile.email ?? null}
          recovery={recovery}
        />
      </section>

      <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
        <h2 className="mb-2 text-base font-semibold">Payments</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Connect Stripe to receive payments directly. Puyer does not store bank details.
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

      <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
        <h2 className="mb-2 text-base font-semibold">Support</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Need help? Contact us or review our terms.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <a
            href="mailto:support@puyer.org"
            className="text-[#3B82F6] underline hover:text-blue-400"
          >
            support@puyer.org
          </a>
          <Link
            href="/terms"
            className="text-[#3B82F6] underline hover:text-blue-400"
          >
            Terms of Service
          </Link>
        </div>
      </section>
    </div>
  );
}

function SetPasswordForm({
  hasPassword,
  email,
  recovery,
}: {
  hasPassword: boolean;
  email: string | null;
  recovery: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(recovery);
  const [resetSent, setResetSent] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await setPasswordAction(formData);
    },
    null as { error?: string; success?: boolean } | null
  );

  useEffect(() => {
    if (state?.success) {
      setIsEditing(false);
      if (recovery) {
        router.replace("/settings");
      } else {
        router.refresh();
      }
    }
  }, [state?.success, router, recovery]);

  const showForm = !hasPassword || isEditing;
  const requireOldPassword = hasPassword && !recovery && isEditing;
  const maskedEmail = email ? maskEmail(email) : "your email";

  const handleResetPassword = async () => {
    setResetPending(true);
    setResetError(null);
    const result = await sendPasswordResetEmailAction();
    setResetPending(false);
    if (result?.error) {
      setResetError(result.error);
      return;
    }
    setResetSent(true);
    setIsEditing(false);
    router.refresh();
  };

  if (!showForm) {
    return (
      <div className="space-y-3">
        {resetSent && (
          <p className="text-sm text-emerald-500">
            Password reset link sent to {maskedEmail}. Check your email to set a new password.
          </p>
        )}
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg tracking-widest text-muted-foreground">
            ••••••••
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Change password"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recovery && (
        <p className="text-sm text-emerald-500">
          You requested a password reset. Set your new password below.
        </p>
      )}
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="has_password" value={hasPassword ? "true" : "false"} />
        <input type="hidden" name="recovery" value={recovery ? "true" : "false"} />
        {requireOldPassword && (
          <div className="space-y-2">
            <Label htmlFor="old_password">Current password</Label>
            <Input
              id="old_password"
              name="old_password"
              type="password"
              placeholder="Enter your current password"
              autoComplete="current-password"
              required
              disabled={isPending}
              className="h-10"
            />
          </div>
        )}
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isPending}
            className="rounded-lg"
          >
            {isPending ? "Saving…" : hasPassword ? "Change password" : "Set password"}
          </Button>
          {hasPassword && !recovery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setIsEditing(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
          )}
        </div>
        {requireOldPassword && (
          <p className="text-sm text-muted-foreground">
            Don&apos;t remember your password?{" "}
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetPending || resetSent}
              className="text-[#3B82F6] underline hover:text-blue-400 disabled:opacity-50"
            >
              {resetSent
                ? "Link sent"
                : resetPending
                  ? "Sending…"
                  : "Confirm via email"}
            </button>{" "}
            — we&apos;ll send a reset link to {maskedEmail}.
            {resetError && (
              <span className="mt-1 block text-destructive">{resetError}</span>
            )}
          </p>
        )}
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state?.success && (
          <p className="text-sm text-emerald-500">
            Password updated. Confirmation sent to your email.
          </p>
        )}
      </form>
    </div>
  );
}
