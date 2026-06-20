"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const ERROR_TOAST_DURATION_MS = 7000;
const ERROR_TOAST_ID = "app-form-error";

/** Show a red error toast in the top-right corner (replaces the previous form error). */
export function showErrorToast(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return;
  toast.error(trimmed, { duration: ERROR_TOAST_DURATION_MS, id: ERROR_TOAST_ID });
}

type ActionState = { error?: string } | null | undefined;

type Props = {
  /** Full useActionState value — required so repeated submits re-show the same error. */
  state?: ActionState;
  /** Legacy: pass only the error string (may not re-toast on repeat submit). */
  error?: string | null;
};

function resolveError(state?: ActionState, error?: string | null): string | null {
  if (state && "error" in state && state.error?.trim()) {
    return state.error.trim();
  }
  if (error?.trim()) return error.trim();
  return null;
}

/** Renders nothing; shows action errors as a toast when state updates. */
export function FormErrorToast({ state, error }: Props) {
  useEffect(() => {
    const msg = resolveError(state, error);
    if (!msg) return;
    showErrorToast(msg);
  }, [state, error]);

  return null;
}
