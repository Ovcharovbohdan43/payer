import { createClient } from "@/lib/supabase/server";
import { listInvoices } from "@/app/invoices/actions";
import { redirect } from "next/navigation";
import { InvoiceList } from "@/app/invoices/invoice-list";
import { NewInvoiceFab } from "@/app/dashboard/dashboard-fab";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const invoices = await listInvoices();
  const { status: statusFromUrl } = await searchParams;

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Invoices</h1>
          <Button asChild className="rounded-xl bg-[#3B82F6] font-semibold">
            <Link href="/invoices/new">+ New invoice</Link>
          </Button>
        </div>
        <div className="pb-24 sm:pb-8">
          <InvoiceList invoices={invoices} initialStatusFilter={statusFromUrl} />
        </div>
      </div>
      <NewInvoiceFab />
    </div>
  );
}
