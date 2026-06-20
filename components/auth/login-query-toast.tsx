"use client";

import { useEffect } from "react";
import { showErrorToast } from "@/components/ui/form-error-toast";

type Props = {
  queryError?: string;
};

export function LoginQueryToast({ queryError }: Props) {
  useEffect(() => {
    if (queryError === "link_invalid") {
      showErrorToast(
        "That sign-in link is invalid or has expired. Try again below or sign in with password."
      );
    }
  }, [queryError]);

  return null;
}
