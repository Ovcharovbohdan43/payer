"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const ERROR_TOAST_DURATION_MS = 7000;

/** Show a red error toast in the top-right corner. */
export function showErrorToast(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return;
  toast.error(trimmed, { duration: ERROR_TOAST_DURATION_MS });
}

type Props = {
  error?: string | null;
};

/** Renders nothing; shows `error` as a toast when it changes. */
export function FormErrorToast({ error }: Props) {
  const lastShown = useRef<string | null>(null);

  useEffect(() => {
    const msg = error?.trim();
    if (!msg) {
      lastShown.current = null;
      return;
    }
    if (lastShown.current === msg) return;
    lastShown.current = msg;
    showErrorToast(msg);
  }, [error]);

  return null;
}
