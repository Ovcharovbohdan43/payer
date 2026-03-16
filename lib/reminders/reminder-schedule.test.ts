import { describe, it, expect } from "vitest";
import {
  getScheduledDaysDue,
  isEscalationDue,
  SCHEDULE_DAYS,
} from "./reminder-schedule";

describe("getScheduledDaysDue", () => {
  it("returns empty when now is before any schedule day", () => {
    const sentAt = new Date("2025-03-10T12:00:00Z");
    const now = new Date("2025-03-10T23:00:00Z"); // same day
    const due = getScheduledDaysDue(sentAt, now, ["1", "3", "7"]);
    expect(due).toEqual([]);
  });

  it("returns 1 when now is at least 1 day after sent", () => {
    const sentAt = new Date("2025-03-10T00:00:00Z");
    const now = new Date("2025-03-11T00:00:00Z");
    const due = getScheduledDaysDue(sentAt, now, ["1", "3", "7"]);
    expect(due).toContain("1");
    expect(due).not.toContain("3");
    expect(due).not.toContain("7");
  });

  it("returns 1 and 3 when now is 3 days after sent", () => {
    const sentAt = new Date("2025-03-10T00:00:00Z");
    const now = new Date("2025-03-13T00:00:00Z");
    const due = getScheduledDaysDue(sentAt, now, ["1", "3", "7"]);
    expect(due).toContain("1");
    expect(due).toContain("3");
    expect(due).not.toContain("7");
  });

  it("returns 1, 3, 7 when now is 7+ days after sent", () => {
    const sentAt = new Date("2025-03-10T00:00:00Z");
    const now = new Date("2025-03-18T00:00:00Z");
    const due = getScheduledDaysDue(sentAt, now, ["1", "3", "7"]);
    expect(due).toContain("1");
    expect(due).toContain("3");
    expect(due).toContain("7");
  });

  it("ignores invalid schedule days", () => {
    const sentAt = new Date("2025-03-10T00:00:00Z");
    const now = new Date("2025-03-20T00:00:00Z");
    const due = getScheduledDaysDue(sentAt, now, ["1", "99", "7"]);
    expect(due).toContain("1");
    expect(due).toContain("7");
    expect(due).not.toContain("99");
  });

  it("uses validDays when provided", () => {
    const sentAt = new Date("2025-03-10T00:00:00Z");
    const now = new Date("2025-03-18T00:00:00Z");
    const due = getScheduledDaysDue(sentAt, now, ["1", "3", "7"], new Set(["1", "7"]));
    expect(due).toEqual(expect.arrayContaining(["1", "7"]));
    expect(due).not.toContain("3");
  });
});

describe("isEscalationDue", () => {
  it("returns false when less than 7 days past due", () => {
    const dueDate = new Date("2025-03-10");
    const now = new Date("2025-03-15T12:00:00Z"); // 5 days past
    expect(isEscalationDue(dueDate, now, 7)).toBe(false);
  });

  it("returns false when exactly 6 days past due", () => {
    const dueDate = new Date("2025-03-10T00:00:00Z");
    const now = new Date("2025-03-16T23:59:59Z");
    expect(isEscalationDue(dueDate, now, 7)).toBe(false);
  });

  it("returns true when 7 days past due", () => {
    const dueDate = new Date("2025-03-10T00:00:00Z");
    const now = new Date("2025-03-17T00:00:00Z");
    expect(isEscalationDue(dueDate, now, 7)).toBe(true);
  });

  it("returns true when more than 7 days past due", () => {
    const dueDate = new Date("2025-03-10");
    const now = new Date("2025-03-25T12:00:00Z");
    expect(isEscalationDue(dueDate, now, 7)).toBe(true);
  });

  it("respects custom daysPastDueRequired", () => {
    const dueDate = new Date("2025-03-10T00:00:00Z");
    const now = new Date("2025-03-12T00:00:00Z"); // 2 days past
    expect(isEscalationDue(dueDate, now, 2)).toBe(true);
    expect(isEscalationDue(dueDate, now, 3)).toBe(false);
  });
});

describe("SCHEDULE_DAYS", () => {
  it("includes expected reminder days", () => {
    expect(SCHEDULE_DAYS).toContain("1");
    expect(SCHEDULE_DAYS).toContain("3");
    expect(SCHEDULE_DAYS).toContain("7");
    expect(SCHEDULE_DAYS).toContain("14");
  });
});
