"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useState } from "react";
import { signInWithMagicLink, signInWithPassword } from "./actions";

export function LoginForm() {
  const [mode, setMode] = useState<"magic" | "password">("magic");

  const [magicState, magicAction, magicPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return await signInWithMagicLink(formData);
    },
    null as { error?: string; success?: boolean } | null
  );

  const [pwdState, pwdAction, pwdPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await signInWithPassword(formData);
    },
    null as { error?: string } | null
  );

  const isPending = mode === "magic" ? magicPending : pwdPending;

  if (magicState?.success) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        Check your email for the sign-in link.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "magic"
              ? "bg-[#121821] text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Magic link
        </button>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "password"
              ? "bg-[#121821] text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Password
        </button>
      </div>

      {mode === "magic" ? (
        <form action={magicAction} className="space-y-4">
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
          {magicState?.error && (
            <p className="text-center text-sm text-destructive">{magicState.error}</p>
          )}
        </form>
      ) : (
        <form action={pwdAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pwd-email">Email</Label>
            <Input
              id="pwd-email"
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isPending}
              className="h-11"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
          {pwdState?.error && (
            <p className="text-center text-sm text-destructive">{pwdState.error}</p>
          )}
        </form>
      )}
    </div>
  );
}
