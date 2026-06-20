"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type Props = {
  stripeConnectReturn?: string | null;
};

export function SettingsStripeReturnToast({ stripeConnectReturn }: Props) {
  useEffect(() => {
    if (stripeConnectReturn === "refresh") {
      toast.warning("Stripe setup was not finished. You can continue anytime from Settings.", {
        duration: 9000,
      });
    } else if (stripeConnectReturn === "success") {
      toast.info("Thanks — we are checking your Stripe account status.", {
        duration: 7000,
      });
    }
  }, [stripeConnectReturn]);

  return null;
}
