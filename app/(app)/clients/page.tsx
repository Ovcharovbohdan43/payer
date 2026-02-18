import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AddClientForm } from "@/app/clients/add-client-form";
import { ClientList } from "@/app/clients/client-list";
import { listClients } from "@/app/clients/actions";

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clients = await listClients();

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">Clients</h1>
        <div className="space-y-6">
          <AddClientForm />
          <ClientList clients={clients} />
        </div>
      </div>
    </div>
  );
}
