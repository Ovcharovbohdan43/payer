import { createClient } from "@/lib/supabase/server";
import { listClients } from "@/app/clients/actions";
import { listInvoiceTemplates } from "@/app/invoices/template-actions";
import { listInvoiceVisualTemplates } from "@/app/invoices/visual-template-actions";
import { redirect } from "next/navigation";
import { NewInvoiceForm } from "@/app/invoices/new/new-invoice-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDefaultVisualConfig } from "@/lib/invoice-visual-config";
import { normalizeInvoiceDesign } from "@/lib/invoice-designs";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, clients, templates, visualTemplates] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "default_currency, default_invoice_design, default_invoice_visual_template_id, business_name, logo_url, address, phone, company_number, vat_number"
      )
      .eq("id", user.id)
      .single(),
    listClients(),
    listInvoiceTemplates(),
    listInvoiceVisualTemplates(),
  ]);

  const defaultCurrency = profile?.data?.default_currency ?? "USD";
  const defaultInvoiceDesign = profile?.data?.default_invoice_design ?? "classic";
  const defaultVisualTemplate =
    visualTemplates.find((template) => template.id === profile?.data?.default_invoice_visual_template_id) ??
    visualTemplates.find((template) => template.is_default) ??
    null;
  const initialVisualConfig =
    defaultVisualTemplate?.config ??
    getDefaultVisualConfig(normalizeInvoiceDesign(defaultInvoiceDesign));

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices" className="text-muted-foreground hover:text-foreground">
              ← Invoices
            </Link>
          </Button>
        </div>
        <h1 className="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">Create invoice</h1>
        <NewInvoiceForm
          defaultCurrency={defaultCurrency}
          initialVisualConfig={initialVisualConfig}
          businessName={profile?.data?.business_name ?? "Your business"}
          logoUrl={profile?.data?.logo_url ?? null}
          address={profile?.data?.address ?? null}
          phone={profile?.data?.phone ?? null}
          companyNumber={profile?.data?.company_number ?? null}
          vatNumber={profile?.data?.vat_number ?? null}
          clients={clients}
          templates={templates}
          visualTemplates={visualTemplates}
        />
      </div>
    </div>
  );
}
