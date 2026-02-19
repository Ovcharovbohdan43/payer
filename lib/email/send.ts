import { Resend } from "resend";
import {
  buildInvoiceEmailHtml,
  buildReminderEmailHtml,
  buildLoginOtpEmailHtml,
  type InvoiceEmailParams,
} from "./templates";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Puyer <onboarding@resend.dev>";

function getResendClient(): Resend | null {
  if (!RESEND_API_KEY || RESEND_API_KEY === "your-api-key") return null;
  return new Resend(RESEND_API_KEY);
}

export type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Send invoice email to client. Used on "Create & send email" and "Send by email".
 */
export async function sendInvoiceEmail(params: {
  to: string;
} & InvoiceEmailParams): Promise<SendResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)" };
  }
  const html = buildInvoiceEmailHtml(params);
  const { data, error } = await client.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Invoice ${params.invoiceNumber} from ${params.businessName}`,
    html,
  });
  if (error) {
    console.error("[email] sendInvoice failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Send reminder email. Same template as invoice, but with "Reminder" in subject.
 */
export async function sendReminderEmail(params: {
  to: string;
} & InvoiceEmailParams): Promise<SendResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)" };
  }
  const html = buildReminderEmailHtml(params);
  const { error } = await client.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Reminder: Invoice ${params.invoiceNumber} from ${params.businessName}`,
    html,
  });
  if (error) {
    console.error("[email] sendReminder failed:", error.message);
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
