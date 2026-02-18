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
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0B0F14]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold sm:text-xl">Invoices</h1>
          <Button
            asChild
            className="h-10 w-full rounded-xl bg-[#3B82F6] font-semibold sm:h-9 sm:w-auto sm:px-4"
          >
            <Link href="/invoices/new">+ New invoice</Link>
          </Button>
        </div>
        <div className="pb-4 sm:pb-0">
          <InvoiceList invoices={invoices} initialStatusFilter={statusFromUrl} />
        </div>
      </div>
      <NewInvoiceFab />
    </div>
  );
}
