"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Mail,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type GoogleCalendarConnection = { id: string; created_at: string } | null;

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Schedule in Google Calendar",
    description:
      "Add client sessions, calls, or appointments to your calendar as you normally would.",
  },
  {
    step: "2",
    title: "Session ends",
    description:
      "When the event finishes, Puyer detects it on your primary calendar (read-only access).",
  },
  {
    step: "3",
    title: "Get a gentle nudge",
    description:
      "About 15 minutes later you receive an email: “Session ended — issue an invoice?” with a one-click link to create the invoice.",
  },
] as const;

type GoogleCalendarIntegrationProps = {
  connection: GoogleCalendarConnection;
  integrationSuccess?: boolean;
  integrationError?: boolean;
  onDisconnect?: () => void;
  /** Compact layout for settings; full for marketing sections */
  variant?: "settings" | "marketing";
};

export function GoogleCalendarIntegration({
  connection,
  integrationSuccess = false,
  integrationError = false,
  onDisconnect,
  variant = "settings",
}: GoogleCalendarIntegrationProps) {
  const [disconnecting, setDisconnecting] = useState(false);
  const isConnected = !!connection;

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/calendar/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google_calendar" }),
      });
      if (res.ok) onDisconnect?.();
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div
      className={
        variant === "marketing"
          ? "rounded-[20px] border border-[#3B82F6]/20 bg-gradient-to-br from-[#121821] via-[#121821]/95 to-[#0B0F14] p-6 sm:p-8"
          : "rounded-xl border border-white/5 bg-[#0B0F14]/40 p-4 sm:p-5"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
            <Calendar className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-white sm:text-lg">
                Google Calendar
              </h3>
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 px-2 py-0 text-[10px] font-semibold uppercase tracking-wide text-amber-400"
              >
                Beta
              </Badge>
            </div>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Never forget to bill after a session. Puyer watches your calendar and
              reminds you to issue an invoice when a meeting ends.
            </p>
          </div>
        </div>
      </div>

      {integrationSuccess && (
        <p className="mt-4 flex items-center gap-2 text-sm text-emerald-500">
          <CheckCircle2 className="size-4 shrink-0" />
          Google Calendar connected successfully.
        </p>
      )}
      {integrationError && (
        <p className="mt-4 text-sm text-amber-500">
          Connection failed. Please try again or contact{" "}
          <a href="mailto:support@puyer.org" className="underline hover:text-amber-400">
            support@puyer.org
          </a>
          .
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {HOW_IT_WORKS.map((item) => (
          <div
            key={item.step}
            className="rounded-lg border border-white/5 bg-[#121821]/60 px-3 py-3 sm:px-4"
          >
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#3B82F6]/15 text-xs font-bold text-[#3B82F6]">
              {item.step}
            </span>
            <p className="mt-2 text-sm font-medium text-white">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="size-3.5 shrink-0 text-[#3B82F6]/80" />
          Read-only access — we never edit your calendar
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Mail className="size-3.5 shrink-0 text-[#3B82F6]/80" />
          One reminder email per session
        </span>
        {variant === "marketing" && (
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5 shrink-0 text-[#3B82F6]/80" />
            Available in Settings → Integrations
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/5 pt-5">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-500">
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
              Connected
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disconnecting}
              onClick={handleDisconnect}
              className="rounded-lg"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </Button>
          </>
        ) : variant === "settings" ? (
          <a
            href="/api/integrations/calendar/auth/google"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#3B82F6] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2563EB]"
          >
            Connect Google Calendar
          </a>
        ) : (
          <Button asChild size="sm" className="rounded-lg bg-[#3B82F6] hover:bg-[#2563EB]">
            <Link href="/settings#integrations">Connect in Settings</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
