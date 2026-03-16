import { createClient } from "@/lib/supabase/server";
import { listInvoices } from "@/app/invoices/actions";
import { listClients } from "@/app/clients/actions";
import { listOffers } from "@/app/offers/actions";
import { computeAnalytics } from "@/lib/dashboard/analytics";
import { formatAmount } from "@/lib/invoices/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/dashboard/chart-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import {
  InvoiceBarChart,
  InvoiceDonutChart,
  InvoiceAmountsBarChart,
} from "@/components/dashboard/invoice-chart";
import { PayoutsChart } from "@/components/dashboard/payouts-chart";

type PageProps = { searchParams: Promise<{ period?: string }> };

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { period } = await searchParams;
  const periodDays =
    period === "7" || period === "30" || period === "90" ? Number(period) : undefined;

  const [invoices, clients, offers] = await Promise.all([
    listInvoices(),
    listClients(),
    listOffers(),
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_currency")
    .eq("id", user.id)
    .single();

  const { data: payouts } = await supabase
    .from("payouts")
    .select("amount_cents, currency, created_at, arrival_date")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const offerAcceptedCount = offers.filter((o) => o.status === "accepted").length;
  const offerDeclinedCount = offers.filter((o) => o.status === "declined").length;

  const currency = profile?.default_currency ?? "USD";
  const data = computeAnalytics(
    invoices,
    clients.length,
    offers.length,
    offerAcceptedCount,
    offerDeclinedCount,
    payouts ?? [],
    currency,
    periodDays
  );

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                ← Dashboard
              </Link>
            </Button>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Financial overview</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Revenue, invoices, payouts, and business metrics
            </p>
          </div>
        </div>

        {/* Revenue */}
        <ChartCard id="revenue" title="Revenue" className="mb-8 scroll-mt-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Period:</span>
            <div className="flex flex-wrap gap-1">
              <PeriodLink period={undefined} current={period} label="All time" />
              <PeriodLink period="7" current={period} label="Last 7 days" />
              <PeriodLink period="30" current={period} label="Last 30 days" />
              <PeriodLink period="90" current={period} label="Last 90 days" />
            </div>
          </div>
          {data.periodDays != null && data.revenueInPeriodCents != null ? (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-1">
                <StatBlock
                  label={`Revenue (last ${data.periodDays} days)`}
                  value={formatAmount(data.revenueInPeriodCents, currency)}
                  href="/invoices?status=paid"
                />
              </div>
              <RevenueChart data={data.revenueByWeek} currency={currency} />
            </>
          ) : (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <StatBlock
                  label="This week"
                  value={formatAmount(data.revenueThisWeekCents, currency)}
                  href="/invoices?status=paid"
                />
                <StatBlock
                  label="This month"
                  value={formatAmount(data.revenueThisMonthCents, currency)}
                  href="/invoices?status=paid"
                />
                <StatBlock
                  label="All time"
                  value={formatAmount(data.revenueAllTimeCents, currency)}
                  href="/invoices?status=paid"
                />
              </div>
              <RevenueChart data={data.revenueByWeek} currency={currency} />
            </>
          )}
        </ChartCard>

        {/* Invoices */}
        <ChartCard id="invoices" title="Invoices" className="mb-8 scroll-mt-4">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatBlock
              label="Paid"
              value={`${data.paidCount} · ${formatAmount(data.paidSumCents, currency)}`}
              href="/invoices?status=paid"
            />
            <StatBlock
              label="Expected"
              value={`${data.expectedCount} · ${formatAmount(data.expectedSumCents, currency)}`}
              href="/invoices?status=sent"
            />
            <StatBlock
              label="Unpaid"
              value={`${data.unpaidCount} · ${formatAmount(data.unpaidSumCents, currency)}`}
              href="/invoices?status=unpaid"
            />
            <StatBlock
              label="Overdue"
              value={`${data.overdueCount} · ${formatAmount(data.overdueSumCents, currency)}`}
              href="/invoices?status=overdue"
            />
            <StatBlock
              label="Payment success"
              value={data.paymentSuccessRate != null ? `${data.paymentSuccessRate}%` : "—"}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">Counts by status</p>
              <InvoiceBarChart
                paidCount={data.paidCount}
                unpaidCount={data.unpaidCount}
                overdueCount={data.overdueCount}
              />
            </div>
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">Paid vs unpaid</p>
              <InvoiceDonutChart
                paidSumCents={data.paidSumCents}
                unpaidSumCents={data.unpaidSumCents}
                currency={currency}
              />
            </div>
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">Amounts by status</p>
              <InvoiceAmountsBarChart
                paidSumCents={data.paidSumCents}
                unpaidSumCents={data.unpaidSumCents}
                overdueSumCents={data.overdueSumCents}
                currency={currency}
              />
            </div>
          </div>
        </ChartCard>

        {/* By client */}
        {data.revenueByClient.length > 0 && (
          <ChartCard id="by-client" title="Revenue / Unpaid by client" className="mb-8 scroll-mt-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Client</th>
                    <th className="pb-2 pr-4 text-right font-medium">Paid</th>
                    <th className="pb-2 text-right font-medium">Unpaid</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenueByClient.slice(0, 10).map((c, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2.5 pr-4 font-medium">{c.clientName}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-green-400/90">
                        {formatAmount(c.paidCents, currency)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-amber-400/90">
                        {formatAmount(c.unpaidCents, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.revenueByClient.length > 10 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Top 10 by total amount · {data.revenueByClient.length} clients with activity
              </p>
            )}
            {data.periodDays != null && (
              <p className="mt-2 text-xs text-muted-foreground">
                Paid amounts are for the selected period. Unpaid is all-time.
              </p>
            )}
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link href="/clients">View all clients</Link>
            </Button>
          </ChartCard>
        )}

        {/* Business metrics */}
        <ChartCard title="Business metrics" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatBlock label="Clients" value={String(data.clientCount)} href="/clients" />
            <StatBlock label="Offers" value={String(data.offerCount)} href="/offers" />
            <StatBlock
              label="Offers accepted"
              value={`${data.offerAcceptedCount}`}
              href="/offers"
            />
            <StatBlock
              label="Offers declined"
              value={`${data.offerDeclinedCount}`}
              href="/offers"
            />
          </div>
        </ChartCard>

        {/* Payouts */}
        <ChartCard id="payouts" title="Payouts" className="scroll-mt-4">
          {data.payoutsInTransitCents > 0 && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-xs font-medium text-amber-200/90">In transit</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-amber-100">
                {formatAmount(data.payoutsInTransitCents, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sent to bank, not yet arrived
              </p>
            </div>
          )}
          <PayoutsChart data={data.payoutsByPeriod} currency={currency} />
          {data.payouts.length > 0 ? (
            <div className="mt-6 space-y-3">
              {data.payouts.slice(0, 20).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium tabular-nums">
                      {formatAmount(Number(p.amount_cents), p.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-US", {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {p.arrival_date ? (
                      <>Arrives {new Date(p.arrival_date).toLocaleDateString("en-US")}</>
                    ) : (
                      "Sent to bank"
                    )}
                  </div>
                </div>
              ))}
              {data.payouts.length > 20 && (
                <p className="text-center text-xs text-muted-foreground">
                  Showing last 20 payouts
                </p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Connect Stripe in Settings to receive payments.
            </p>
          )}
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link href="/settings">Payment settings</Link>
          </Button>
        </ChartCard>
      </div>
    </div>
  );
}

function PeriodLink({
  period,
  current,
  label,
}: {
  period: string | undefined;
  current: string | undefined;
  label: string;
}) {
  const isActive =
    (period == null && current == null) || (period != null && current === period);
  const href = period != null ? `/dashboard/analytics?period=${period}` : "/dashboard/analytics";
  return (
    <Link
      href={href}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function StatBlock({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{value}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }
  return content;
}
