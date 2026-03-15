"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useState } from "react";
import { signUpAction } from "./actions";

const STEPS = [
  { id: 1, label: "Name" },
  { id: 2, label: "Company" },
  { id: 3, label: "Finish" },
];

function RequiredStar() {
  return <span className="text-red-500">*</span>;
}

export function RegisterForm() {
  const [step, setStep] = useState(1);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await signUpAction(formData);
    },
    null as { error?: string } | null
  );

  const goNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };
  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <form action={formAction} className="space-y-6">
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

      {/* Step 1: Name */}
      <div className={step !== 1 ? "hidden" : "space-y-4"}>
        <div className="space-y-2">
          <Label htmlFor="first_name">
            First name <RequiredStar />
          </Label>
          <Input
            id="first_name"
            name="first_name"
            type="text"
            placeholder="John"
            autoComplete="given-name"
            required
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">
            Last name <RequiredStar />
          </Label>
          <Input
            id="last_name"
            name="last_name"
            type="text"
            placeholder="Smith"
            autoComplete="family-name"
            required
            disabled={isPending}
            className="h-11"
          />
        </div>
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

      {/* Step 2: Company + logo */}
      <div className={step !== 2 ? "hidden" : "space-y-4"}>
        <div className="space-y-2">
          <Label htmlFor="business_name">
            Company name <RequiredStar />
          </Label>
          <Input
            id="business_name"
            name="business_name"
            type="text"
            placeholder="My Business"
            autoComplete="organization"
            required
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            type="text"
            placeholder="e.g. United Kingdom"
            autoComplete="country-name"
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logo">Logo</Label>
          <Input
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={isPending}
            className="h-11 file:mr-3 file:rounded-lg file:border-0 file:bg-[#3B82F6]/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#3B82F6]"
          />
          <p className="text-xs text-muted-foreground">
            PNG, JPEG or WebP, max 10MB
          </p>
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

      {/* Step 3: Email, password, terms, submit */}
      <div className={step !== 3 ? "hidden" : "space-y-4"}>
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <RequiredStar />
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            Password <RequiredStar />
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            disabled={isPending}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Terms <RequiredStar />
          </Label>
          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#121821]/50 px-4 py-3">
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              value="true"
              required
              disabled={isPending}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 accent-[#3B82F6]"
            />
            <Label
              htmlFor="termsAccepted"
              className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground"
            >
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B82F6] underline hover:text-blue-400"
              >
                Terms of Service
              </a>
              . By clicking Create account, you accept these terms.
            </Label>
          </div>
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
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </div>
      </div>

      {state?.error && (
        <p className="text-center text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
