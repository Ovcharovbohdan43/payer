"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { RevenueByWeek } from "@/lib/dashboard/analytics";

type RevenueChartProps = {
  data: RevenueByWeek[];
  currency: string;
};

export function RevenueChart({ data, currency }: RevenueChartProps) {
  const hasRevenue = data.some((d) => d.revenue > 0);
  const hasExpected = data.some((d) => d.expected > 0);
  if (data.length === 0 || (!hasRevenue && !hasExpected)) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg bg-white/[0.02] text-sm text-muted-foreground">
        No revenue data yet
      </div>
    );
  }

  const formatValue = (v: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <div className="h-[260px] w-full" aria-label="Revenue and expected by week">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <filter id="revenue-bar-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.2" floodColor="#3B82F6" />
            </filter>
            <filter id="expected-bar-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.2" floodColor="#F59E0B" />
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatValue(v)}
            width={50}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]?.payload as RevenueByWeek;
              return (
                <div className="rounded-lg border border-white/10 bg-[#121821] px-3 py-2 shadow-xl">
                  <p className="text-xs text-muted-foreground">{p.label}</p>
                  <p className="text-sm font-semibold text-[#3B82F6]">
                    Paid: {formatValue(p.revenue)}
                  </p>
                  <p className="text-sm font-semibold text-[#F59E0B]">
                    Expected: {formatValue(p.expected)}
                  </p>
                </div>
              );
            }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (value === "revenue" ? "Paid" : "Expected")}
            iconType="square"
            iconSize={10}
          />
          <Bar
            dataKey="revenue"
            name="revenue"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            filter="url(#revenue-bar-shadow)"
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="expected"
            name="expected"
            fill="#F59E0B"
            radius={[4, 4, 0, 0]}
            filter="url(#expected-bar-shadow)"
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
