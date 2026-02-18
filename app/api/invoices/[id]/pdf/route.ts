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
    .select("business_name")
    .eq("id", user.id)
    .single();

  const lineItems =
    invoice.line_items?.map((i) => ({
      description: i.description,
      amountCents: i.amount_cents,
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
    status: invoice.status,
    createdAt: invoice.created_at,
    notes: invoice.notes,
    vatIncluded: invoice.vat_included ?? undefined,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
    },
  });
}
