import { describe, expect, it } from "vitest";
import { scanProhibitedContent } from "@/lib/risk/prohibited-content";
import { isCountryCurrencyConsistent } from "@/lib/risk/country-currency";
import { evaluateSellerVerification } from "@/lib/risk/verification";
import { canSellerAcceptPayments } from "@/lib/risk/payment-guard";

describe("scanProhibitedContent", () => {
  it("flags gambling keywords", () => {
    const r = scanProhibitedContent("Online casino payments");
    expect(r.flagged).toBe(true);
    expect(r.matches.length).toBeGreaterThan(0);
  });

  it("allows legitimate trade business", () => {
    const r = scanProhibitedContent("Boiler repair and plumbing for homes in London");
    expect(r.flagged).toBe(false);
  });
});

describe("isCountryCurrencyConsistent", () => {
  it("accepts GB + GBP", () => {
    expect(isCountryCurrencyConsistent("GB", "GBP")).toBe(true);
  });

  it("rejects GB + USD", () => {
    expect(isCountryCurrencyConsistent("United Kingdom", "USD")).toBe(false);
  });
});

describe("evaluateSellerVerification", () => {
  it("requires business description and confirmed email", () => {
    const r = evaluateSellerVerification({
      profile: {
        onboarding_completed: true,
        first_name: "A",
        last_name: "B",
        business_name: "Acme",
        phone: "+441234",
        business_description: "Plumbing services for residential customers in the UK.",
        website: "https://acme.example",
        country: "GB",
        default_currency: "GBP",
      },
      emailConfirmed: false,
    });
    expect(r.complete).toBe(false);
    expect(r.missing.some((m) => m.includes("email"))).toBe(true);
  });
});

describe("canSellerAcceptPayments", () => {
  it("blocks when payments_enabled is false", () => {
    const r = canSellerAcceptPayments({
      stripe_connect_account_id: "acct_1",
      payments_enabled: false,
      payment_risk_status: "pending_verification",
      account_status: "active",
    });
    expect(r.allowed).toBe(false);
  });
});
