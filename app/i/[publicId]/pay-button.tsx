"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { publicId: string };

export function PayButton({ publicId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("No payment link received");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 sm:flex-initial">
      <Button
        onClick={handlePay}
        disabled={loading}
        className="h-12 w-full min-w-[140px] rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB] sm:w-auto"
      >
        {loading ? "Redirecting…" : "Pay"}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
