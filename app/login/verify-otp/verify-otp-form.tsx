"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useState } from "react";
import { verifyOtpAction } from "../actions";

export function VerifyOtpForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await verifyOtpAction(formData);
    },
    null as { error?: string } | null
  );

  const [remember, setRemember] = useState(true);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          placeholder="12345"
          autoComplete="one-time-code"
          autoFocus
          required
          disabled={isPending}
          className="h-12 text-center text-xl tracking-[0.3em] font-mono"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="remember"
          name="remember"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          value="true"
          disabled={isPending}
          className="h-4 w-4 rounded border-white/20 bg-[#121821] accent-[#3B82F6]"
        />
        <Label
          htmlFor="remember"
          className="cursor-pointer text-sm font-normal text-muted-foreground"
        >
          Remember this device for 30 days
        </Label>
      </div>
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isPending}
      >
        {isPending ? "Verifying…" : "Continue"}
      </Button>
      {state?.error && (
        <p className="text-center text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
