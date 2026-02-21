import { createClient } from "@/lib/supabase/server";
import { listClients } from "@/app/clients/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewOfferForm } from "@/app/offers/new-offer-form";

export default async function NewOfferPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await supabase
    .from("profiles")
    .select("default_currency")
    .eq("id", user.id)
    .single();
  const defaultCurrency = profile?.data?.default_currency ?? "USD";

  const clients = await listClients();

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/offers" className="text-muted-foreground hover:text-foreground">
              ← Offers
            </Link>
          </Button>
        </div>
        <h1 className="mb-6 text-2xl font-bold">New offer</h1>
        <NewOfferForm defaultCurrency={defaultCurrency} clients={clients} />
      </div>
    </div>
  );
}
