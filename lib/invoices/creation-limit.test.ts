import { describe, expect, it } from "vitest";
import {
  describeInvoiceCreationLimit,
  FIRST_DAY_INVOICE_MAX,
  UNLIMITED_INVOICE_LIMIT,
} from "./creation-limit";

const now = Date.now();
const twelveHoursAgo = new Date(now - 12 * 60 * 60 * 1000).toISOString();
const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString();

describe("describeInvoiceCreationLimit", () => {
  it("allows first invoice within 24h of signup", () => {
    const result = describeInvoiceCreationLimit(
      { created_at: twelveHoursAgo, invoice_creation_limit: null, invoice_creation_reviewed_at: null },
      0
    );
    expect(result.allowed).toBe(true);
    expect(result.code).toBe("allowed");
  });

  it("blocks second invoice within 24h", () => {
    const result = describeInvoiceCreationLimit(
      { created_at: twelveHoursAgo, invoice_creation_limit: null, invoice_creation_reviewed_at: null },
      FIRST_DAY_INVOICE_MAX
    );
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("first_day");
  });

  it("blocks after 24h until reviewed", () => {
    const result = describeInvoiceCreationLimit(
      { created_at: twoDaysAgo, invoice_creation_limit: null, invoice_creation_reviewed_at: null },
      1
    );
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("pending_review");
  });

  it("allows unlimited when admin set -1", () => {
    const result = describeInvoiceCreationLimit(
      {
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
        created_at: twelveHoursAgo,
        invoice_creation_limit: 0,
        invoice_creation_reviewed_at: new Date().toISOString(),
      },
      0
    );
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("blocked");
  });
});
