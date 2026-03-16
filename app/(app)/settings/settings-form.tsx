"use client";

import Image from "next/image";
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
import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Building2, ImagePlus, Trash2 } from "lucide-react";
import { updateProfileAction, setPasswordAction, sendPasswordResetEmailAction, removeLogoAction } from "./actions";
import { maskEmail } from "@/lib/utils";
import { ConnectStripeButton } from "./connect-stripe-button";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP"];

type Profile = {
  business_name: string | null;
  default_currency: string;
  country: string | null;
  timezone: string | null;
  stripe_connect_account_id: string | null;
  stripe_customer_id?: string | null;
  subscription_status?: string | null;
  hasPassword?: boolean;
  email?: string | null;
  address?: string | null;
  phone?: string | null;
  company_number?: string | null;
  vat_number?: string | null;
  logo_url?: string | null;
  escalation_cc_owner?: boolean;
};

type CalendarConnection = { id: string; created_at: string } | null;

export function SettingsForm({
  profile,
  recovery = false,
  googleCalendarConnection = null,
  microsoftCalendarConnection = null,
  integrationSuccess = null,
  integrationError = false,
}: {
  profile: Profile;
  recovery?: boolean;
  googleCalendarConnection?: CalendarConnection;
  microsoftCalendarConnection?: CalendarConnection;
  integrationSuccess?: string | null;
  integrationError?: boolean;
}) {
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
            <Label>Company name</Label>
            <div className="rounded-lg border border-white/10 bg-[#121821]/50 px-3 py-2.5 text-sm text-foreground">
              {profile.business_name || "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              To change your company name, contact support at{" "}
              <a
                href="mailto:support@puyer.org"
                className="text-[#3B82F6] underline hover:text-blue-400"
              >
                support@puyer.org
              </a>
            </p>
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
          <div className="border-t border-white/5 pt-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Building2 className="size-4" />
              Contact & legal (shown on invoices)
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address (optional)</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Street, city, postcode, country"
                  disabled={isPending}
                  defaultValue={profile.address ?? ""}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+44 123 456 7890"
                  disabled={isPending}
                  defaultValue={profile.phone ?? ""}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_number">Company / Registration number (optional)</Label>
                <Input
                  id="company_number"
                  name="company_number"
                  placeholder="e.g. 12345678"
                  disabled={isPending}
                  defaultValue={profile.company_number ?? ""}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_number">VAT number (optional)</Label>
                <Input
                  id="vat_number"
                  name="vat_number"
                  placeholder="e.g. GB123456789"
                  disabled={isPending}
                  defaultValue={profile.vat_number ?? ""}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        </div>
        </section>

        <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
          <h2 className="mb-4 text-base font-semibold">Reminders</h2>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="escalation_cc_owner"
              value="on"
              defaultChecked={profile.escalation_cc_owner !== false}
              disabled={isPending}
              className="size-4 rounded border-white/20 bg-[#121821]/50 text-[#3B82F6] focus:ring-[#3B82F6]"
            />
            <span className="text-sm text-foreground">
              Copy to me when overdue reminder is sent
            </span>
          </label>
          <p className="mt-2 text-xs text-muted-foreground">
            When an invoice is 7+ days overdue, we send one overdue reminder to the client. If enabled, a copy is sent to your account email.
          </p>
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

      <LogoSection profile={profile} />

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

      <SubscriptionSection
        subscriptionStatus={profile.subscription_status ?? "free"}
        hasStripeCustomer={!!profile.stripe_customer_id}
      />

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
        <h2 className="mb-2 text-base font-semibold">Integrations</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Connect your calendar to get a reminder to issue an invoice after a session.
        </p>
        {integrationSuccess === "google_calendar" && (
          <p className="mb-3 text-sm text-emerald-500">Google Calendar connected successfully.</p>
        )}
        {integrationSuccess === "microsoft_calendar" && (
          <p className="mb-3 text-sm text-emerald-500">Microsoft Calendar connected successfully.</p>
        )}
        {integrationError && (
          <p className="mb-3 text-sm text-amber-500">
            Calendar connection failed. Please try again or use a different account.
          </p>
        )}
        <CalendarIntegrations
          googleCalendarConnection={googleCalendarConnection ?? null}
          microsoftCalendarConnection={microsoftCalendarConnection ?? null}
          onDisconnect={() => router.refresh()}
        />
      </section>

      <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
        <h2 className="mb-2 text-base font-semibold">Support</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Need help? Check our FAQ or contact us.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/help"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3B82F6] underline hover:text-blue-400"
          >
            Help & FAQ
          </Link>
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
            Terms
          </Link>
        </div>
      </section>
    </div>
  );
}

function CalendarIntegrations({
  googleCalendarConnection,
  microsoftCalendarConnection,
  onDisconnect,
}: {
  googleCalendarConnection: CalendarConnection;
  microsoftCalendarConnection: CalendarConnection;
  onDisconnect: () => void;
}) {
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);

  async function handleDisconnect(provider: "google_calendar" | "microsoft_calendar") {
    setDisconnectingProvider(provider);
    try {
      const res = await fetch("/api/integrations/calendar/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) onDisconnect();
    } finally {
      setDisconnectingProvider(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {googleCalendarConnection ? (
          <>
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <span className="size-2 rounded-full bg-emerald-500" />
              Google Calendar connected
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disconnectingProvider !== null}
              onClick={() => handleDisconnect("google_calendar")}
              className="rounded-lg"
            >
              {disconnectingProvider === "google_calendar" ? "Disconnecting…" : "Disconnect"}
            </Button>
          </>
        ) : (
          <a
            href="/api/integrations/calendar/auth/google"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-[#121821]/50 px-4 text-sm font-medium text-foreground hover:bg-white/5"
          >
            Connect Google Calendar
          </a>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {microsoftCalendarConnection ? (
          <>
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <span className="size-2 rounded-full bg-emerald-500" />
              Microsoft Calendar (Outlook) connected
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disconnectingProvider !== null}
              onClick={() => handleDisconnect("microsoft_calendar")}
              className="rounded-lg"
            >
              {disconnectingProvider === "microsoft_calendar" ? "Disconnecting…" : "Disconnect"}
            </Button>
          </>
        ) : (
          <a
            href="/api/integrations/calendar/auth/microsoft"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-[#121821]/50 px-4 text-sm font-medium text-foreground hover:bg-white/5"
          >
            Connect Microsoft Calendar (Outlook)
          </a>
        )}
      </div>
    </div>
  );
}

function SubscriptionSection({
  subscriptionStatus,
  hasStripeCustomer,
}: {
  subscriptionStatus: string;
  hasStripeCustomer: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const isPro = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/checkout", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data?.error ?? "Failed to start checkout");
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      if (hasStripeCustomer) {
        const res = await fetch("/api/subscription/portal", { method: "POST" });
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error(data?.error ?? "Failed to open billing portal");
      } else {
        const res = await fetch("/api/subscription/cancel", { method: "POST" });
        const data = await res.json();
        if (data?.success) {
          window.location.reload();
          return;
        }
        throw new Error(data?.error ?? "Failed to cancel");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
      <h2 className="mb-2 text-base font-semibold">Subscription</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {isPro
          ? "You're on Pro — unlimited invoices."
          : "Free plan: 3 invoices. Upgrade to Pro for unlimited."}
      </p>
      {isPro ? (
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={handleCancel}
          className="h-10 rounded-xl"
        >
          {loading ? "Opening…" : "Cancel subscription"}
        </Button>
      ) : (
        <Button
          type="button"
          disabled={loading}
          onClick={handleUpgrade}
          className="h-10 rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]"
        >
          {loading ? "Opening checkout…" : "Upgrade to Pro ($9.99/month)"}
        </Button>
      )}
    </section>
  );
}

function LogoSection({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoState, setLogoState] = useState<{ error?: string } | null>(null);
  const [logoPending, setLogoPending] = useState(false);
  const [removePending, setRemovePending] = useState(false);
  /** Preview URL after upload — shown immediately until next refresh */
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const displayLogoUrl = logoPreviewUrl ?? profile.logo_url;
  const showLogo = displayLogoUrl && !logoLoadError;

  useEffect(() => {
    setLogoLoadError(false);
  }, [displayLogoUrl]);

  async function handleUpload(formData: FormData) {
    setLogoPending(true);
    setLogoState(null);
    try {
      const res = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLogoState({ error: data.error ?? "Upload failed" });
        return;
      }
      if (typeof data.url === "string") {
        setLogoPreviewUrl(data.url);
      }
      router.refresh();
    } finally {
      setLogoPending(false);
    }
  }

  async function handleRemove() {
    setRemovePending(true);
    setLogoState(null);
    setLogoPreviewUrl(null);
    const result = await removeLogoAction();
    setRemovePending(false);
    if (result?.error) {
      setLogoState({ error: result.error });
      return;
    }
    router.refresh();
  }

  return (
    <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
            {showLogo ? (
              <Image
                src={displayLogoUrl!}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
                onError={() => setLogoLoadError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImagePlus className="size-5" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold">Company logo</h2>
            <p className="text-xs text-muted-foreground">
              Header, invoices, payment page · PNG, JPEG, WebP, max 10MB
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <>
            <input
              ref={fileInputRef}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const fd = new FormData();
                  fd.set("logo", f);
                  handleUpload(fd);
                  e.target.value = "";
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={logoPending}
              onClick={() => fileInputRef.current?.click()}
              className="h-9 rounded-lg px-3 text-xs"
            >
              {logoPending ? "Uploading…" : displayLogoUrl ? "Change" : "Upload"}
            </Button>
          </>
          {displayLogoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={removePending}
              className="h-9 rounded-lg px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Remove logo"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
      {logoState?.error && <p className="mt-2 text-xs text-destructive">{logoState.error}</p>}
    </section>
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
