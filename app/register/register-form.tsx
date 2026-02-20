"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { signUpAction } from "./actions";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await signUpAction(formData);
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
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
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="John Smith"
          autoComplete="name"
          required
          disabled={isPending}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business_name">Business name</Label>
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
        <Label htmlFor="password">Password</Label>
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
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="termsAccepted"
          name="termsAccepted"
          value="true"
          required
          disabled={isPending}
          className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 accent-[#3B82F6]"
        />
        <Label htmlFor="termsAccepted" className="cursor-pointer text-sm font-normal leading-relaxed">
          I agree to the{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Terms of Service
          </a>
          . By clicking Create account, you accept these terms.
        </Label>
      </div>
      <Button
        type="submit"
        className="h-11 w-full"
        size="lg"
        disabled={isPending}
      >
        {isPending ? "Creating account…" : "Create account"}
      </Button>
      {state?.error && (
        <p className="text-center text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
