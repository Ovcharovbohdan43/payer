import { createClient } from "@/lib/supabase/server";
import { listInvoices } from "@/app/invoices/actions";
import { listClients } from "@/app/clients/actions";
import { listOffers } from "@/app/offers/actions";
import { computeAnalytics } from "@/lib/dashboard/analytics";
import { formatAmount } from "@/lib/invoices/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
    currency
  );

  const totalInv = data.paidSumCents + data.unpaidSumCents;
  const paidPercent = totalInv > 0 ? (data.paidSumCents / totalInv) * 100 : 0;
  const unpaidPercent = totalInv > 0 ? (data.unpaidSumCents / totalInv) * 100 : 0;

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

        {/* Revenue by period */}
        <section id="revenue" className="mb-8 rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5 sm:p-6 scroll-mt-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Revenue
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
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
        </section>

        {/* Invoices: paid vs unpaid */}
        <section id="invoices" className="mb-8 rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5 sm:p-6 scroll-mt-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Invoices
          </h2>
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatBlock
              label="Paid"
              value={`${data.paidCount} · ${formatAmount(data.paidSumCents, currency)}`}
              href="/invoices?status=paid"
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
          {totalInv > 0 && (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Paid vs unpaid</p>
              <div className="flex h-10 overflow-hidden rounded-lg bg-white/5">
                {paidPercent > 0 && (
                  <div
                    className="bg-emerald-500/60 transition-all"
                    style={{ width: `${paidPercent}%` }}
                    title={`Paid: ${formatAmount(data.paidSumCents, currency)}`}
                  />
                )}
                {unpaidPercent > 0 && (
                  <div
                    className="bg-amber-500/60 transition-all"
                    style={{ width: `${unpaidPercent}%` }}
                    title={`Unpaid: ${formatAmount(data.unpaidSumCents, currency)}`}
                  />
                )}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
                  Paid {formatAmount(data.paidSumCents, currency)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500/60" />
                  Unpaid {formatAmount(data.unpaidSumCents, currency)}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Invoice counts chart */}
        <section className="mb-8 rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Invoice counts
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full max-w-[120px] rounded-t bg-emerald-500/40 transition-all"
                style={{
                  height: `${Math.max(20, data.paidCount * 8)}px`,
                }}
              />
              <p className="text-lg font-bold tabular-nums">{data.paidCount}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
            <div className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full max-w-[120px] rounded-t bg-amber-500/40 transition-all"
                style={{
                  height: `${Math.max(20, data.unpaidCount * 8)}px`,
                }}
              />
              <p className="text-lg font-bold tabular-nums">{data.unpaidCount}</p>
              <p className="text-xs text-muted-foreground">Unpaid</p>
            </div>
            <div className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full max-w-[120px] rounded-t bg-red-500/40 transition-all"
                style={{
                  height: `${Math.max(20, data.overdueCount * 8)}px`,
                }}
              />
              <p className="text-lg font-bold tabular-nums">{data.overdueCount}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>
        </section>

        {/* Business metrics */}
        <section className="mb-8 rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Business metrics
          </h2>
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
        </section>

        {/* Payouts */}
        <section id="payouts" className="rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5 sm:p-6 scroll-mt-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Payouts
          </h2>
          {data.payouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payouts yet. Connect Stripe in Settings to receive payments.
            </p>
          ) : (
            <div className="space-y-3">
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
          )}
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link href="/settings">Payment settings</Link>
          </Button>
        </section>
      </div>
    </div>
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
