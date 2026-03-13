"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { RevenueByWeek } from "@/lib/dashboard/analytics";

type RevenueChartProps = {
  data: RevenueByWeek[];
  currency: string;
};

export function RevenueChart({ data, currency }: RevenueChartProps) {
  if (data.length === 0 || data.every((d) => d.revenue === 0)) {
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
    <div className="h-[260px] w-full" aria-label="Revenue by week">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <filter id="revenue-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.2" floodColor="#3B82F6" />
            </filter>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
            </linearGradient>
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
              if (!active || !payload?.[0]) return null;
              return (
                <div className="rounded-lg border border-white/10 bg-[#121821] px-3 py-2 shadow-xl">
                  <p className="text-xs text-muted-foreground">{payload[0].payload.label}</p>
                  <p className="text-sm font-semibold text-[#3B82F6]">
                    {formatValue(payload[0].value as number)}
                  </p>
                </div>
              );
            }}
            cursor={{ stroke: "rgba(59,130,246,0.3)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            filter="url(#revenue-shadow)"
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
