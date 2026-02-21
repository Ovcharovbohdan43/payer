"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { acceptOfferAction, declineOfferAction } from "@/app/offers/actions";
import { CheckCircle2, XCircle } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

type Props = {
  publicId: string;
  status: string;
  invoicePublicId: string | null;
};

export function OfferActions({
  publicId,
  status,
  invoicePublicId,
}: Props) {
  const [pending, setPending] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineComment, setDeclineComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canAcceptOrDecline = status === "sent" || status === "viewed";
  const isAccepted = status === "accepted";
  const isDeclined = status === "declined";

  async function handleAccept() {
    setPending(true);
    setError(null);
    try {
      const r = await acceptOfferAction(publicId);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      if (r.invoicePublicId) {
        window.location.href = `${BASE_URL}/i/${r.invoicePublicId}`;
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setPending(false);
    }
  }

  async function handleDecline(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const r = await declineOfferAction(publicId, declineComment);
      if ("error" in r && r.error) {
        setError(r.error);
        return;
      }
      window.location.reload();
    } catch {
      setError("Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (isDeclined) {
    return (
      <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm font-medium text-red-400">Offer declined</p>
      </div>
    );
  }

  if (isAccepted && invoicePublicId) {
    return (
      <div className="mt-8 flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <p className="text-sm font-medium text-emerald-400">Offer accepted</p>
        </div>
        <Button asChild className="h-12 rounded-xl bg-[#3B82F6] font-semibold hover:bg-[#2563EB]">
          <Link href={`/i/${invoicePublicId}`}>Pay now</Link>
        </Button>
      </div>
    );
  }

  if (!canAcceptOrDecline) {
    return null;
  }

  if (showDeclineForm) {
    return (
      <form onSubmit={handleDecline} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="decline-comment"
            className="mb-2 block text-sm font-medium text-muted-foreground"
          >
            Reason for declining (optional)
          </label>
          <textarea
            id="decline-comment"
            rows={3}
            value={declineComment}
            onChange={(e) => setDeclineComment(e.target.value)}
            placeholder="Let the provider know why you are declining..."
            disabled={pending}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="destructive"
            disabled={pending}
            className="h-10 gap-2"
          >
            <XCircle className="size-4" />
            {pending ? "Sending…" : "Send decline"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setShowDeclineForm(false);
              setError(null);
            }}
          >
            Cancel
          </Button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Button
        onClick={handleAccept}
        disabled={pending}
        className="h-12 flex-1 gap-2 rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-500 sm:min-w-[140px]"
      >
        <CheckCircle2 className="size-5" />
        {pending ? "Processing…" : "Accept offer"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowDeclineForm(true)}
        disabled={pending}
        className="h-12 flex-1 gap-2 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 sm:min-w-[140px]"
      >
        <XCircle className="size-5" />
        Decline
      </Button>
      {error && (
        <p className="w-full text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
