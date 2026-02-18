/**
 * HTML email templates for invoice and reminder emails.
 * No PII in template strings; values are injected as params.
 */

export type InvoiceEmailParams = {
  businessName: string;
  clientName: string;
  amountFormatted: string;
  invoiceNumber: string;
  publicUrl: string;
  dueDate?: string | null;
};

export function buildInvoiceEmailHtml(params: InvoiceEmailParams): string {
  const { businessName, clientName, amountFormatted, invoiceNumber, publicUrl, dueDate } =
    params;
  const dueLine = dueDate
    ? `<p style="margin: 0 0 24px 0; font-size: 15px; color: #52525b;">Due date: ${dueDate}</p>`
    : "";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background:#fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 32px 40px 24px; border-bottom: 1px solid #e4e4e7;">
              <span style="font-size: 22px; font-weight: 700; color: #18181b;">${escapeHtml(businessName)}</span>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #71717a;">Invoice in 15 seconds. Get paid faster.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #18181b;">Invoice ${escapeHtml(invoiceNumber)}</h1>
              <p style="margin: 0 0 8px 0; font-size: 15px; color: #52525b;">Hi ${escapeHtml(clientName)},</p>
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #52525b;">You have an invoice for <strong>${escapeHtml(amountFormatted)}</strong>.</p>
              ${dueLine}
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <a href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 28px; background:#18181b; color:#fff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">View &amp; Pay</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 13px; color: #a1a1aa;">Or copy this link: <a href="${escapeHtml(publicUrl)}" style="color:#3b82f6; word-break: break-all;">${escapeHtml(publicUrl)}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #e4e4e7; background:#fafafa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">Powered by Payer.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type ReminderEmailParams = InvoiceEmailParams;

export function buildReminderEmailHtml(params: ReminderEmailParams): string {
  const { businessName, clientName, amountFormatted, invoiceNumber, publicUrl, dueDate } =
    params;
  const dueLine = dueDate
    ? `<p style="margin: 0 0 24px 0; font-size: 15px; color: #52525b;">Due date: ${escapeHtml(dueDate)}</p>`
    : "";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background:#fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 32px 40px 24px; border-bottom: 1px solid #e4e4e7;">
              <span style="font-size: 22px; font-weight: 700; color: #18181b;">${escapeHtml(businessName)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #18181b;">Reminder: Invoice ${escapeHtml(invoiceNumber)}</h1>
              <p style="margin: 0 0 8px 0; font-size: 15px; color: #52525b;">Hi ${escapeHtml(clientName)},</p>
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #52525b;">This is a friendly reminder that invoice <strong>${escapeHtml(invoiceNumber)}</strong> for <strong>${escapeHtml(amountFormatted)}</strong> is still unpaid.</p>
              ${dueLine}
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <a href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 28px; background:#18181b; color:#fff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">View &amp; Pay</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #e4e4e7; background:#fafafa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">Powered by Payer.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
