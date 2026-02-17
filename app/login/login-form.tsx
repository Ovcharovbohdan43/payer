"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import { signInWithMagicLink } from "./actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await signInWithMagicLink(formData);
    },
    null as { error?: string; success?: boolean } | null
  );

  if (state?.success) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        Check your email for the sign-in link.
      </div>
    );
  }

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
      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Sending…" : "Send magic link"}
      </Button>
      {state?.error && (
        <p className="text-center text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
