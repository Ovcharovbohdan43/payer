export const PAYMENT_RISK_STATUS = {
  PENDING_VERIFICATION: "pending_verification",
  ACTIVE: "active",
  FLAGGED: "flagged",
  PAUSED: "paused",
  BLOCKED: "blocked",
} as const;

export type PaymentRiskStatus =
  (typeof PAYMENT_RISK_STATUS)[keyof typeof PAYMENT_RISK_STATUS];

/** Daily volume cap for new sellers (major units → cents at runtime). Default £100. */
export const NEW_SELLER_DAILY_LIMIT_MAJOR =
  Number(process.env.PUYER_NEW_SELLER_DAILY_LIMIT_MAJOR ?? "100") || 100;

/** Max successful invoice payments per calendar day for new sellers. */
export const NEW_SELLER_DAILY_MAX_PAYMENTS =
  Number(process.env.PUYER_NEW_SELLER_DAILY_MAX_PAYMENTS ?? "5") || 5;

/** Hold manual Stripe payouts for this many days after Connect onboarding. */
export const NEW_SELLER_PAYOUT_HOLD_DAYS =
  Number(process.env.PUYER_NEW_SELLER_PAYOUT_HOLD_DAYS ?? "14") || 14;

/** Same amount paid this many times triggers a flag. */
export const SAME_AMOUNT_FLAG_THRESHOLD =
  Number(process.env.PUYER_SAME_AMOUNT_FLAG_THRESHOLD ?? "3") || 3;

/** Payments within this window after signup trigger burst flag. */
export const POST_SIGNUP_BURST_WINDOW_MS = 60 * 60 * 1000;

/** Payments in burst window that trigger flag. */
export const POST_SIGNUP_BURST_PAYMENT_COUNT =
  Number(process.env.PUYER_POST_SIGNUP_BURST_PAYMENTS ?? "3") || 3;

/** Account considered "new" for limits for this many days. */
export const NEW_SELLER_PERIOD_DAYS =
  Number(process.env.PUYER_NEW_SELLER_PERIOD_DAYS ?? "30") || 30;

export const PAYMENTS_SUPPORT_EMAIL = "support@puyer.org";
