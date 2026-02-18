import { createClient } from "@/lib/supabase/server";
import { formatAmount, getDisplayAmountCents } from "@/lib/invoices/utils";
import { notFound } from "next/navigation";
import { PayButton } from "./pay-button";
import { DownloadPdfLink } from "./download-pdf-placeholder";
import { InvoiceQrCode } from "@/components/invoice-qr-code";
import { CheckCircle2 } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

export type PublicInvoiceLineItem = {
  description: string;
  amount_cents: number;
};

export type PublicInvoice = {
  business_name: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  due_date: string | null;
  status: string;
  client_name: string;
  vat_included: boolean | null;
  line_items: PublicInvoiceLineItem[];
};

async function getPublicInvoice(publicId: string): Promise<PublicInvoice | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_public_invoice", { p_public_id: publicId })
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicInvoice;
}

/** Record first view (sets viewed_at, status → viewed) when status is sent. Idempotent. */
async function recordViewed(publicId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("record_public_invoice_viewed", { p_public_id: publicId });
}

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { publicId } = await params;
  const { paid: paidParam } = await searchParams;
  let invoice = await getPublicInvoice(publicId);
  if (!invoice) notFound();

  // On first load when status is sent: set viewed_at and status to viewed, then re-fetch for display
  if (invoice.status === "sent") {
    await recordViewed(publicId);
    const updated = await getPublicInvoice(publicId);
    if (updated) invoice = updated;
  }

  const isPaid = invoice.status === "paid";
  const showSuccessScreen = paidParam === "1" || isPaid;

  return (
    <main className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-[20px] border border-white/5 bg-[#121821] p-8 backdrop-blur">
          {showSuccessScreen ? (
            <>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
                </div>
                <h1 className="mt-6 text-2xl font-bold text-white">
                  Payment successful
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Thank you for your payment. Your invoice has been paid.
                </p>
                <div className="mt-6 rounded-xl bg-white/5 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {invoice.business_name}
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {formatAmount(
                      getDisplayAmountCents(
                        Number(invoice.amount_cents),
                        invoice.vat_included
                      ),
                      invoice.currency
                    )}
                  </p>
                </div>
                <div className="mt-8 w-full">
                  <DownloadPdfLink publicId={publicId} fullWidth />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {invoice.business_name}
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tabular-nums">
                    {formatAmount(
                      getDisplayAmountCents(
                        Number(invoice.amount_cents),
                        invoice.vat_included
                      ),
                      invoice.currency
                    )}
                  </h1>
                </div>
                <InvoiceQrCode
                  url={`${BASE_URL}/i/${publicId}`}
                  size={100}
                  label="Scan to pay"
                />
              </div>
              {invoice.line_items?.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {invoice.line_items.map((item, idx) => (
                    <li key={idx} className="flex justify-between gap-2">
                      <span>{item.description}</span>
                      <span className="tabular-nums">
                        {formatAmount(Number(item.amount_cents), invoice.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {invoice.due_date && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Due: {new Date(invoice.due_date).toLocaleDateString("en-US")}
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PayButton publicId={publicId} />
                <DownloadPdfLink publicId={publicId} />
              </div>
            </>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Powered by Payer
          </p>
        </div>
      </div>
    </main>
  );
}
