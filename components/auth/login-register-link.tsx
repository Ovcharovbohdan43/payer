"use client";

import { TrackedRegisterLink } from "@/components/analytics/tracked-register-link";

export function LoginRegisterLink() {
  return (
    <TrackedRegisterLink
      href="/register"
      cta="sign_up"
      location="login"
      className="underline hover:text-foreground"
    >
      Create account
    </TrackedRegisterLink>
  );
}
