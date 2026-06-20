/**
 * One-off: send Stripe compliance notice to connected account users.
 * Usage: node scripts/send-stripe-compliance-notice.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = resolve(__dirname, "../.env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

/** Unique recipient emails from Stripe Connect export (platform owner excluded). */
const RECIPIENTS = [
  "burrshapgood986@outlook.com",
  "gilberteholmer32@outlook.com",
  "gaertnernagura313@outlook.com",
  "methewalentoski3098@outlook.com",
  "hannigorihuela9299@outlook.com",
  "mitranispeiden3459@outlook.com",
  "degolladogupton8984@outlook.com",
  "emillian9987@gmail.com",
  "nataliadeen3311@outlook.com",
  "philbrewerton868@gmail.com",
];

const FROM = "Puyer Support <support@puyer.org>";
const REPLY_TO = "support@puyer.org";
const SUBJECT =
  "Urgent: Action required — verify your business activity on Puyer";

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SUBJECT}</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:16px; line-height:1.55; color:#18181b; background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:560px; background-color:#ffffff; border-radius:14px; box-shadow:0 1px 3px rgba(0,0,0,0.08); overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px 40px; border-bottom:1px solid #e4e4e7;">
              <div style="font-size:22px; font-weight:700; color:#18181b;">Puyer</div>
              <div style="margin-top:4px; font-size:13px; color:#71717a;">Support · support@puyer.org</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px 0; font-size:15px; color:#3f3f46;">Hello,</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 0 20px 0;">
                <tr>
                  <td style="padding:16px 18px; background-color:#fef2f2; border:1px solid #fecaca; border-radius:12px;">
                    <p style="margin:0 0 8px 0; font-size:14px; font-weight:600; color:#991b1b;">48-hour deadline</p>
                    <p style="margin:0; font-size:14px; color:#7f1d1d; line-height:1.55;">
                      You must provide information about your business activity <strong>within 48 hours</strong> of this email. If we do not receive a satisfactory response in time, we will <strong>reject pending payouts</strong> and <strong>return funds to the accounts from which payment was made</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px 0; font-size:15px; color:#3f3f46;">
                Our payment partner <strong>Stripe</strong> is reviewing connected accounts used for card payments through Puyer. To keep your account in good standing and avoid disruption to payouts, please reply <strong>urgently</strong> with the following:
              </p>

              <ol style="margin:0 0 20px 0; padding-left:20px; font-size:15px; color:#3f3f46;">
                <li style="margin-bottom:8px;">A clear description of your business and the products or services you provide.</li>
                <li style="margin-bottom:8px;">The purpose of invoices you send via Puyer — what each payment is for and who your clients are.</li>
                <li style="margin-bottom:8px;">How you use Puyer in your day-to-day operations (e.g. one-off invoices, recurring work, packages).</li>
                <li>Any supporting documentation you can share (website, contracts, service descriptions, or similar) that confirms your business activity is legitimate and compliant with Stripe&apos;s policies.</li>
              </ol>

              <p style="margin:0 0 20px 0; font-size:15px; color:#3f3f46;">
                Please reply directly to this email at
                <a href="mailto:support@puyer.org" style="color:#2563eb; text-decoration:none;">support@puyer.org</a>.
                Incomplete or missing information may result in payout restrictions, account suspension, or refunds to payers as described above.
              </p>

              <p style="margin:0; font-size:15px; color:#3f3f46;">
                Thank you for your prompt cooperation,<br>
                <strong>Puyer Support</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px 40px; border-top:1px solid #e4e4e7; background-color:#fafafa;">
              <p style="margin:0; font-size:12px; color:#71717a; line-height:1.5;">
                Puyer · <a href="https://puyer.org" style="color:#2563eb; text-decoration:none;">puyer.org</a><br>
                support@puyer.org
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const env = loadEnvLocal();
const apiKey = env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY not found in .env.local");
  process.exit(1);
}

const resend = new Resend(apiKey);
const html = buildHtml();
const results = [];

for (const to of RECIPIENTS) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: SUBJECT,
    html,
  });

  if (error) {
    console.error(`FAILED ${to}:`, error);
    results.push({ to, ok: false, error });
  } else {
    console.log(`OK ${to}:`, data?.id ?? data);
    results.push({ to, ok: true, id: data?.id });
  }

  await sleep(600);
}

const sent = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
console.log(`\nDone: ${sent} sent, ${failed} failed (of ${RECIPIENTS.length})`);
if (failed > 0) process.exit(1);
