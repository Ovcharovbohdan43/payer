import Link from "next/link";
import { getSiteAnalyticsSummary } from "@/lib/admin/queries";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SimpleBarChart } from "@/components/admin/simple-bar-chart";
import { Button } from "@/components/ui/button";

type PageProps = { searchParams: Promise<{ days?: string }> };

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days =
    params.days === "7" || params.days === "30" || params.days === "90"
      ? Number(params.days)
      : 30;

  const data = await getSiteAnalyticsSummary(days);
  const totalViews = data.dailyViews.reduce((s, d) => s + d.count, 0);
  const totalSignups = data.signupsByDay.reduce((s, d) => s + d.count, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Site analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Page views and signups tracked server-side
          </p>
        </div>
        <div className="flex gap-2">
          <PeriodLink days={7} current={days} />
          <PeriodLink days={30} current={days} />
          <PeriodLink days={90} current={days} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Page views ({days}d)
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{totalViews}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Signups ({days}d)
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{totalSignups}</p>
        </div>
      </div>

      <ChartCard title="Daily page views">
        <SimpleBarChart data={data.dailyViews} label="Views" color="#3B82F6" />
      </ChartCard>

      <ChartCard title="Daily signups">
        <SimpleBarChart data={data.signupsByDay} label="Signups" color="#22c55e" />
      </ChartCard>

      <ChartCard title="Top pages">
        {data.topPaths.length === 0 ? (
          <p className="text-sm text-muted-foreground">No page view data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Path</th>
                  <th className="pb-2 font-medium text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {data.topPaths.map((row) => (
                  <tr key={row.path} className="border-t border-white/[0.04]">
                    <td className="py-2 font-mono text-white">{row.path}</td>
                    <td className="py-2 text-right text-muted-foreground">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      <p className="text-xs text-muted-foreground">
        Views are logged in middleware for GET requests (excluding /api and static assets).
        Vercel Analytics may show additional client-side metrics.
      </p>
    </div>
  );
}

function PeriodLink({ days, current }: { days: number; current: number }) {
  const active = days === current;
  return (
    <Button variant={active ? "default" : "outline"} size="sm" asChild>
      <Link href={`/admin/analytics?days=${days}`}>{days}d</Link>
    </Button>
  );
}
