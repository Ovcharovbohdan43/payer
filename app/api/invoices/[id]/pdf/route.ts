import { createClient } from "@/lib/supabase/server";
import { getInvoiceById } from "@/app/invoices/actions";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await getInvoiceById(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, logo_url, address, phone, company_number, vat_number")
    .eq("id", user.id)
    .single();

  let clientData: {
    address?: string | null;
    phone?: string | null;
    company_name?: string | null;
    vat_number?: string | null;
  } = {};
  const clientId = (invoice as { client_id?: string }).client_id;
  const clientEmail = (invoice.client_email ?? "").trim();

  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("address, phone, company_name, vat_number")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .single();
    if (client) clientData = client;
  } else if (clientEmail) {
    // Fallback: match by email when invoice has no client_id (e.g. from offer, manual)
    const { data: client } = await supabase
      .from("clients")
      .select("address, phone, company_name, vat_number")
      .eq("user_id", user.id)
      .eq("email", clientEmail)
      .limit(1)
      .maybeSingle();
    if (client) clientData = client;
  }

  const lineItems =
    invoice.line_items?.map((i) => ({
      description: i.description,
      amountCents: Number(i.amount_cents),
    })) ?? [];

  const pdfBytes = await generateInvoicePdf({
    businessName: profile?.business_name ?? "Business",
    invoiceNumber: invoice.number,
    amountCents: Number(invoice.amount_cents),
    currency: invoice.currency,
    lineItems,
    dueDate: invoice.due_date,
    clientName: invoice.client_name,
    clientEmail: invoice.client_email,
    clientAddress: clientData.address ?? undefined,
    clientPhone: clientData.phone ?? undefined,
    clientCompanyName: clientData.company_name ?? undefined,
    clientVatNumber: clientData.vat_number ?? undefined,
    status: invoice.status,
    createdAt: invoice.created_at,
    notes: invoice.notes,
    vatIncluded: invoice.vat_included ?? undefined,
    paymentProcessingFeeCents: invoice.payment_processing_fee_cents ?? undefined,
    logoUrl: profile?.logo_url ?? undefined,
    address: profile?.address ?? undefined,
    phone: profile?.phone ?? undefined,
    companyNumber: profile?.company_number ?? undefined,
    vatNumber: profile?.vat_number ?? undefined,
    discountType:
      (invoice as { discount_type?: string }).discount_type as "percent" | "fixed" | undefined,
    discountValue:
      (invoice as { discount_value?: number }).discount_value != null
        ? Number((invoice as { discount_value?: number }).discount_value)
        : undefined,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
    },
  });
}
