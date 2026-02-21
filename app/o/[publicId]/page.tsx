import { createClient } from "@/lib/supabase/server";
import { formatAmount, getDisplayAmountCents } from "@/lib/invoices/utils";
import { notFound } from "next/navigation";
import { OfferActions } from "./offer-actions";

async function getPublicOffer(
  publicId: string
): Promise<PublicOffer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_public_offer", { p_public_id: publicId })
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicOffer;
}

async function recordOfferViewed(publicId: string) {
  const supabase = await createClient();
  await supabase.rpc("record_public_offer_viewed", { p_public_id: publicId });
}

export type PublicOfferLineItem = {
  description: string;
  amount_cents: number;
  discount_percent?: number;
};

export type PublicOffer = {
  business_name: string;
  offer_number: string;
  amount_cents: number;
  currency: string;
  due_date: string | null;
  status: string;
  client_name: string;
  vat_included: boolean | null;
  line_items: PublicOfferLineItem[];
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  company_number?: string | null;
  vat_number?: string | null;
  invoice_public_id?: string | null;
};

export default async function PublicOfferPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  let offer = await getPublicOffer(publicId);
  if (!offer) notFound();

  if (offer.status === "sent") {
    await recordOfferViewed(publicId);
    const updated = await getPublicOffer(publicId);
    if (updated) offer = updated;
  }

  const typedOffer = offer;
  const contactLines: string[] = [];
  if (typedOffer.address?.trim()) contactLines.push(typedOffer.address.trim());
  if (typedOffer.phone?.trim()) contactLines.push(typedOffer.phone.trim());
  if (typedOffer.company_number?.trim())
    contactLines.push(`Company no: ${typedOffer.company_number.trim()}`);
  if (typedOffer.vat_number?.trim())
    contactLines.push(`VAT: ${typedOffer.vat_number.trim()}`);

  const isAccepted = typedOffer.status === "accepted";

  return (
    <main className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-[20px] border border-white/5 bg-[#121821] p-8 backdrop-blur">
          <div className="mb-8 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              {typedOffer.logo_url ? (
                <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  <img
                    src={typedOffer.logo_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-white">
                  {typedOffer.business_name}
                </p>
                {contactLines.length > 0 ? (
                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {contactLines.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Offer
          </p>
          <h1 className="mt-1 text-3xl font-bold tabular-nums">
            {formatAmount(
              getDisplayAmountCents(
                Number(typedOffer.amount_cents),
                typedOffer.vat_included
              ),
              typedOffer.currency
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {typedOffer.offer_number}
          </p>

          {typedOffer.line_items?.length ? (
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {typedOffer.line_items.map((item, idx) => {
                const raw = Number(item.amount_cents);
                const dp = Number(item.discount_percent ?? 0);
                const afterDiscount = Math.round(raw * (1 - dp / 100));
                return (
                  <li key={idx} className="flex justify-between gap-2">
                    <span>{item.description}</span>
                    <span className="tabular-nums">
                      {formatAmount(afterDiscount, typedOffer.currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {typedOffer.due_date && (
            <p className="mt-2 text-sm text-muted-foreground">
              Valid until: {new Date(typedOffer.due_date).toLocaleDateString("en-US")}
            </p>
          )}

          <OfferActions
            publicId={publicId}
            status={typedOffer.status}
            invoicePublicId={typedOffer.invoice_public_id ?? null}
          />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Powered by Puyer
          </p>
        </div>
      </div>
    </main>
  );
}
