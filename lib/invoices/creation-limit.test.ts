import { describe, expect, it } from "vitest";
import {
  checkFirstInvoiceAmountLimit,
  checkRequiredProfileFields,
  describeInvoiceCreationLimit,
  FIRST_DAY_INVOICE_MAX,
  FIRST_INVOICE_MAX_MAJOR,
  isAccountPendingReview,
  UNLIMITED_INVOICE_LIMIT,
} from "./creation-limit";

const now = Date.now();
const twelveHoursAgo = new Date(now - 12 * 60 * 60 * 1000).toISOString();
const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString();

const baseProfile = {
  created_at: twelveHoursAgo,
  invoice_creation_limit: null,
  invoice_creation_reviewed_at: null,
  first_name: "Jane",
  last_name: "Doe",
  phone: "+441234567890",
};

describe("describeInvoiceCreationLimit", () => {
  it("allows first invoice within 24h of signup", () => {
    const result = describeInvoiceCreationLimit(baseProfile, 0);
    expect(result.allowed).toBe(true);
    expect(result.code).toBe("allowed");
  });

  it("blocks second invoice within 24h", () => {
    const result = describeInvoiceCreationLimit(baseProfile, FIRST_DAY_INVOICE_MAX);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("first_day");
  });

  it("blocks after 24h until reviewed", () => {
    const result = describeInvoiceCreationLimit(
      { ...baseProfile, created_at: twoDaysAgo },
      1
    );
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("pending_review");
  });

  it("allows unlimited when admin set -1", () => {
    const result = describeInvoiceCreationLimit(
      {
        ...baseProfile,
        created_at: twoDaysAgo,
        invoice_creation_limit: UNLIMITED_INVOICE_LIMIT,
        invoice_creation_reviewed_at: new Date().toISOString(),
      },
      100
    );
    expect(result.allowed).toBe(true);
  });

  it("enforces partial admin limit", () => {
    const result = describeInvoiceCreationLimit(
      {
        ...baseProfile,
        created_at: twoDaysAgo,
        invoice_creation_limit: 3,
        invoice_creation_reviewed_at: new Date().toISOString(),
      },
      3
    );
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("partial");
  });

  it("blocks when admin set 0", () => {
    const result = describeInvoiceCreationLimit(
      {
        ...baseProfile,
        invoice_creation_limit: 0,
        invoice_creation_reviewed_at: new Date().toISOString(),
      },
      0
    );
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("blocked");
  });
});

describe("checkFirstInvoiceAmountLimit", () => {
  it("allows first invoice up to 20 major units", () => {
    expect(
      checkFirstInvoiceAmountLimit(baseProfile, 0, 2000, "GBP")
    ).toBeNull();
  });

  it("blocks first invoice above 20 major units", () => {
    expect(
      checkFirstInvoiceAmountLimit(baseProfile, 0, 2001, "USD")
    ).toContain("20");
  });

  it("skips cap after admin approval", () => {
    expect(
      checkFirstInvoiceAmountLimit(
        {
          ...baseProfile,
          invoice_creation_reviewed_at: new Date().toISOString(),
        },
        0,
        50000,
        "GBP"
      )
    ).toBeNull();
  });
});

describe("isAccountPendingReview", () => {
  it("is true for unreviewed non-admin", () => {
    expect(isAccountPendingReview(baseProfile)).toBe(true);
  });

  it("is false when approved unlimited", () => {
    expect(
      isAccountPendingReview({
        ...baseProfile,
        invoice_creation_limit: UNLIMITED_INVOICE_LIMIT,
      })
    ).toBe(false);
  });

  it("is false when payments are enabled", () => {
    expect(
      isAccountPendingReview({
        ...baseProfile,
        payments_enabled: true,
      })
    ).toBe(false);
  });
});

describe("checkRequiredProfileFields", () => {
  it("requires first name, last name, phone", () => {
    expect(checkRequiredProfileFields({ first_name: "", last_name: "D", phone: "1" })).toContain(
      "First name"
    );
    expect(checkRequiredProfileFields({ first_name: "A", last_name: "", phone: "1" })).toContain(
      "Last name"
    );
    expect(checkRequiredProfileFields({ first_name: "A", last_name: "B", phone: "" })).toContain(
      "Phone"
    );
    expect(
      checkRequiredProfileFields({ first_name: "A", last_name: "B", phone: "+44123" })
    ).toBeNull();
  });
});

describe("FIRST_INVOICE_MAX_MAJOR", () => {
  it("is 20", () => {
    expect(FIRST_INVOICE_MAX_MAJOR).toBe(20);
  });
});
