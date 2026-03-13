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
import type { PayoutByPeriod } from "@/lib/dashboard/analytics";

type PayoutsChartProps = {
  data: PayoutByPeriod[];
  currency: string;
};

export function PayoutsChart({ data, currency }: PayoutsChartProps) {
  if (data.length === 0 || data.every((d) => d.amount === 0)) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-lg bg-white/[0.02] text-sm text-muted-foreground">
        No payouts yet
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
    <div className="h-[240px] w-full" aria-label="Payouts by week">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <filter id="payout-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.2" floodColor="#8B5CF6" />
            </filter>
            <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
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
                  <p className="text-sm font-semibold text-[#8B5CF6]">
                    {formatValue(payload[0].value as number)}
                  </p>
                </div>
              );
            }}
            cursor={{ stroke: "rgba(139,92,246,0.3)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#8B5CF6"
            strokeWidth={2}
            fill="url(#payoutGradient)"
            filter="url(#payout-shadow)"
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
