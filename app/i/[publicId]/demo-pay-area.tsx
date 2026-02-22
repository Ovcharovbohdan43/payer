"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowRight, Link2, Home } from "lucide-react";
import { InvoiceQrCode } from "@/components/invoice-qr-code";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

type Props = { publicId: string };

export function DemoPayArea({ publicId }: Props) {
  const [copyDone, setCopyDone] = useState(false);
  const pageUrl = `${BASE_URL.replace(/\/$/, "")}/i/${publicId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            When your client visits this page, they can pay directly here via
            card or QR.
          </p>
          <p className="mt-1 text-sm font-medium text-amber-400/90">
            This is demo mode — no real payments.
          </p>
        </div>
        <InvoiceQrCode
          url={pageUrl}
          size={100}
          label="Scan to view"
        />
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={handleCopyLink}
          className="h-12 min-w-[140px] rounded-xl border-white/10"
        >
          <Link2 className="mr-2 h-4 w-4" />
          {copyDone ? "Copied!" : "Copy link"}
        </Button>
        <Button asChild variant="outline" className="h-12 min-w-[140px] rounded-xl border-white/10">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-center text-sm text-amber-200/90">
          Create an account to accept real payments from your clients.
        </p>
        <div className="mt-3 flex justify-center">
          <Button asChild className="h-11 rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]">
            <Link href="/register" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Sign up to enable payments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
