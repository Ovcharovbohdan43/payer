export type FunnelTrackPayload = {
  action: "cta.clicked";
  cta: "start_free" | "sign_up";
  location: string;
  path?: string;
};

/** Fire-and-forget funnel event (CTA clicks). Safe for anonymous visitors. */
export function trackFunnelEvent(payload: FunnelTrackPayload): void {
  if (typeof window === "undefined") return;

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      path: payload.path ?? window.location.pathname,
    }),
    keepalive: true,
  }).catch(() => {
    /* non-blocking */
  });
}
