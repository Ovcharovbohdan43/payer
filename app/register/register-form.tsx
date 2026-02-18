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
