"use client";

import { cn } from "@/lib/utils";

type ChartCardProps = {
  id?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function ChartCard({ id, title, children, className }: ChartCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur sm:p-6",
        className
      )}
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
        {title}
      </h2>
      {children}
    </section>
  );
}
