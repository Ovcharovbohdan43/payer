/**
 * Pure helpers for reminder schedule and escalation timing.
 * Used by run-auto-reminders and by unit tests.
 */

/** Supported schedule day keys */
export const SCHEDULE_DAYS = ["1", "2", "3", "5", "7", "10", "14"] as const;

/**
 * Which days from the schedule are due as of `now` (reminder should be sent).
 * A day N is due when sentAt + N days (midnight UTC) <= now.
 */
export function getScheduledDaysDue(
  sentAt: Date,
  now: Date,
  scheduleDays: string[],
  validDays: Set<string> = new Set(SCHEDULE_DAYS)
): string[] {
  const due: string[] = [];
  for (const dayStr of scheduleDays) {
    if (!validDays.has(dayStr)) continue;
    const day = parseInt(dayStr, 10);
    if (Number.isNaN(day)) continue;
    const dueAt = new Date(sentAt);
    dueAt.setUTCDate(dueAt.getUTCDate() + day);
    dueAt.setUTCHours(0, 0, 0, 0);
    if (now >= dueAt) due.push(dayStr);
  }
  return due;
}

/**
 * Whether an invoice is due for escalation: at least `daysPastDueRequired` days
 * have passed since due_date (UTC date comparison).
 */
export function isEscalationDue(
  dueDate: Date,
  now: Date,
  daysPastDueRequired: number
): boolean {
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const dueStart = new Date(dueDate);
  dueStart.setUTCHours(0, 0, 0, 0);
  const daysPastDue = Math.floor(
    (todayStart.getTime() - dueStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  return daysPastDue >= daysPastDueRequired;
}
