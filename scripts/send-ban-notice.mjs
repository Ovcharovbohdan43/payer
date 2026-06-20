/**
 * One-off: send permanent ban notice to all accounts with account_status = 'banned'.
 * Usage: node scripts/send-ban-notice.mjs
 *        node scripts/send-ban-notice.mjs --dry-run
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");

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

const FROM = "Puyer Support <support@puyer.org>";
const REPLY_TO = "support@puyer.org";
const SUBJECT = "Your Puyer account has been permanently closed";

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
                    <p style="margin:0 0 8px 0; font-size:14px; font-weight:600; color:#991b1b;">Account permanently closed</p>
                    <p style="margin:0; font-size:14px; color:#7f1d1d; line-height:1.55;">
                      Following a review, we have identified activity that we believe violates Puyer&apos;s Terms of Service. Your account has been <strong>permanently closed</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px 0; font-size:15px; color:#3f3f46;">
                As a result of suspected deliberate abuse of the platform:
              </p>

              <ul style="margin:0 0 20px 0; padding-left:20px; font-size:15px; color:#3f3f46;">
                <li style="margin-bottom:8px;">All pending and future <strong>payments and payouts</strong> associated with your account will be <strong>rejected immediately</strong>.</li>
                <li style="margin-bottom:8px;">Your account details have been recorded on an internal <strong>block list</strong> to prevent further misuse of the platform.</li>
                <li>You will no longer be able to sign in, create invoices, or receive payouts through Puyer.</li>
              </ul>

              <p style="margin:0 0 20px 0; font-size:15px; color:#3f3f46;">
                This decision is final. If you believe this action was taken in error, you may contact
                <a href="mailto:support@puyer.org" style="color:#2563eb; text-decoration:none;">support@puyer.org</a>
                with your account email address. We do not guarantee a review or reversal.
              </p>

              <p style="margin:0; font-size:15px; color:#3f3f46;">
                Puyer Support
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = env.RESEND_API_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!apiKey && !dryRun) {
  console.error("RESEND_API_KEY not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: profiles, error: profilesError } = await supabase
  .from("profiles")
  .select("id, first_name, last_name, account_status, is_admin")
  .eq("account_status", "banned");

if (profilesError) {
  console.error("Failed to fetch banned profiles:", profilesError);
  process.exit(1);
}

const bannedProfiles = (profiles ?? []).filter((p) => !p.is_admin);
console.log(`Found ${bannedProfiles.length} banned account(s) (excluding admins)`);

const recipients = [];
for (const profile of bannedProfiles) {
  const { data, error } = await supabase.auth.admin.getUserById(profile.id);
  if (error) {
    console.error(`Failed to get email for ${profile.id}:`, error.message);
    continue;
  }
  const email = data.user?.email;
  if (!email) {
    console.warn(`No email for user ${profile.id}`);
    continue;
  }
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—";
  recipients.push({ id: profile.id, email, name });
}

const uniqueByEmail = new Map();
for (const r of recipients) {
  uniqueByEmail.set(r.email.toLowerCase(), r);
}
const toSend = [...uniqueByEmail.values()];

console.log("Recipients:");
for (const r of toSend) {
  console.log(`  ${r.email} (${r.name})`);
}

if (toSend.length === 0) {
  console.log("Nothing to send.");
  process.exit(0);
}

if (dryRun) {
  console.log(`\nDry run — would send ${toSend.length} email(s).`);
  process.exit(0);
}

const resend = new Resend(apiKey);
const html = buildHtml();
const results = [];

for (const { email, name } of toSend) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: email,
    replyTo: REPLY_TO,
    subject: SUBJECT,
    html,
  });

  if (error) {
    console.error(`FAILED ${email} (${name}):`, error);
    results.push({ email, ok: false, error });
  } else {
    console.log(`OK ${email} (${name}):`, data?.id ?? data);
    results.push({ email, ok: true, id: data?.id });
  }

  await sleep(600);
}

const sent = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
console.log(`\nDone: ${sent} sent, ${failed} failed (of ${toSend.length})`);
if (failed > 0) process.exit(1);
