import { createClient } from "@/lib/supabase/server";
import { getOfferById } from "@/app/offers/actions";
import { getPublicOfferUrl } from "@/lib/offers/utils";
import { formatAmount } from "@/lib/invoices/utils";
import {
  OFFER_STATUS_LABELS,
  type OfferStatus,
} from "@/lib/offers/utils";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OfferDetailClient } from "./offer-detail-client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const offer = await getOfferById(id);
  if (!offer) notFound();

  const status = offer.status as OfferStatus;
  const statusVariant =
    status === "accepted"
      ? "bg-emerald-500/20 text-emerald-400"
      : status === "declined"
        ? "bg-red-500/20 text-red-400"
        : "bg-blue-500/20 text-blue-400";

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/offers"
              className="text-muted-foreground hover:text-foreground"
            >
              ← Offers
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          <div className="min-w-0">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusVariant}`}
            >
              {OFFER_STATUS_LABELS[status] ?? status}
            </span>
            <h1 className="mt-2 text-2xl font-bold tabular-nums sm:mt-3 sm:text-3xl">
              {formatAmount(offer.amount_cents, offer.currency)}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {offer.number} · {offer.client_name}
            </p>
          </div>

          {offer.line_items && offer.line_items.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {offer.line_items.map((item, idx) => {
                const raw = item.amount_cents;
                const dp = item.discount_percent ?? 0;
                const after = Math.round(raw * (1 - dp / 100));
                return (
                  <li key={idx} className="flex justify-between gap-4">
                    <span>{item.description}</span>
                    <span className="tabular-nums">
                      {formatAmount(after, offer.currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {offer.notes && (
            <p className="text-sm text-muted-foreground">Notes: {offer.notes}</p>
          )}

          {status === "declined" && offer.decline_comment && (
            <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
              <h2 className="text-sm font-medium text-red-400">
                Reason for decline
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {offer.decline_comment}
              </p>
            </section>
          )}

          {offer.invoice_id && (
            <section className="rounded-2xl border border-white/5 bg-[#121821]/80 p-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                Invoice
              </h2>
              <Button variant="outline" size="sm" asChild className="mt-2">
                <Link href={`/invoices/${offer.invoice_id}`}>View invoice</Link>
              </Button>
            </section>
          )}

          <OfferDetailClient
            offerId={offer.id}
            publicUrl={getPublicOfferUrl(offer.public_id, BASE_URL)}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}
