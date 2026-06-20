"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showErrorToast } from "@/components/ui/form-error-toast";

type Props = {
  publicId: string;
  accentColor?: string;
  buttonStyle?: "filled" | "outline";
};

export function PayButton({ publicId, accentColor = "#3B82F6", buttonStyle = "filled" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showErrorToast(data.error ?? "Something went wrong");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      showErrorToast("No payment link received");
    } catch {
      showErrorToast("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 sm:flex-initial">
      <Button
        onClick={handlePay}
        disabled={loading}
        className="h-12 w-full min-w-[140px] rounded-xl font-semibold sm:w-auto"
        style={
          buttonStyle === "outline"
            ? {
                backgroundColor: "transparent",
                color: accentColor,
                border: `1px solid ${accentColor}`,
              }
            : {
                backgroundColor: accentColor,
                color: "#FFFFFF",
                border: `1px solid ${accentColor}`,
              }
        }
      >
        {loading ? "Redirecting…" : "Pay"}
      </Button>
    </div>
  );
}
