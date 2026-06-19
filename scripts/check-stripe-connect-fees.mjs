/**
 * Audit Connect accounts: transfer_data in code (manual) + controller.fees.payer via API.
 * Usage: node scripts/check-stripe-connect-fees.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

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

const env = loadEnvLocal();
const secret = env.STRIPE_SECRET_KEY?.trim();
if (!secret) {
  console.error("STRIPE_SECRET_KEY not found in .env.local");
  process.exit(1);
}

const stripe = new Stripe(secret);

console.log("=== Puyer Connect fee payer audit ===\n");
console.log(
  "Code check: /api/checkout uses createDirectChargeCheckoutSession (stripeAccount header, no transfer_data).\n"
);

const accounts = [];
for await (const account of stripe.accounts.list({ limit: 100 })) {
  accounts.push(account);
}

if (accounts.length === 0) {
  console.log("No connected accounts found.");
  process.exit(0);
}

const rows = [];
for (const summary of accounts) {
  const full = await stripe.accounts.retrieve(summary.id);
  const feesPayer = full.controller?.fees?.payer ?? "(none)";
  const lossesPayer = full.controller?.losses?.payments ?? "(none)";
  const dashboardType = full.controller?.stripe_dashboard?.type ?? "(none)";
  const type = full.type ?? "(unknown)";
  const chargesEnabled = full.charges_enabled ? "yes" : "no";
  const ok = feesPayer === "account";
  rows.push({
    id: full.id,
    email: full.email ?? "(no email)",
    type,
    feesPayer,
    lossesPayer,
    dashboard: dashboardType,
    chargesEnabled,
    ok,
  });
}

console.log(
  "account_id\temail\ttype\tfees.payer\tlosses.payments\tdashboard\tcharges\tOK?"
);
for (const r of rows) {
  console.log(
    `${r.id}\t${r.email}\t${r.type}\t${r.feesPayer}\t${r.lossesPayer}\t${r.dashboard}\t${r.chargesEnabled}\t${r.ok ? "YES" : "NO ⚠️"}`
  );
}

const bad = rows.filter((r) => !r.ok);
console.log(`\nTotal: ${rows.length} accounts`);
console.log(`fees.payer=account (seller pays fees): ${rows.length - bad.length}`);
if (bad.length > 0) {
  console.log("\n⚠️  These accounts may bill Stripe processing fees to Puyer:");
  for (const r of bad) console.log(`  - ${r.id} (${r.email}) fees.payer=${r.feesPayer}`);
  process.exit(1);
}

console.log("\n✓ All accounts have fees.payer = account.");
