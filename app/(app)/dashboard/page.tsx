import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { listInvoices } from "@/app/invoices/actions";
import { computeDashboardStats } from "@/lib/dashboard/stats";
import { buildActivityFromInvoices } from "@/lib/dashboard/activity";
import { formatAmount } from "@/lib/invoices/utils";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardFab } from "@/app/dashboard/dashboard-fab";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const invoices = await listInvoices();
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, default_currency")
    .eq("id", user.id)
    .single();

  const currency = profile?.default_currency ?? "USD";
  const stats = computeDashboardStats(invoices, currency);
  const activity = buildActivityFromInvoices(invoices, currency);
  const hasInvoices = invoices.length > 0;

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0B0F14]">
      <div className="mx-auto max-w-4xl px-3 py-3 sm:px-6 sm:py-8 min-[375px]:px-4 min-[375px]:py-4">
        {/* KPI Cards — no horizontal scroll: grid on mobile, flex on desktop */}
        <div className="mb-4 grid grid-cols-3 gap-2 sm:mb-8 sm:flex sm:grid-cols-none sm:gap-4">
          <KpiCard
            label="Revenue this month"
            value={formatAmount(stats.paidThisMonthCents, currency)}
            href="/invoices?status=paid"
            gradient="from-emerald-500/10 via-[#121821] to-[#121821]"
            glow="emerald"
          />
          <KpiCard
            label="Money owed"
            value={formatAmount(stats.unpaidSumCents, currency)}
            href="/invoices?status=unpaid"
            gradient="from-blue-500/10 via-[#121821] to-[#121821]"
            glow="blue"
          />
          <KpiCard
            label="Overdue"
            value={formatAmount(stats.overdueSumCents, currency)}
            href="/invoices?status=overdue"
            gradient="from-red-500/10 via-[#121821] to-[#121821]"
            glow="red"
          />
        </div>

        {/* Create Invoice CTA */}
        <div className="mb-4 sm:mb-8">
          <Button
            asChild
            className="h-11 w-full rounded-[14px] bg-[#3B82F6] text-sm font-semibold shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all hover:bg-[#2563EB] sm:h-16 sm:rounded-[20px] sm:text-base"
          >
            <Link href="/invoices/new" className="flex items-center justify-center gap-2">
              <Plus className="size-6" />
              Create Invoice
            </Link>
          </Button>
        </div>

        {/* Empty state or content */}
        {!hasInvoices ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RecentInvoices invoices={invoices} baseUrl={BASE_URL} />
            </div>
            <div className="lg:col-span-2">
              <ActivityFeed items={activity} />
            </div>
          </div>
        )}
      </div>
      <DashboardFab />
    </div>
  );
}

function KpiCard({
  label,
  value,
  href,
  gradient,
  glow,
}: {
  label: string;
  value: string;
  href: string;
  gradient: string;
  glow: "emerald" | "blue" | "red";
}) {
  const glowColors = {
    emerald: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]",
    blue: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]",
    red: "group-hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]",
  };

  return (
    <Link
      href={href}
      className={`group min-w-0 rounded-[12px] border border-white/5 bg-gradient-to-br ${gradient} p-2 backdrop-blur transition-all duration-300 hover:border-white/10 sm:min-w-0 sm:flex-1 sm:rounded-[20px] sm:p-6 ${glowColors[glow]}`}
    >
      <p className="truncate text-[10px] font-medium text-muted-foreground sm:text-sm">{label}</p>
      <p className="mt-0.5 truncate text-base font-bold tabular-nums sm:mt-2 sm:text-4xl sm:truncate-none">{value}</p>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-white/10 bg-[#121821]/40 px-6 py-12 text-center sm:rounded-[20px] sm:px-8 sm:py-16">
      <p className="text-base font-medium sm:text-lg">Create your first invoice in 15 seconds</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Add a client, amount, and send a payment link.
      </p>
      <Button
        asChild
        className="mt-4 h-11 w-full rounded-xl bg-[#3B82F6] font-semibold sm:mt-6 sm:h-12 sm:w-auto sm:px-8"
      >
        <Link href="/invoices/new">Create invoice</Link>
      </Button>
    </div>
  );
}
