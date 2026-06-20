import { describe, expect, it } from "vitest";
import {
  getStripeConnectDisplayStatus,
  isInternalStripeWarningNote,
  isStripeOnboardingIncomplete,
  shouldFlagStripeAccountRestrictions,
} from "@/lib/stripe/connect-status";
import type Stripe from "stripe";

function mockAccount(partial: Partial<Stripe.Account>): Stripe.Account {
  return partial as Stripe.Account;
}

describe("connect-status", () => {
  it("treats unfinished onboarding as incomplete, not restricted", () => {
    const account = mockAccount({
      details_submitted: false,
      charges_enabled: false,
      requirements: {
        past_due: ["external_account", "business_type"],
        disabled_reason: "requirements.past_due",
      } as Stripe.Account.Requirements,
    });

    expect(isStripeOnboardingIncomplete(account)).toBe(true);
    expect(shouldFlagStripeAccountRestrictions(account)).toBe(false);
    expect(getStripeConnectDisplayStatus(account)).toBe("setup_incomplete");
  });

  it("flags serious Stripe restrictions after onboarding", () => {
    const account = mockAccount({
      details_submitted: true,
      charges_enabled: false,
      requirements: {
        disabled_reason: "rejected.fraud",
      } as Stripe.Account.Requirements,
    });

    expect(isStripeOnboardingIncomplete(account)).toBe(false);
    expect(getStripeConnectDisplayStatus(account)).toBe("restricted");
  });

  it("detects internal stripe warning notes", () => {
    expect(isInternalStripeWarningNote("stripe_account_warning — {}")).toBe(true);
    expect(isInternalStripeWarningNote("Manual review")).toBe(false);
  });
});
