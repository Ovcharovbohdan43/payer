"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ConnectStripeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : "Connect failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
    <Button
      type="button"
      variant="outline"
      onClick={handleConnect}
      disabled={loading}
      className="h-10"
    >
      {loading ? "Connecting…" : "Connect Stripe account"}
    </Button>
    {error && (
      <p className="text-sm text-destructive">{error}</p>
    )}
    </div>
  );
}
