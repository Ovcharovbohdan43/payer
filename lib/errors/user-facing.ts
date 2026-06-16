type UserFacingErrorContext = "sign-in" | "sign-up" | "otp" | "email" | "generic";

const SAFE_USER_MESSAGES = [
  /^invalid login credentials\.?$/i,
  /^invalid email or password\.?$/i,
  /^email not confirmed\.?$/i,
  /^invalid code\.?$/i,
  /^code expired or invalid\. request a new one\.?$/i,
  /^enter the 5-digit code\.?$/i,
  /^code must be 5 digits\.?$/i,
  /^session expired\. please sign in again\.?$/i,
  /^password is required\.?$/i,
  /^sign-in failed\.?$/i,
  /^sign up failed\.?$/i,
  /^invalid email\.?$/i,
  /^recipient has unsubscribed from emails\.?$/i,
  /^email limit exceeded\./i,
  /^too many attempts\./i,
  /^we couldn't send/i,
];

function defaultMessage(context: UserFacingErrorContext): string {
  switch (context) {
    case "otp":
      return "We couldn't send your login code. Please try again later.";
    case "email":
      return "We couldn't send the email right now. Please try again later or contact support@puyer.org.";
    case "sign-up":
      return "Sign up failed. Please try again.";
    case "sign-in":
      return "Sign-in failed. Please check your details and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function isTechnicalEmailError(message: string): boolean {
  return (
    /resend\.com/i.test(message) ||
    /testing emails/i.test(message) ||
    /verify a domain/i.test(message) ||
    /RESEND_API_KEY/i.test(message) ||
    /email is not configured/i.test(message) ||
    /onboarding@resend\.dev/i.test(message)
  );
}

/**
 * Map internal/provider errors to safe user-facing copy.
 * Technical details are logged server-side only.
 */
export function toUserFacingError(
  message: string,
  context: UserFacingErrorContext = "generic"
): string {
  const trimmed = message.trim();
  if (!trimmed) return defaultMessage(context);

  if (SAFE_USER_MESSAGES.some((pattern) => pattern.test(trimmed))) {
    return trimmed;
  }

  if (/rate limit|too many requests|limit exceeded|over email sending/i.test(trimmed)) {
    return "Too many attempts. Please try again later.";
  }

  if (isTechnicalEmailError(trimmed) || context === "email" || context === "otp") {
    console.error(`[user-facing:${context}]`, trimmed);
    return defaultMessage(context === "generic" ? "email" : context);
  }

  if (
    /postgres|pgrst|jwt|row-level security|duplicate key|violates|constraint|network|fetch failed|ECONNREFUSED|timeout/i.test(
      trimmed
    )
  ) {
    console.error(`[user-facing:${context}]`, trimmed);
    return defaultMessage(context);
  }

  console.error(`[user-facing:${context}]`, trimmed);
  return defaultMessage(context);
}
