"use client";

import { Button } from "@/components/ui/button";
import { showErrorToast } from "@/components/ui/form-error-toast";
import { useState } from "react";

type Props = {
  label?: string;
};

export function ConnectStripeButton({ label = "Connect Stripe account" }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const text = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (!res.ok) throw new Error(data.error ?? "Connect failed");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data.error ?? "No redirect URL received");
    } catch (err) {
      console.error(err);
      showErrorToast(err instanceof Error ? err.message : "Connect failed");
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleConnect}
      disabled={loading}
      className="h-10"
    >
      {loading ? "Connecting…" : label}
    </Button>
  );
}
