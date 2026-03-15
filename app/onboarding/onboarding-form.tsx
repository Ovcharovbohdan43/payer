"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useState, useRef } from "react";
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

const STEPS = [
  { id: 1, label: "Name" },
  { id: 2, label: "Company" },
  { id: 3, label: "Finish" },
];

function RequiredStar() {
  return <span className="text-red-500">*</span>;
}

type Props = {
  initialEmail?: string | null;
  initialFirstName?: string | null;
  initialLastName?: string | null;
  initialBusinessName?: string | null;
};

export function OnboardingForm({
  initialEmail,
  initialFirstName,
  initialLastName,
  initialBusinessName,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await submitOnboarding(formData);
    },
    null as { error?: string } | null
  );

  const goNext = () => {
    setStepError(null);
    const form = formRef.current;
    if (!form) return;

    if (step === 1) {
      const first = (form.querySelector("#onb_first_name") as HTMLInputElement)?.value?.trim() ?? "";
      const last = (form.querySelector("#onb_last_name") as HTMLInputElement)?.value?.trim() ?? "";
      if (!first || !last) {
        setStepError("Please fill in first name and last name.");
        return;
      }
    }
    if (step === 2) {
      const company = (form.querySelector("#onb_business_name") as HTMLInputElement)?.value?.trim() ?? "";
      if (!company) {
        setStepError("Please enter your company name.");
        return;
      }
    }

    if (step < 3) setStep((s) => s + 1);
  };

  const goBack = () => {
    setStepError(null);
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((s) => (
          <div key={s.id} className="flex flex-1 items-center gap-1">
            <div
              className={`h-2 flex-1 rounded-full transition-colors ${
                step >= s.id ? "bg-[#3B82F6]" : "bg-white/10"
              }`}
            />
            {s.id < STEPS.length && <div className="w-1 shrink-0" />}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Step {step} of {STEPS.length}: {STEPS[step - 1].label}
      </p>

      {/* Step 1: Name + email */}
      <div className={step !== 1 ? "hidden" : "space-y-4"}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="onb_first_name">
              First name <RequiredStar />
            </Label>
            <Input
              id="onb_first_name"
              name="first_name"
              placeholder="John"
              required
              disabled={isPending}
              className="h-11"
              defaultValue={initialFirstName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onb_last_name">
              Last name <RequiredStar />
            </Label>
            <Input
              id="onb_last_name"
              name="last_name"
              placeholder="Smith"
              required
              disabled={isPending}
              className="h-11"
              defaultValue={initialLastName ?? ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="onb_email">
            Email <RequiredStar />
          </Label>
          <Input
            id="onb_email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={isPending}
            defaultValue={initialEmail ?? ""}
            className="h-11"
          />
        </div>
        {stepError && step === 1 && (
          <p className="text-center text-sm text-destructive">{stepError}</p>
        )}
        <Button
          type="button"
          className="h-11 w-full rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]"
          size="lg"
          onClick={goNext}
          disabled={isPending}
        >
          Next
        </Button>
      </div>

      {/* Step 2: Company + optional fields */}
      <div className={step !== 2 ? "hidden" : "space-y-4"}>
        <div className="space-y-2">
          <Label htmlFor="onb_business_name">
            Company name <RequiredStar />
          </Label>
          <Input
            id="onb_business_name"
            name="business_name"
            placeholder="My Business"
            required
            disabled={isPending}
            className="h-11"
            defaultValue={initialBusinessName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="onb_phone">Phone</Label>
          <Input
            id="onb_phone"
            name="phone"
            type="tel"
            placeholder="+44 20 7123 4567"
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="onb_address">Address</Label>
          <Input
            id="onb_address"
            name="address"
            placeholder="Street, City, Postcode"
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="onb_website">Website</Label>
          <Input
            id="onb_website"
            name="website"
            type="url"
            placeholder="https://example.com"
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="onb_company_type">Company type / Industry</Label>
          <select
            id="onb_company_type"
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
        {stepError && step === 2 && (
          <p className="text-center text-sm text-destructive">{stepError}</p>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-xl border-white/10"
            onClick={goBack}
            disabled={isPending}
          >
            Back
          </Button>
          <Button
            type="button"
            className="h-11 flex-1 rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]"
            size="lg"
            onClick={goNext}
            disabled={isPending}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Step 3: Currency, country, timezone, submit */}
      <div className={step !== 3 ? "hidden" : "space-y-4"}>
        <div className="space-y-2">
          <Label htmlFor="onb_default_currency">Default currency</Label>
          <select
            id="onb_default_currency"
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
          <Label htmlFor="onb_country">Country</Label>
          <Input
            id="onb_country"
            name="country"
            placeholder="e.g. United Kingdom"
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="onb_timezone">Timezone</Label>
          <Input
            id="onb_timezone"
            name="timezone"
            placeholder="e.g. Europe/London"
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-xl border-white/10"
            onClick={goBack}
            disabled={isPending}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="h-11 flex-1 rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]"
            size="lg"
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Continue to dashboard"}
          </Button>
        </div>
      </div>

      {state?.error && (
        <p className="text-center text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
