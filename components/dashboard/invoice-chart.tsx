"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
const INVOICE_COLORS = {
  paid: "#10B981",
  unpaid: "#F59E0B",
  overdue: "#EF4444",
};

type InvoiceChartProps = {
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  paidSumCents: number;
  unpaidSumCents: number;
  currency: string;
};

export function InvoiceBarChart({
  paidCount,
  unpaidCount,
  overdueCount,
}: Pick<InvoiceChartProps, "paidCount" | "unpaidCount" | "overdueCount">) {
  const data = [
    { name: "Paid", count: paidCount, fill: INVOICE_COLORS.paid },
    { name: "Unpaid", count: unpaidCount, fill: INVOICE_COLORS.unpaid },
    { name: "Overdue", count: overdueCount, fill: INVOICE_COLORS.overdue },
  ].filter((d) => d.count > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg bg-white/[0.02] text-sm text-muted-foreground">
        No invoice data yet
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full" aria-label="Invoice counts by status">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <filter id="bar-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.2" floodColor="#000" />
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div className="rounded-lg border border-white/10 bg-[#121821] px-3 py-2 shadow-xl">
                  <p className="text-xs text-muted-foreground">{payload[0].payload.name}</p>
                  <p className="text-sm font-semibold">{payload[0].value} invoices</p>
                </div>
              );
            }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar
            dataKey="count"
            radius={[6, 6, 0, 0]}
            filter="url(#bar-shadow)"
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InvoiceDonutChart({
  paidSumCents,
  unpaidSumCents,
  currency,
}: Pick<InvoiceChartProps, "paidSumCents" | "unpaidSumCents" | "currency">) {
  const total = paidSumCents + unpaidSumCents;
  if (total === 0) return null;

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);

  const data = [
    { name: "Paid", value: paidSumCents / 100, fill: INVOICE_COLORS.paid },
    { name: "Unpaid", value: unpaidSumCents / 100, fill: INVOICE_COLORS.unpaid },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="h-[200px] w-full" aria-label="Paid vs unpaid amounts">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <filter id="pie-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" floodColor="#000" />
            </filter>
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            filter="url(#pie-shadow)"
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={data[i].fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatAmount(Number(value ?? 0) * 100)}
            contentStyle={{
              backgroundColor: "#121821",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
