import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { NextResponse } from "next/server";

type PublicInvoiceRpc = {
  business_name: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  due_date: string | null;
  status: string;
  client_name: string;
  vat_included: boolean | null;
  payment_processing_fee_included: boolean;
  payment_processing_fee_cents: number | null;
  line_items: { description: string; amount_cents: number }[];
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  company_number: string | null;
  vat_number: string | null;
};

async function getPublicInvoice(publicId: string): Promise<PublicInvoiceRpc | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_public_invoice", { p_public_id: publicId })
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicInvoiceRpc;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;
  const invoice = await getPublicInvoice(publicId);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const lineItems = (invoice.line_items ?? []).map((i: { description: string; amount_cents: number }) => ({
    description: i.description,
    amountCents: Number(i.amount_cents),
  }));

  const pdfBytes = await generateInvoicePdf({
    businessName: invoice.business_name,
    invoiceNumber: invoice.invoice_number,
    amountCents: Number(invoice.amount_cents),
    currency: invoice.currency,
    lineItems,
    dueDate: invoice.due_date,
    clientName: invoice.client_name,
    status: invoice.status,
    vatIncluded: invoice.vat_included ?? undefined,
    paymentProcessingFeeCents: invoice.payment_processing_fee_cents ?? undefined,
    logoUrl: invoice.logo_url ?? undefined,
    address: invoice.address ?? undefined,
    phone: invoice.phone ?? undefined,
    companyNumber: invoice.company_number ?? undefined,
    vatNumber: invoice.vat_number ?? undefined,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  });
}
