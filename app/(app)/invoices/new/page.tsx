import { createClient } from "@/lib/supabase/server";
import { listClients } from "@/app/clients/actions";
import { redirect } from "next/navigation";
import { NewInvoiceForm } from "@/app/invoices/new/new-invoice-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, clients] = await Promise.all([
    supabase
      .from("profiles")
      .select("default_currency, show_vat_fields")
      .eq("id", user.id)
      .single(),
    listClients(),
  ]);

  const defaultCurrency = profile?.data?.default_currency ?? "USD";
  const showVatFields = profile?.data?.show_vat_fields ?? false;

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices" className="text-muted-foreground hover:text-foreground">
              ← Invoices
            </Link>
          </Button>
        </div>
        <h1 className="mb-6 text-xl font-semibold">Create invoice</h1>
        <NewInvoiceForm
          defaultCurrency={defaultCurrency}
          showVatFields={showVatFields}
          clients={clients}
        />
      </div>
    </div>
  );
}
