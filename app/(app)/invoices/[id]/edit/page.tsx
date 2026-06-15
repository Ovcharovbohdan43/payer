import { createClient } from "@/lib/supabase/server";
import { getInvoiceForEdit } from "@/app/invoices/actions";
import { listClients } from "@/app/clients/actions";
import { listInvoiceVisualTemplates } from "@/app/invoices/visual-template-actions";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditInvoiceForm } from "./edit-invoice-form";

export default async function EditInvoicePage({
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

  const [invoice, clients, visualTemplates, profile] = await Promise.all([
    getInvoiceForEdit(id),
    listClients(),
    listInvoiceVisualTemplates(),
    supabase
      .from("profiles")
      .select("business_name, logo_url, address, phone, company_number, vat_number")
      .eq("id", user.id)
      .single(),
  ]);

  if (!invoice) notFound();

  const status = invoice.status as string;
  if (status === "paid" || status === "void") {
    redirect(`/invoices/${id}`);
  }

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/invoices/${id}`} className="text-muted-foreground hover:text-foreground">
              ← Back to invoice
            </Link>
          </Button>
        </div>
        <h1 className="mb-6 text-2xl font-bold">Edit invoice {invoice.number}</h1>
        <EditInvoiceForm
          invoice={invoice}
          clients={clients}
          defaultCurrency={invoice.currency}
          businessName={profile?.data?.business_name ?? "Your business"}
          logoUrl={profile?.data?.logo_url ?? null}
          address={profile?.data?.address ?? null}
          phone={profile?.data?.phone ?? null}
          companyNumber={profile?.data?.company_number ?? null}
          vatNumber={profile?.data?.vat_number ?? null}
          visualTemplates={visualTemplates}
        />
      </div>
    </div>
  );
}
