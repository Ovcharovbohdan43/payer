"use client";

import { CLARITY_PROJECT_ID } from "@/lib/analytics/clarity-project-id";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export function MicrosoftClarityPageViews() {
  const pathname = usePathname();

  useEffect(() => {
    if (!CLARITY_PROJECT_ID) return;

    window.clarity?.("set", "page", pathname);
  }, [pathname]);

  return null;
}
