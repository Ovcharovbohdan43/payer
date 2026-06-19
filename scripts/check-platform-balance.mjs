/**
 * List recent platform balance transactions (why negative balance changed).
 * Usage: node scripts/check-platform-balance.mjs
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
  console.error("STRIPE_SECRET_KEY not found");
  process.exit(1);
}

const stripe = new Stripe(secret);
const mode = secret.startsWith("sk_live") ? "LIVE" : "TEST";

const balance = await stripe.balance.retrieve();
console.log(`=== Puyer platform balance (${mode}) ===\n`);
for (const b of balance.available.concat(balance.pending)) {
  const sign = b.amount < 0 ? "⚠️ " : "";
  console.log(`${sign}${b.currency.toUpperCase()}: available ${(b.amount / 100).toFixed(2)}, pending ${(balance.pending.find((p) => p.currency === b.currency)?.amount ?? 0) / 100}`);
}

const since = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
console.log(`\n=== Balance transactions since midnight UTC ===\n`);

const txs = [];
for await (const tx of stripe.balanceTransactions.list({ limit: 50, created: { gte: since } })) {
  txs.push(tx);
}

if (txs.length === 0) {
  console.log("No platform balance transactions today (in this Stripe mode).");
} else {
  let total = 0;
  for (const tx of txs) {
    total += tx.amount;
    const when = new Date(tx.created * 1000).toISOString().slice(0, 16);
    console.log(
      `${when}  ${(tx.amount / 100).toFixed(2).padStart(10)} ${tx.currency.toUpperCase()}  ${tx.type.padEnd(22)}  ${tx.description ?? ""}`
    );
  }
  console.log(`\nNet change today: ${(total / 100).toFixed(2)} ${txs[0]?.currency?.toUpperCase() ?? ""}`);
}

console.log("\nNote: payout.paid on connected accounts does NOT debit the platform balance.");
console.log("Platform minus usually grows from: stripe_fee, connect_collection_transfer, transfer, refund on destination charges.");
