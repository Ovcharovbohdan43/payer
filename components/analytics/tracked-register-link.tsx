"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackFunnelEvent } from "@/lib/analytics/track-funnel-event";

type TrackedRegisterLinkProps = ComponentProps<typeof Link> & {
  cta: "start_free" | "sign_up";
  location: string;
};

export function TrackedRegisterLink({
  cta,
  location,
  onClick,
  ...props
}: TrackedRegisterLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackFunnelEvent({ action: "cta.clicked", cta, location });
        onClick?.(event);
      }}
    />
  );
}
