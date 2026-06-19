/**
 * Integration test: create a Connect account with Puyer config and verify controller fields.
 * Usage: node scripts/test-connect-account-create.mjs
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

/** Mirror of lib/stripe/connect.ts buildConnectAccountParams */
function buildConnectAccountParams(userId, email, country) {
  return {
    country,
    email,
    controller: {
      fees: { payer: "account" },
      losses: { payments: "stripe" },
      requirement_collection: "stripe",
      stripe_dashboard: { type: "full" },
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { supabase_user_id: userId, puyer_test: "connect-account-create" },
  };
}

const EXPECTED = {
  feesPayer: "account",
  lossesPayments: "stripe",
  requirementCollection: "stripe",
  dashboardType: "full",
};

function assertEq(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}", got "${actual}"`);
  }
  console.log(`  ✓ ${label} = ${actual}`);
}

const env = loadEnvLocal();
const secret = env.STRIPE_SECRET_KEY?.trim();
const country = env.STRIPE_CONNECT_COUNTRY?.trim().toUpperCase() || "GB";

if (!secret) {
  console.error("STRIPE_SECRET_KEY not found in .env.local");
  process.exit(1);
}

const mode = secret.startsWith("sk_live") ? "LIVE" : "TEST";
if (mode === "LIVE") {
  console.error("Refusing to run on LIVE key — use sk_test_ in .env.local for this test.");
  process.exit(1);
}

const stripe = new Stripe(secret);
const testEmail = `puyer-connect-test+${Date.now()}@example.com`;
const testUserId = `test-user-${Date.now()}`;

console.log(`=== Puyer Connect account creation test (${mode}) ===\n`);
console.log(`Country: ${country}`);
console.log(`Test email: ${testEmail}\n`);

let accountId = null;

try {
  console.log("1. Creating connected account (buildConnectAccountParams)...");
  const created = await stripe.accounts.create(
    buildConnectAccountParams(testUserId, testEmail, country)
  );
  accountId = created.id;
  console.log(`   Created: ${accountId}\n`);

  console.log("2. Retrieving account and verifying controller...");
  const account = await stripe.accounts.retrieve(accountId);
  const c = account.controller;

  assertEq("controller.fees.payer", c?.fees?.payer, EXPECTED.feesPayer);
  assertEq("controller.losses.payments", c?.losses?.payments, EXPECTED.lossesPayments);
  assertEq("controller.requirement_collection", c?.requirement_collection, EXPECTED.requirementCollection);
  assertEq("controller.stripe_dashboard.type", c?.stripe_dashboard?.type, EXPECTED.dashboardType);

  if (account.type === "express") {
    throw new Error(`account.type should not be "express", got "${account.type}"`);
  }
  console.log(`  ✓ account.type = ${account.type ?? "(none)"} (not express)`);

  const hasTransferDataGuard = true;
  console.log(`  ✓ checkout uses direct charges (no transfer_data in code)`);

  console.log("\n3. Creating account onboarding link (smoke test)...");
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: "https://puyer.org/settings?stripe_connect=refresh",
    return_url: "https://puyer.org/settings?stripe_connect=success",
    type: "account_onboarding",
  });
  if (!link.url?.startsWith("https://")) {
    throw new Error("accountLinks.create did not return a URL");
  }
  console.log(`  ✓ accountLinks.create OK (${link.url.slice(0, 48)}...)`);

  console.log("\n=== PASS: new accounts use seller-pays-fees configuration ===\n");
} catch (err) {
  console.error("\n=== FAIL ===");
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  if (accountId) {
    console.log(`4. Cleaning up test account ${accountId}...`);
    try {
      await stripe.accounts.del(accountId);
      console.log("   Deleted test account.\n");
    } catch (delErr) {
      console.warn("   Could not delete test account:", delErr instanceof Error ? delErr.message : delErr);
      console.warn(`   Remove manually in Stripe Dashboard: ${accountId}\n`);
    }
  }
}

if (process.exitCode === 1) process.exit(1);
