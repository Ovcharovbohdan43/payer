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
  client_email: string | null;
  client_address: string | null;
  client_phone: string | null;
  client_company_name: string | null;
  client_vat_number: string | null;
  vat_included: boolean | null;
  payment_processing_fee_included: boolean;
  payment_processing_fee_cents: number | null;
  line_items: { description: string; amount_cents: number; discount_percent?: number }[];
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  company_number: string | null;
  vat_number: string | null;
  discount_type: string | null;
  discount_value: number | null;
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

  const lineItems = (invoice.line_items ?? []).map(
    (i: { description: string; amount_cents: number; discount_percent?: number }) => {
      const raw = Number(i.amount_cents);
      const dp = Number(i.discount_percent ?? 0);
      const afterDiscount = Math.round(raw * (1 - dp / 100));
      return { description: i.description, amountCents: afterDiscount };
    }
  );

  const pdfBytes = await generateInvoicePdf({
    businessName: invoice.business_name,
    invoiceNumber: invoice.invoice_number,
    amountCents: Number(invoice.amount_cents),
    currency: invoice.currency,
    lineItems,
    dueDate: invoice.due_date,
    clientName: invoice.client_name,
    clientEmail: invoice.client_email ?? undefined,
    clientAddress: invoice.client_address ?? undefined,
    clientPhone: invoice.client_phone ?? undefined,
    clientCompanyName: invoice.client_company_name ?? undefined,
    clientVatNumber: invoice.client_vat_number ?? undefined,
    status: invoice.status,
    vatIncluded: invoice.vat_included ?? undefined,
    paymentProcessingFeeCents: invoice.payment_processing_fee_cents ?? undefined,
    logoUrl: invoice.logo_url ?? undefined,
    address: invoice.address ?? undefined,
    phone: invoice.phone ?? undefined,
    companyNumber: invoice.company_number ?? undefined,
    vatNumber: invoice.vat_number ?? undefined,
    discountType:
      invoice.discount_type === "percent" || invoice.discount_type === "fixed"
        ? invoice.discount_type
        : undefined,
    discountValue:
      invoice.discount_value != null ? Number(invoice.discount_value) : undefined,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  });
}
