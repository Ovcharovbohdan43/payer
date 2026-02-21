import { createClient } from "@/lib/supabase/server";
import { listOffers } from "@/app/offers/actions";
import { redirect } from "next/navigation";
import { OfferList } from "@/app/offers/offer-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function OffersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const offers = await listOffers();

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0B0F14]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold sm:text-xl">Offers</h1>
          <Button
            asChild
            className="h-10 w-full rounded-xl bg-[#3B82F6] font-semibold sm:h-9 sm:w-auto sm:px-4"
          >
            <Link href="/offers/new">+ New offer</Link>
          </Button>
        </div>
        <div className="pb-4 sm:pb-0">
          <OfferList offers={offers} />
        </div>
      </div>
    </div>
  );
}
