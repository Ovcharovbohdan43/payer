import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserReview } from "@/app/rate-us/actions";
import { RateUsForm } from "@/components/rate-us/rate-us-form";
import { PublicReviewsSection } from "@/components/reviews/public-reviews-section";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RateUsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const existingReview = await getUserReview();

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0B0F14]">
      <div className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8 min-[375px]:px-4 min-[375px]:py-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
            <Star className="size-5" fill="currentColor" strokeWidth={0} />
          </div>
          <div>
            <h1 className="text-lg font-semibold sm:text-xl">Rate us</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your experience with Puyer. Pick a star rating and leave a comment — we read every review.
            </p>
          </div>
        </div>

        <RateUsForm existingReview={existingReview} />

        <PublicReviewsSection variant="app" showCta={false} />
      </div>
    </div>
  );
}
