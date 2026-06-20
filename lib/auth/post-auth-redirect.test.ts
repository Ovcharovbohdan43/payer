import { describe, expect, it } from "vitest";
import {
  isPlaceholderBusinessName,
  profileNeedsOnboarding,
} from "@/lib/auth/post-auth-redirect";

describe("post-auth onboarding", () => {
  it("treats empty and dash business names as placeholders", () => {
    expect(isPlaceholderBusinessName(null)).toBe(true);
    expect(isPlaceholderBusinessName("")).toBe(true);
    expect(isPlaceholderBusinessName("—")).toBe(true);
    expect(isPlaceholderBusinessName("-")).toBe(true);
    expect(isPlaceholderBusinessName("Acme Ltd")).toBe(false);
  });

  it("requires onboarding when profile is incomplete", () => {
    expect(profileNeedsOnboarding(null)).toBe(true);
    expect(profileNeedsOnboarding({ onboarding_completed: false })).toBe(true);
    expect(
      profileNeedsOnboarding({
        onboarding_completed: true,
        business_name: "—",
        first_name: "Jane",
        last_name: "Doe",
      })
    ).toBe(true);
    expect(
      profileNeedsOnboarding({
        onboarding_completed: true,
        business_name: "Acme",
        first_name: "Jane",
        last_name: "Doe",
      })
    ).toBe(false);
  });
});
