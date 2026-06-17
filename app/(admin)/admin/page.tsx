import Link from "next/link";
import { getAdminOverviewStats, listRecentAdminActions } from "@/lib/admin/queries";
import { adminRunStripeBanCronAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <Card className="border-white/[0.06] bg-[#121821]/90 p-5 transition-colors hover:border-white/10">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${accent ?? "text-white"}`}>{value}</p>
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default async function AdminOverviewPage() {
  const stats = await getAdminOverviewStats();
  const recentActions = await listRecentAdminActions(15);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Admin overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform health, users, and site traffic
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} href="/admin/users" />
        <StatCard
          label="Banned"
          value={stats.bannedUsers}
          href="/admin/users?status=banned"
          accent="text-red-400"
        />
        <StatCard label="Pro subscribers" value={stats.proUsers} />
        <StatCard label="Stripe connected" value={stats.stripeConnected} />
        <StatCard label="Signups today" value={stats.signupsToday} />
        <StatCard label="Page views today" value={stats.pageViewsToday} href="/admin/analytics" />
        <StatCard label="Page views (7d)" value={stats.pageViewsWeek} href="/admin/analytics" />
        <StatCard label="Active users" value={stats.activeUsers} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/users">Manage users</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/analytics">View analytics</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/activity">Live activity</Link>
        </Button>
        <form action={adminRunStripeBanCronAction}>
          <Button variant="secondary" type="submit">
            Run Stripe ban cron now
          </Button>
        </form>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent admin actions
        </h2>
        {recentActions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No admin actions logged yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {recentActions.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.04]">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{row.action}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {row.target_user_id ? (
                        <Link
                          href={`/admin/users/${row.target_user_id}`}
                          className="text-[#3B82F6] hover:underline"
                        >
                          {row.target_user_id.slice(0, 8)}…
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
