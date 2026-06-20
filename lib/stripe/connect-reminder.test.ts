import { describe, expect, it } from "vitest";
import {
  shouldRemindStripeConnect,
  stripeConnectReminderMessage,
} from "@/lib/stripe/connect-reminder";

describe("connect-reminder", () => {
  it("reminds when Stripe is not connected", () => {
    expect(shouldRemindStripeConnect({ stripe_connect_account_id: null })).toBe(true);
    expect(shouldRemindStripeConnect({ stripe_connect_account_id: "acct_1" })).toBe(false);
    expect(shouldRemindStripeConnect({ stripe_connect_account_id: null, is_admin: true })).toBe(
      false
    );
  });

  it("includes settings hint in message", () => {
    expect(stripeConnectReminderMessage()).toMatch(/Settings/i);
  });
});
