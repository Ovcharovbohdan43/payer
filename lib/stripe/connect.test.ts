import { describe, expect, it } from "vitest";
import { buildConnectAccountParams, getConnectCountry } from "./connect";

describe("buildConnectAccountParams", () => {
  it("uses controller config so seller pays fees and Stripe covers losses", () => {
    const params = buildConnectAccountParams(
      "user-123",
      "seller@example.com",
      "GB"
    );

    expect(params.type).toBeUndefined();
    expect(params.country).toBe("GB");
    expect(params.email).toBe("seller@example.com");
    expect(params.controller?.fees?.payer).toBe("account");
    expect(params.controller?.losses?.payments).toBe("stripe");
    expect(params.controller?.requirement_collection).toBe("stripe");
    expect(params.controller?.stripe_dashboard?.type).toBe("full");
    expect(params.capabilities?.card_payments?.requested).toBe(true);
    expect(params.capabilities?.transfers?.requested).toBe(true);
    expect(params.settings?.payouts?.schedule?.interval).toBe("manual");
    expect((params.metadata as Record<string, string> | undefined)?.supabase_user_id).toBe("user-123");
  });

  it("defaults connect country from env or GB", () => {
    expect(getConnectCountry()).toBe("GB");
  });
});
