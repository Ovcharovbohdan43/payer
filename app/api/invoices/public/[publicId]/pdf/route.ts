import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { NextResponse } from "next/server";

async function getPublicInvoice(publicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_public_invoice", { p_public_id: publicId })
    .maybeSingle();
  if (error || !data) return null;
  return data as {
    business_name: string;
    invoice_number: string;
    amount_cents: number;
    currency: string;
    description: string | null;
    due_date: string | null;
    status: string;
    client_name: string;
  };
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

  const pdfBytes = await generateInvoicePdf({
    businessName: invoice.business_name,
    invoiceNumber: invoice.invoice_number,
    amountCents: Number(invoice.amount_cents),
    currency: invoice.currency,
    description: invoice.description,
    dueDate: invoice.due_date,
    clientName: invoice.client_name,
    status: invoice.status,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  });
}
