"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { markOfferSentAction } from "@/app/offers/actions";
import type { OfferStatus } from "@/lib/offers/utils";
import { useTransition, useState } from "react";
import { Link2 } from "lucide-react";

type Props = {
  offerId: string;
  publicUrl: string;
  status: OfferStatus;
};

export function OfferDetailClient({
  offerId,
  publicUrl,
  status,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [copyDone, setCopyDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyDone(true);
      setError(null);
      if (status === "draft") {
        startTransition(async () => {
          await markOfferSentAction(offerId);
        });
      }
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setError("Could not copy");
    }
  };

  const btnClass =
    "min-h-10 touch-manipulation gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm font-medium transition-colors hover:bg-white/8 hover:border-white/15";

  const canCopy = status === "draft" || status === "sent" || status === "viewed";

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#121821]/90 p-5 backdrop-blur sm:p-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
        Actions
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        {canCopy && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={btnClass}
            onClick={handleCopyLink}
            disabled={pending}
          >
            <Link2 className="size-4 shrink-0" />
            {copyDone ? "Copied!" : "Copy link"}
          </Button>
        )}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}
    </section>
  );
}
