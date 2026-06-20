/**
 * Platform analytics & live monitor (for ad campaigns, signups, payments).
 *
 * Usage:
 *   node scripts/platform-monitor.mjs              # snapshot for all periods
 *   node scripts/platform-monitor.mjs --live       # live event stream + stats refresh
 *   node scripts/platform-monitor.mjs --live -i 5  # poll every 5s (default 3)
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PERIODS = [
  { key: "2h", label: "2 hours", hours: 2 },
  { key: "24h", label: "24 hours", hours: 24 },
  { key: "48h", label: "2 days", hours: 48 },
  { key: "7d", label: "7 days", hours: 24 * 7 },
  { key: "30d", label: "30 days", hours: 24 * 30 },
];

const LANDING_PATHS = ["/", "/register", "/demo", "/login"];

const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

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

function parseArgs(argv) {
  const args = { live: false, interval: 3, statsEvery: 30 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--live" || a === "-l") args.live = true;
    else if (a === "--interval" || a === "-i") args.interval = Number(argv[++i]) || 3;
    else if (a === "--stats-every") args.statsEvery = Number(argv[++i]) || 30;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function sinceIso(hoursAgo) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

function fmtTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmtMoney(cents, currency = "GBP") {
  if (!cents) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function shortId(id) {
  if (!id) return "—";
  return `${id.slice(0, 8)}…`;
}

function pad(str, len) {
  const s = String(str);
  return s.length >= len ? s.slice(0, len) : s + " ".repeat(len - s.length);
}

async function countSince(supabase, table, since, extraFilter) {
  let q = supabase.from(table).select("id", { count: "exact", head: true }).gte("created_at", since);
  if (extraFilter) q = extraFilter(q);
  const { count, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function countPaidInvoices(supabase, since) {
  const { count, error } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .not("paid_at", "is", null)
    .gte("paid_at", since);
  if (error) throw new Error(`invoices paid: ${error.message}`);
  return count ?? 0;
}

async function sumPayments(supabase, since) {
  const { data, error } = await supabase
    .from("payments")
    .select("amount_cents, currency")
    .gte("paid_at", since)
    .limit(5000);
  if (error) throw new Error(`payments: ${error.message}`);
  const byCurrency = {};
  for (const row of data ?? []) {
    const cur = (row.currency ?? "gbp").toUpperCase();
    byCurrency[cur] = (byCurrency[cur] ?? 0) + (row.amount_cents ?? 0);
  }
  return { count: data?.length ?? 0, byCurrency };
}

async function countActivity(supabase, since, action) {
  let q = supabase
    .from("platform_activity_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if (action) q = q.eq("action", action);
  const { count, error } = await q;
  if (error) throw new Error(`activity ${action ?? "*"}: ${error.message}`);
  return count ?? 0;
}

async function countLandingViews(supabase, since) {
  const { count, error } = await supabase
    .from("site_analytics_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .in("path", LANDING_PATHS);
  if (error) throw new Error(`landing views: ${error.message}`);
  return count ?? 0;
}

async function countStripeConnects(supabase, since) {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .not("stripe_connect_account_id", "is", null)
    .gte("updated_at", since);
  if (error) throw new Error(`stripe connects: ${error.message}`);
  return count ?? 0;
}

async function countPathViews(supabase, since, path) {
  const { count, error } = await supabase
    .from("site_analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("path", path)
    .gte("created_at", since);
  if (error) throw new Error(`path ${path}: ${error.message}`);
  return count ?? 0;
}

async function countOnboardingCompleted(supabase, since) {
  return countActivity(supabase, since, "onboarding.completed");
}

async function fetchCtaBreakdown(supabase, since) {
  const { data, error } = await supabase
    .from("platform_activity_log")
    .select("meta")
    .eq("action", "cta.clicked")
    .gte("created_at", since)
    .limit(2000);
  if (error) return [];
  const byLocation = new Map();
  for (const row of data ?? []) {
    const loc = row.meta?.location ?? "unknown";
    byLocation.set(loc, (byLocation.get(loc) ?? 0) + 1);
  }
  return [...byLocation.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([location, count]) => ({ location, count }));
}

async function fetchPeriodStats(supabase, hours) {
  const since = sinceIso(hours);
  const [
    signups,
    pageViews,
    landingViews,
    homePageViews,
    registerPageViews,
    ctaClicks,
    demoTries,
    invoicesCreated,
    invoicesPaid,
    payments,
    logins,
    signupEvents,
    onboardingCompleted,
    checkouts,
    stripeConnects,
  ] = await Promise.all([
    countSince(supabase, "profiles", since),
    countSince(supabase, "site_analytics_events", since),
    countLandingViews(supabase, since),
    countPathViews(supabase, since, "/"),
    countPathViews(supabase, since, "/register"),
    countActivity(supabase, since, "cta.clicked"),
    countSince(supabase, "demo_invoices", since),
    countSince(supabase, "invoices", since),
    countPaidInvoices(supabase, since),
    sumPayments(supabase, since),
    countActivity(supabase, since, "login.password").then(async (pw) => {
      const [otp, oauth] = await Promise.all([
        countActivity(supabase, since, "login.otp_verified"),
        countActivity(supabase, since, "login.oauth_or_magic"),
      ]);
      return pw + otp + oauth;
    }),
    countActivity(supabase, since, "signup.completed"),
    countOnboardingCompleted(supabase, since),
    countActivity(supabase, since, "checkout.started"),
    countStripeConnects(supabase, since),
  ]);

  const paymentTotal = Object.entries(payments.byCurrency)
    .map(([cur, cents]) => fmtMoney(cents, cur))
    .join(" + ") || "—";

  return {
    signups,
    pageViews,
    landingViews,
    homePageViews,
    registerPageViews,
    ctaClicks,
    demoTries,
    invoicesCreated,
    invoicesPaid,
    paymentsCount: payments.count,
    paymentTotal,
    logins,
    signupEvents,
    onboardingCompleted,
    checkouts,
    stripeConnects,
  };
}

async function fetchTopReferrers(supabase, hours = 24) {
  const since = sinceIso(hours);
  const { data, error } = await supabase
    .from("site_analytics_events")
    .select("referrer")
    .gte("created_at", since)
    .limit(3000);
  if (error) return [];
  const counts = new Map();
  for (const row of data ?? []) {
    const ref = row.referrer?.trim() || "(direct / none)";
    const host = ref.startsWith("http") ? tryHost(ref) : ref;
    counts.set(host, (counts.get(host) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([referrer, count]) => ({ referrer, count }));
}

function tryHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 60);
  }
}

async function fetchTopPaths(supabase, hours = 24) {
  const since = sinceIso(hours);
  const { data, error } = await supabase
    .from("site_analytics_events")
    .select("path")
    .gte("created_at", since)
    .limit(3000);
  if (error) return [];
  const counts = new Map();
  for (const row of data ?? []) {
    const path = row.path ?? "/";
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));
}

async function fetchRecentSignups(supabase, limit = 5) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, business_name, first_name, last_name, country, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

function pct(part, whole) {
  if (!whole) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

function printLine(label, value, color = c.cyan) {
  console.log(`  ${c.dim}${pad(label, 28)}${c.reset} ${color}${value}${c.reset}`);
}

function printFunnelSection(allStats, ctaBreakdown24h) {
  const idx24 = PERIODS.findIndex((p) => p.key === "24h");
  const s = allStats[idx24];

  console.log(`\n${c.bold}${c.magenta}═══ Registration funnel (24h) ═══${c.reset}`);
  console.log(
    `${c.dim}Home → CTA click → /register → signup → onboarding → invoice${c.reset}\n`
  );

  printLine("1. Home page views", s.homePageViews, c.cyan);
  printLine("2. CTA clicks", s.ctaClicks, c.yellow);
  printLine("   conversion from home", pct(s.ctaClicks, s.homePageViews), c.dim);
  printLine("3. Register page views", s.registerPageViews, c.cyan);
  printLine("   conversion from CTA", pct(s.registerPageViews, s.ctaClicks), c.dim);
  printLine("4. Signups completed", s.signupEvents, c.green);
  printLine("   conversion from /register", pct(s.signupEvents, s.registerPageViews), c.dim);
  printLine("5. Onboarding completed", s.onboardingCompleted, c.green);
  printLine("   conversion from signups", pct(s.onboardingCompleted, s.signupEvents), c.dim);
  printLine("6. Invoices created", s.invoicesCreated, c.magenta);
  printLine("   conversion from onboarding", pct(s.invoicesCreated, s.onboardingCompleted), c.dim);

  if (ctaBreakdown24h.length > 0) {
    console.log(`\n${c.bold}CTA clicks by location (24h)${c.reset}`);
    for (const { location, count } of ctaBreakdown24h) {
      console.log(`  ${c.dim}${pad(String(count), 5)}${c.reset} ${location}`);
    }
  }

  console.log(`\n${c.bold}Funnel counts by period${c.reset}`);
  const cols = PERIODS.map((p) => pad(p.label, 10));
  const header = `${pad("Step", 28)} ${cols.join(" ")}`;
  console.log(`${c.bold}${header}${c.reset}`);
  console.log(c.dim + "─".repeat(header.length) + c.reset);

  const funnelRows = [
    ["Home page views", (x) => x.homePageViews, c.cyan],
    ["CTA clicks", (x) => x.ctaClicks, c.yellow],
    ["Register page views", (x) => x.registerPageViews, c.cyan],
    ["Signups completed", (x) => x.signupEvents, c.green],
    ["Onboarding completed", (x) => x.onboardingCompleted, c.green],
    ["Invoices created", (x) => x.invoicesCreated, c.magenta],
  ];

  for (const [label, getter, color] of funnelRows) {
    const values = allStats
      .map((stats) => pad(String(getter(stats)), 10))
      .join(" ");
    console.log(`  ${pad(label, 28)} ${color}${values}${c.reset}`);
  }

  console.log(
    `\n${c.dim}Note: CTA tracking starts after deploy. Register views include direct /register visits.${c.reset}`
  );
}

function printPeriodTable(allStats) {
  console.log(`\n${c.bold}${c.blue}═══ Platform analytics snapshot ═══${c.reset}`);
  console.log(`${c.dim}Generated: ${fmtTime(new Date().toISOString())}${c.reset}\n`);

  const cols = PERIODS.map((p) => pad(p.label, 10));
  const header = `${pad("Metric", 22)} ${cols.join(" ")}`;
  console.log(`${c.bold}${header}${c.reset}`);
  console.log(c.dim + "─".repeat(header.length) + c.reset);

  const rows = [
    ["Signups (profiles)", (s) => s.signups, c.green],
    ["Signup events (log)", (s) => s.signupEvents, c.green],
    ["Landing page views", (s) => s.landingViews, c.cyan],
    ["All page views", (s) => s.pageViews, c.cyan],
    ["Demo tries", (s) => s.demoTries, c.yellow],
    ["Logins", (s) => s.logins, c.blue],
    ["Invoices created", (s) => s.invoicesCreated, c.magenta],
    ["Invoices paid", (s) => s.invoicesPaid, c.green],
    ["Payments (count)", (s) => s.paymentsCount, c.green],
    ["Checkout started", (s) => s.checkouts, c.yellow],
    ["Stripe connect*", (s) => s.stripeConnects, c.yellow],
  ];

  for (const [label, getter, color] of rows) {
    const values = PERIODS.map((p, i) => {
      const v = getter(allStats[i]);
      return pad(String(v), 10);
    }).join(" ");
    console.log(`  ${pad(label, 22)} ${color}${values}${c.reset}`);
  }

  console.log(`\n${c.bold}Payment volume${c.reset}`);
  for (let i = 0; i < PERIODS.length; i++) {
    printLine(PERIODS[i].label, allStats[i].paymentTotal);
  }

  console.log(`\n${c.dim}* Stripe connect = profiles updated with Connect ID in period (approx.)${c.reset}`);
}

function printReferrers(referrers) {
  if (referrers.length === 0) return;
  console.log(`\n${c.bold}Top referrers (24h)${c.reset}`);
  for (const { referrer, count } of referrers) {
    console.log(`  ${c.dim}${pad(String(count), 5)}${c.reset} ${referrer}`);
  }
}

function printTopPaths(paths) {
  if (paths.length === 0) return;
  console.log(`\n${c.bold}Top pages (24h)${c.reset}`);
  for (const { path, count } of paths) {
    console.log(`  ${c.dim}${pad(String(count), 5)}${c.reset} ${path}`);
  }
}

function printRecentSignups(signups) {
  if (signups.length === 0) return;
  console.log(`\n${c.bold}Latest signups${c.reset}`);
  for (const u of signups) {
    const name =
      u.business_name ||
      [u.first_name, u.last_name].filter(Boolean).join(" ") ||
      "—";
    console.log(
      `  ${c.dim}${fmtTime(u.created_at)}${c.reset}  ${name}${u.country ? ` (${u.country})` : ""}  ${c.gray}${shortId(u.id)}${c.reset}`
    );
  }
}

function categoryColor(category) {
  switch (category) {
    case "auth":
      return c.green;
    case "billing":
      return c.yellow;
    case "admin":
      return c.red;
    case "page":
      return c.cyan;
    case "funnel":
      return c.yellow;
    default:
      return c.reset;
  }
}

function formatActivityEvent(row) {
  const cat = categoryColor(row.category);
  const time = fmtTime(row.created_at);
  const path = row.path ? `  ${c.dim}${row.path}${c.reset}` : "";
  const user = row.user_id ? `  user=${c.gray}${shortId(row.user_id)}${c.reset}` : "";
  const ip = row.ip_address ? `  ip=${c.dim}${row.ip_address}${c.reset}` : "";
  const meta =
    row.meta && Object.keys(row.meta).length > 0
      ? `  ${c.dim}${JSON.stringify(row.meta).slice(0, 80)}${c.reset}`
      : "";
  return `[${c.dim}${time}${c.reset}] ${cat}${pad(row.category.toUpperCase(), 7)}${c.reset} ${pad(row.action, 22)}${path}${user}${ip}${meta}`;
}

async function fetchActivitySince(supabase, since, limit = 100) {
  const { data, error } = await supabase
    .from("platform_activity_log")
    .select("id, category, action, user_id, path, ip_address, meta, created_at")
    .gt("created_at", since)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`activity feed: ${error.message}`);
  return data ?? [];
}

function printCompactStats(stats2h, stats24h) {
  console.log(`\n${c.bold}${c.blue}── Live pulse ──${c.reset}  ${c.dim}${fmtTime(new Date().toISOString())}${c.reset}`);
  console.log(
    `  ${c.green}2h funnel:${c.reset} ${stats2h.homePageViews} home · ${stats2h.ctaClicks} cta · ${stats2h.signupEvents} signup · ${stats2h.onboardingCompleted} onboard · ${stats2h.invoicesCreated} inv`
  );
  console.log(
    `  ${c.cyan}24h:${c.reset} ${stats24h.homePageViews} home · ${stats24h.ctaClicks} cta · ${stats24h.signupEvents} signup · ${stats24h.invoicesPaid} paid · ${stats24h.paymentTotal}`
  );
}

async function runSnapshot(supabase) {
  console.log(`${c.dim}Loading stats…${c.reset}`);
  const allStats = await Promise.all(PERIODS.map((p) => fetchPeriodStats(supabase, p.hours)));
  const [referrers, topPaths, recentSignups, ctaBreakdown24h] = await Promise.all([
    fetchTopReferrers(supabase, 24),
    fetchTopPaths(supabase, 24),
    fetchRecentSignups(supabase, 8),
    fetchCtaBreakdown(supabase, sinceIso(24)),
  ]);

  printPeriodTable(allStats);
  printFunnelSection(allStats, ctaBreakdown24h);
  printReferrers(referrers);
  printTopPaths(topPaths);
  printRecentSignups(recentSignups);
}

async function runLive(supabase, intervalSec, statsEverySec) {
  await runSnapshot(supabase);

  console.log(`\n${c.bold}${c.green}▶ Live mode${c.reset} — polling every ${intervalSec}s (${c.dim}Ctrl+C to stop${c.reset})\n`);

  let cursor = new Date().toISOString();
  let lastStatsAt = 0;
  const seenIds = new Set();

  const recent = await fetchActivitySince(supabase, sinceIso(2), 15);
  if (recent.length > 0) {
    console.log(`${c.dim}Recent activity (last 2h):${c.reset}`);
    for (const row of recent.slice(-10)) {
      seenIds.add(row.id);
      console.log(formatActivityEvent(row));
    }
    cursor = recent[recent.length - 1].created_at;
    console.log("");
  }

  const tick = async () => {
    try {
      const now = Date.now();
      if (now - lastStatsAt >= statsEverySec * 1000) {
        const [stats2h, stats24h] = await Promise.all([
          fetchPeriodStats(supabase, 2),
          fetchPeriodStats(supabase, 24),
        ]);
        printCompactStats(stats2h, stats24h);
        lastStatsAt = now;
      }

      const events = await fetchActivitySince(supabase, cursor, 50);
      for (const row of events) {
        if (seenIds.has(row.id)) continue;
        seenIds.add(row.id);
        console.log(formatActivityEvent(row));
        if (row.created_at > cursor) cursor = row.created_at;

        if (row.action === "signup.completed") {
          console.log(`  ${c.green}★ New signup!${c.reset}`);
        }
        if (row.action === "cta.clicked") {
          const loc = row.meta?.location ?? "?";
          const cta = row.meta?.cta ?? "cta";
          console.log(`  ${c.yellow}★ CTA click: ${cta} (${loc})${c.reset}`);
        }
        if (row.action === "onboarding.completed") {
          console.log(`  ${c.green}★ Onboarding completed${c.reset}`);
        }
        if (row.action === "checkout.started") {
          console.log(`  ${c.yellow}★ Checkout started${c.reset}`);
        }
      }

      if (seenIds.size > 5000) {
        seenIds.clear();
      }
    } catch (err) {
      console.error(`${c.red}Poll error:${c.reset}`, err.message);
    }
  };

  await tick();
  setInterval(tick, intervalSec * 1000);
}

function printHelp() {
  console.log(`
${c.bold}Puyer platform monitor${c.reset}

  node scripts/platform-monitor.mjs              Snapshot (2h, 24h, 2d, 7d, 30d)
  node scripts/platform-monitor.mjs --live       Live event stream + pulse stats
  node scripts/platform-monitor.mjs -l -i 5      Poll every 5 seconds

Options:
  --live, -l           Stream platform_activity_log in real time
  --interval, -i N     Poll interval in seconds (default 3)
  --stats-every N      Refresh 2h/24h pulse every N seconds (default 30)
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (args.live) {
    await runLive(supabase, args.interval, args.statsEvery);
  } else {
    await runSnapshot(supabase);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
