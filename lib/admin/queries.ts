import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserRow = {
  id: string;
  email: string | null;
  business_name: string | null;
  first_name: string | null;
  last_name: string | null;
  account_status: string;
  subscription_status: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_account_id_at_ban: string | null;
  stripe_connect_revoked_at: string | null;
  country: string | null;
  created_at: string;
  onboarding_completed: boolean | null;
  is_admin: boolean;
  invoice_creation_limit: number | null;
  invoice_creation_reviewed_at: string | null;
};

export type AdminOverviewStats = {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  proUsers: number;
  stripeConnected: number;
  signupsToday: number;
  pageViewsToday: number;
  pageViewsWeek: number;
};

export type SiteAnalyticsSummary = {
  dailyViews: { date: string; count: number }[];
  topPaths: { path: string; count: number }[];
  signupsByDay: { date: string; count: number }[];
};

function startOfDayIso(d: Date): string {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString();
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const admin = createAdminClient();
  const now = new Date();
  const todayStart = startOfDayIso(now);
  const weekAgo = new Date(now);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: bannedUsers },
    { count: proUsers },
    { count: stripeConnected },
    { count: signupsToday },
    { count: pageViewsToday },
    { count: pageViewsWeek },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "active"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "banned"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("subscription_status", ["active", "trialing"]),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("stripe_connect_account_id", "is", null),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    admin
      .from("site_analytics_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    admin
      .from("site_analytics_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    activeUsers: activeUsers ?? 0,
    bannedUsers: bannedUsers ?? 0,
    proUsers: proUsers ?? 0,
    stripeConnected: stripeConnected ?? 0,
    signupsToday: signupsToday ?? 0,
    pageViewsToday: pageViewsToday ?? 0,
    pageViewsWeek: pageViewsWeek ?? 0,
  };
}

import { isAccountPendingReview } from "@/lib/invoices/creation-limit";

export async function listAdminUsers(options: {
  search?: string;
  status?: "all" | "active" | "banned" | "pending_review";
  limit?: number;
  offset?: number;
}): Promise<{ users: AdminUserRow[]; total: number }> {
  const admin = createAdminClient();
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const search = options.search?.trim().toLowerCase();

  let query = admin
    .from("profiles")
    .select(
      "id, business_name, first_name, last_name, account_status, subscription_status, stripe_connect_account_id, stripe_connect_account_id_at_ban, stripe_connect_revoked_at, country, created_at, onboarding_completed, is_admin, invoice_creation_limit, invoice_creation_reviewed_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status === "active") {
    query = query.eq("account_status", "active");
  } else if (options.status === "banned") {
    query = query.eq("account_status", "banned");
  } else if (options.status === "pending_review") {
    query = query
      .eq("is_admin", false)
      .is("invoice_creation_reviewed_at", null)
      .or("invoice_creation_limit.is.null,invoice_creation_limit.gt.0");
  }

  if (search) {
    query = query.or(
      `business_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    );
  }

  const { data: profiles, count, error } = await query;
  if (error) throw new Error(error.message);

  const emailsById = await fetchEmailsForUserIds((profiles ?? []).map((p) => p.id));

  const users: AdminUserRow[] = (profiles ?? []).map((p) => ({
    ...p,
    email: emailsById.get(p.id) ?? null,
  }));

  let filtered = users;
  if (search) {
    filtered = users.filter(
      (u) =>
        u.email?.toLowerCase().includes(search) ||
        u.business_name?.toLowerCase().includes(search) ||
        u.first_name?.toLowerCase().includes(search) ||
        u.last_name?.toLowerCase().includes(search)
    );
  }

  return { users: filtered, total: count ?? filtered.length };
}

async function fetchEmailsForUserIds(
  userIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;

  const admin = createAdminClient();
  for (const id of userIds) {
    const { data } = await admin.auth.admin.getUserById(id);
    if (data.user?.email) {
      map.set(id, data.user.email);
    }
  }
  return map;
}

export async function getAdminUserDetail(userId: string) {
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) return null;

  const { data: authUser } = await admin.auth.admin.getUserById(userId);

  const [
    { count: invoiceCount },
    { count: clientCount },
    { count: offerCount },
    { data: ipLog },
    { data: bannedEmail },
    { data: bannedIps },
    { data: recentInvoices },
    { data: auditLogs },
    { data: review },
    { data: clients },
    { data: payments },
    { data: payouts },
    { data: integrations },
    { data: userActivity },
    { data: adminActionsOnUser },
  ] = await Promise.all([
    admin.from("invoices").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("clients").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("offers").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin
      .from("user_ip_log")
      .select("ip_address, last_seen_at")
      .eq("user_id", userId)
      .order("last_seen_at", { ascending: false })
      .limit(20),
    admin
      .from("banned_emails")
      .select("email, banned_at")
      .eq("banned_user_id", userId)
      .maybeSingle(),
    admin
      .from("banned_ip_addresses")
      .select("ip_address, banned_at")
      .eq("banned_user_id", userId),
    admin
      .from("invoices")
      .select("id, public_id, status, amount_cents, currency, created_at, paid_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("audit_logs")
      .select("id, entity_type, action, meta, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("user_reviews")
      .select("rating, comment, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("clients")
      .select("id, name, email, phone, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("payments")
      .select("id, amount_cents, currency, paid_at, created_at, invoice_id, invoices!inner(user_id)")
      .eq("invoices.user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("payouts")
      .select("id, amount_cents, currency, status, created_at, arrival_date")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("integration_connections")
      .select("id, provider, calendar_sync_enabled, external_user_id, created_at, updated_at")
      .eq("user_id", userId),
    admin
      .from("platform_activity_log")
      .select("id, category, action, path, ip_address, meta, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("admin_actions_log")
      .select("id, admin_id, action, meta, created_at")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    profile,
    email: authUser.user?.email ?? null,
    lastSignIn: authUser.user?.last_sign_in_at ?? null,
    emailConfirmed: authUser.user?.email_confirmed_at ?? null,
    createdAtAuth: authUser.user?.created_at ?? null,
    providers: authUser.user?.app_metadata?.providers ?? authUser.user?.identities?.map((i) => i.provider) ?? [],
    counts: {
      invoices: invoiceCount ?? 0,
      clients: clientCount ?? 0,
      offers: offerCount ?? 0,
    },
    ipLog: ipLog ?? [],
    bannedEmail,
    bannedIps: bannedIps ?? [],
    recentInvoices: recentInvoices ?? [],
    auditLogs: auditLogs ?? [],
    review,
    clients: clients ?? [],
    payments: payments ?? [],
    payouts: payouts ?? [],
    integrations: integrations ?? [],
    userActivity: userActivity ?? [],
    adminActionsOnUser: adminActionsOnUser ?? [],
  };
}

export async function getSiteAnalyticsSummary(days = 30): Promise<SiteAnalyticsSummary> {
  const admin = createAdminClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const [{ data: events }, { data: profiles }] = await Promise.all([
    admin
      .from("site_analytics_events")
      .select("path, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true }),
    admin
      .from("profiles")
      .select("created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true }),
  ]);

  const dailyMap = new Map<string, number>();
  const pathMap = new Map<string, number>();
  const signupMap = new Map<string, number>();

  for (const e of events ?? []) {
    const day = e.created_at.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    pathMap.set(e.path, (pathMap.get(e.path) ?? 0) + 1);
  }

  for (const p of profiles ?? []) {
    const day = p.created_at.slice(0, 10);
    signupMap.set(day, (signupMap.get(day) ?? 0) + 1);
  }

  const sortByDate = (entries: [string, number][]) =>
    entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

  const topPaths = [...pathMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([path, count]) => ({ path, count }));

  return {
    dailyViews: sortByDate([...dailyMap.entries()]),
    topPaths,
    signupsByDay: sortByDate([...signupMap.entries()]),
  };
}

export async function listRecentAdminActions(limit = 30) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_actions_log")
    .select("id, admin_id, action, target_user_id, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
