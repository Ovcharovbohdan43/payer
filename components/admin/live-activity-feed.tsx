"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PlatformActivityRow } from "@/lib/admin/platform-activity";

const CATEGORY_COLORS: Record<string, string> = {
  page: "border-blue-500/30 text-blue-400",
  auth: "border-green-500/30 text-green-400",
  billing: "border-purple-500/30 text-purple-400",
  admin: "border-amber-500/30 text-amber-400",
  system: "border-white/20 text-muted-foreground",
};

type LiveActivityFeedProps = {
  userId?: string;
  pollMs?: number;
  maxHeight?: string;
};

function formatEventLabel(row: PlatformActivityRow): string {
  const meta = row.meta ?? {};
  if (row.action === "view" && row.path) return row.path;
  if (typeof meta.email === "string") return `${row.action} · ${meta.email}`;
  if (typeof meta.publicId === "string") return `${row.action} · ${meta.publicId}`;
  return row.action;
}

export function LiveActivityFeed({
  userId,
  pollMs = 5000,
  maxHeight = "min(70vh, 640px)",
}: LiveActivityFeedProps) {
  const [events, setEvents] = useState<PlatformActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPoll, setLastPoll] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const params = new URLSearchParams({ limit: "80" });
    if (userId) params.set("userId", userId);

    const res = await fetch(`/api/admin/activity-feed?${params}`);
    if (!res.ok) return;
    const data = (await res.json()) as { events: PlatformActivityRow[] };
    setLastPoll(new Date().toISOString());
    setEvents(data.events);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void fetchEvents();
    const interval = setInterval(() => void fetchEvents(), pollMs);
    return () => clearInterval(interval);
  }, [fetchEvents, pollMs]);

  if (loading && events.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading activity…</p>;
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No activity yet. Browse the site or perform admin actions to populate the feed.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Auto-refresh every {pollMs / 1000}s
        {lastPoll ? ` · updated ${new Date(lastPoll).toLocaleTimeString()}` : ""}
      </p>
      <ul
        className="space-y-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/20 p-2"
        style={{ maxHeight }}
      >
        {events.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/[0.03]"
          >
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {new Date(row.created_at).toLocaleTimeString()}
            </span>
            <Badge
              variant="outline"
              className={CATEGORY_COLORS[row.category] ?? CATEGORY_COLORS.system}
            >
              {row.category}
            </Badge>
            <span className="min-w-0 flex-1 truncate text-white">
              {formatEventLabel(row)}
            </span>
            {row.user_id && (
              <Link
                href={`/admin/users/${row.user_id}`}
                className="shrink-0 text-xs text-[#3B82F6] hover:underline"
              >
                user
              </Link>
            )}
            {row.ip_address && (
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {row.ip_address}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
