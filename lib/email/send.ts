import { Resend } from "resend";
import {
  buildInvoiceEmailHtml,
  buildReminderEmailHtml,
  buildEscalationCopyToOwnerHtml,
  buildLoginOtpEmailHtml,
  buildPasswordChangeConfirmEmailHtml,
  buildPayoutNotificationHtml,
  type InvoiceEmailParams,
  type EscalationCopyToOwnerParams,
  type PayoutNotificationParams,
} from "./templates";
import { isEmailUnsubscribed, generateUnsubscribeToken } from "./unsubscribe";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Puyer <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

function getResendClient(): Resend | null {
  if (!RESEND_API_KEY || RESEND_API_KEY === "your-api-key") return null;
  return new Resend(RESEND_API_KEY);
}

function buildUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email);
  const base = APP_URL.replace(/\/$/, "");
  return `${base}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}

export type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Send invoice email to client. Used on "Create & send email" and "Send by email".
 * Skips send if recipient has unsubscribed. Includes List-Unsubscribe header for spam compliance.
 */
export async function sendInvoiceEmail(params: {
  to: string;
} & InvoiceEmailParams): Promise<SendResult> {
  const unsubscribed = await isEmailUnsubscribed(params.to);
  if (unsubscribed) {
    return { ok: false, error: "Recipient has unsubscribed from emails" };
  }

  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)" };
  }

  const unsubscribeUrl = buildUnsubscribeUrl(params.to);
  const html = buildInvoiceEmailHtml({ ...params, unsubscribeUrl });

  const { error } = await client.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Invoice ${params.invoiceNumber} from ${params.businessName}`,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  if (error) {
    console.error("[email] sendInvoice failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Send reminder email. Same template as invoice, but with "Reminder" (or custom subject) in subject.
 * Skips send if recipient has unsubscribed. Includes List-Unsubscribe header.
 * @param subjectOverride - Optional subject line; if not set, uses "Reminder: Invoice #X from Business"
 */
export async function sendReminderEmail(params: {
  to: string;
  subjectOverride?: string;
} & InvoiceEmailParams): Promise<SendResult> {
  const unsubscribed = await isEmailUnsubscribed(params.to);
  if (unsubscribed) {
    return { ok: false, error: "Recipient has unsubscribed from emails" };
  }

  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)" };
  }

  const unsubscribeUrl = buildUnsubscribeUrl(params.to);
  const html = buildReminderEmailHtml({ ...params, unsubscribeUrl });
  const subject =
    params.subjectOverride ?? `Reminder: Invoice ${params.invoiceNumber} from ${params.businessName}`;

  const { error } = await client.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  if (error) {
    console.error("[email] sendReminder failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Send copy-to-owner email when an overdue escalation reminder was sent to the client.
 * No unsubscribe (owner notification). Subject: [Puyer] Overdue reminder sent: Invoice #X — Client.
 */
export async function sendEscalationCopyToOwnerEmail(params: {
  to: string;
} & EscalationCopyToOwnerParams): Promise<SendResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)" };
  }
  const html = buildEscalationCopyToOwnerHtml(params);
  const { error } = await client.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `[Puyer] Overdue reminder sent: Invoice ${params.invoiceNumber} — ${params.clientName}`,
    html,
  });
  if (error) {
    console.error("[email] sendEscalationCopyToOwner failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Send login OTP code (5 digits, 5 min expiry).
 */
export async function sendLoginOtpEmail(params: {
  to: string;
  code: string;
}): Promise<SendResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)" };
  }
  const html = buildLoginOtpEmailHtml({ code: params.code });
  const { error } = await client.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Your Puyer login code",
    html,
  });
  if (error) {
    console.error("[email] sendLoginOtp failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Send password change confirmation to user.
 */
export async function sendPasswordChangeConfirmEmail(params: {
  to: string;
}): Promise<SendResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)" };
  }
  const html = buildPasswordChangeConfirmEmailHtml();
  const { error } = await client.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Your Puyer password was changed",
    html,
  });
  if (error) {
    console.error("[email] sendPasswordChangeConfirm failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Send payout success notification to the user who received the payout.
 */
export async function sendPayoutNotificationEmail(
  params: { to: string } & PayoutNotificationParams
): Promise<SendResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)" };
  }
  const html = buildPayoutNotificationHtml(params);
  const { error } = await client.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Your payout has been sent — Puyer",
    html,
  });
  if (error) {
    console.error("[email] sendPayoutNotification failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
