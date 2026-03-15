import { createClient } from "@/lib/supabase/server";
import { formatAmount, getDisplayAmountCents } from "@/lib/invoices/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PayButton } from "./pay-button";
import { DownloadPdfLink } from "./download-pdf-placeholder";
import { InvoiceQrCode } from "@/components/invoice-qr-code";
import { DemoPayArea } from "./demo-pay-area";
import { CheckCircle2 } from "lucide-react";
import { PublicLogo } from "@/components/public-logo";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://puyer.org";

export type PublicInvoiceLineItem = {
  description: string;
  amount_cents: number;
  discount_percent?: number;
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
  /** When true, amount_cents includes payment processing fee; show fee row. */
  payment_processing_fee_included?: boolean | null;
  payment_processing_fee_cents?: number | null;
  /** Company logo URL; shown in header */
  logo_url?: string | null;
  /** Business address; shown under business name */
  address?: string | null;
  phone?: string | null;
  company_number?: string | null;
  vat_number?: string | null;
};

async function getPublicInvoice(publicId: string): Promise<PublicInvoice | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_public_invoice", { p_public_id: publicId })
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicInvoice;
}

async function getDemoPublicInvoice(
  publicId: string
): Promise<PublicInvoice | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_demo_public_invoice", { p_public_id: publicId })
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicInvoice;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  let invoice = await getPublicInvoice(publicId);
  if (!invoice) invoice = await getDemoPublicInvoice(publicId);
  if (!invoice) return { title: "Invoice" };
  const amount = formatAmount(
    getDisplayAmountCents(Number(invoice.amount_cents), invoice.vat_included),
    invoice.currency
  );
  return {
    title: `Invoice ${invoice.invoice_number} — ${amount}`,
    description: `${invoice.business_name} — Invoice for ${invoice.client_name}`,
    robots: { index: false, follow: false },
  };
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
  let isDemo = false;
  if (!invoice) {
    invoice = await getDemoPublicInvoice(publicId);
    isDemo = !!invoice;
  }
  if (!invoice) notFound();

  // On first load when status is sent: set viewed_at and status to viewed (real invoices only)
  if (!isDemo && invoice.status === "sent") {
    await recordViewed(publicId);
    const updated = await getPublicInvoice(publicId);
    if (updated) invoice = updated;
  }

  const isPaid = invoice.status === "paid";
  const showSuccessScreen = !isDemo && (paidParam === "1" || isPaid);

  const contactLines: string[] = [];
    if (invoice.address?.trim()) contactLines.push(invoice.address.trim());
    if (invoice.phone?.trim()) contactLines.push(invoice.phone.trim());
    if (invoice.company_number?.trim())
      contactLines.push(`Company no: ${invoice.company_number.trim()}`);
    if (invoice.vat_number?.trim())
      contactLines.push(`VAT: ${invoice.vat_number.trim()}`);

  return (
    <main className="min-h-screen bg-[#0B0F14]">
      {isDemo && (
        <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0B0F14]/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-400/90">
              Demo mode
            </span>
            <Link
              href="/"
              className="text-sm font-medium text-[#3B82F6] hover:text-blue-400"
            >
              Back to home
            </Link>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-[20px] border border-white/5 bg-[#121821] p-8 backdrop-blur">
          {/* Header: logo + business name + contact info */}
          <div className="mb-8 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <PublicLogo
                logoUrl={invoice.logo_url ?? ""}
                businessName={invoice.business_name}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-white">
                  {invoice.business_name}
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
          ) : isDemo ? (
            <>
              <div>
                <h1 className="text-3xl font-bold tabular-nums">
                  {formatAmount(
                    getDisplayAmountCents(
                      Number(invoice.amount_cents),
                      invoice.vat_included
                    ),
                    invoice.currency
                  )}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Invoice {invoice.invoice_number}
                </p>
              </div>
              {invoice.line_items?.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {invoice.line_items.map((item, idx) => {
                    const raw = Number(item.amount_cents);
                    const dp = Number((item as { discount_percent?: number }).discount_percent ?? 0);
                    const amountAfterDiscount = Math.round(raw * (1 - dp / 100));
                    return (
                      <li key={idx} className="flex justify-between gap-2">
                        <span>{item.description}</span>
                        <span className="tabular-nums">
                          {formatAmount(amountAfterDiscount, invoice.currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {invoice.due_date && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Due: {new Date(invoice.due_date).toLocaleDateString("en-US")}
                </p>
              )}

              <div className="mt-8">
                <DemoPayArea publicId={publicId} />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                    Total to pay
                  </p>
                  <h1 className="text-3xl font-bold tabular-nums">
                    {formatAmount(
                      getDisplayAmountCents(
                        Number(invoice.amount_cents),
                        invoice.vat_included
                      ),
                      invoice.currency
                    )}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Invoice {invoice.invoice_number}
                  </p>
                </div>
                <InvoiceQrCode
                  url={`${BASE_URL}/i/${publicId}`}
                  size={100}
                  label="Scan to pay"
                />
              </div>
              {invoice.line_items?.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {invoice.line_items.map((item, idx) => {
                    const raw = Number(item.amount_cents);
                    const dp = Number((item as { discount_percent?: number }).discount_percent ?? 0);
                    const amountAfterDiscount = Math.round(raw * (1 - dp / 100));
                    return (
                      <li key={idx} className="flex justify-between gap-2">
                        <span>{item.description}</span>
                        <span className="tabular-nums">
                          {formatAmount(amountAfterDiscount, invoice.currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {/* Breakdown: fee and total so client sees full amount before checkout */}
              <div className="mt-3 border-t border-white/10 pt-3 text-sm">
                {invoice.payment_processing_fee_included &&
                  typeof invoice.payment_processing_fee_cents === "number" &&
                  invoice.payment_processing_fee_cents > 0 && (
                    <div className="flex justify-between gap-2 text-muted-foreground">
                      <span>Payment processing fee</span>
                      <span className="tabular-nums">
                        {formatAmount(
                          Number(invoice.payment_processing_fee_cents),
                          invoice.currency
                        )}
                      </span>
                    </div>
                  )}
                <div className="mt-2 flex justify-between gap-2 font-semibold text-white">
                  <span>Total to pay</span>
                  <span className="tabular-nums">
                    {formatAmount(
                      getDisplayAmountCents(
                        Number(invoice.amount_cents),
                        invoice.vat_included
                      ),
                      invoice.currency
                    )}
                  </span>
                </div>
              </div>
              {invoice.due_date && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Due: {new Date(invoice.due_date).toLocaleDateString("en-US")}
                </p>
              )}

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <PayButton publicId={publicId} />
                <DownloadPdfLink publicId={publicId} />
              </div>
            </>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Powered by Puyer
          </p>
        </div>
      </div>
    </main>
  );
}
