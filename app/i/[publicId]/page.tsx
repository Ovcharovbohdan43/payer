import { createClient } from "@/lib/supabase/server";
import { formatAmount } from "@/lib/invoices/utils";
import { notFound } from "next/navigation";
import { PayButton } from "./pay-button";
import { DownloadPdfPlaceholder } from "./download-pdf-placeholder";

export type PublicInvoice = {
  business_name: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  description: string | null;
  due_date: string | null;
  status: string;
  client_name: string;
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
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  let invoice = await getPublicInvoice(publicId);
  if (!invoice) notFound();

  // On first load when status is sent: set viewed_at and status to viewed, then re-fetch for display
  if (invoice.status === "sent") {
    await recordViewed(publicId);
    const updated = await getPublicInvoice(publicId);
    if (updated) invoice = updated;
  }

  const isPaid = invoice.status === "paid";

  return (
    <main className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-[20px] border border-white/5 bg-[#121821] p-8 backdrop-blur">
          <p className="text-sm font-medium text-muted-foreground">
            {invoice.business_name}
          </p>
          <h1 className="mt-2 text-3xl font-bold tabular-nums">
            {formatAmount(invoice.amount_cents, invoice.currency)}
          </h1>
          {invoice.description && (
            <p className="mt-3 text-sm text-muted-foreground">
              {invoice.description}
            </p>
          )}
          {invoice.due_date && (
            <p className="mt-1 text-sm text-muted-foreground">
              Due: {new Date(invoice.due_date).toLocaleDateString("en-US")}
            </p>
          )}

          {!isPaid && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PayButton publicId={publicId} />
              <DownloadPdfPlaceholder />
            </div>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Powered by Payer
          </p>
        </div>
      </div>
    </main>
  );
}
