import Link from "next/link";
import {
  getAverageRating,
  listPublicUserReviews,
} from "@/lib/reviews/public-reviews";
import { PublicReviewsList } from "@/components/reviews/public-reviews-list";
import { ReviewStars } from "@/components/reviews/review-stars";
import { Button } from "@/components/ui/button";

type PublicReviewsSectionProps = {
  variant?: "landing" | "app";
  showCta?: boolean;
};

export async function PublicReviewsSection({
  variant = "landing",
  showCta = variant === "landing",
}: PublicReviewsSectionProps) {
  const reviews = await listPublicUserReviews();
  if (!reviews.length && variant === "landing") return null;

  const averageRating = getAverageRating(reviews);
  const isLanding = variant === "landing";

  return (
    <section
      className={
        isLanding
          ? "border-t border-white/5 px-4 py-12 sm:px-6 sm:py-24 min-[375px]:px-4"
          : "mt-10 space-y-5"
      }
    >
      <div className={isLanding ? "mx-auto max-w-5xl" : undefined}>
        <div className={isLanding ? "text-center" : undefined}>
          <h2
            className={
              isLanding
                ? "text-xl font-bold text-white min-[375px]:text-2xl sm:text-3xl"
                : "text-base font-semibold sm:text-lg"
            }
          >
            {isLanding ? "What our users say" : "Community reviews"}
          </h2>
          {averageRating !== null && (
            <div
              className={
                isLanding
                  ? "mt-4 flex flex-col items-center gap-2"
                  : "mt-2 flex items-center gap-2"
              }
            >
              <ReviewStars rating={Math.round(averageRating)} />
              <p className="text-sm text-white/60">
                {averageRating.toFixed(1)} average from {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>
          )}
          {isLanding && (
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/60 min-[375px]:text-base">
              Real feedback from freelancers and small businesses using Puyer.
            </p>
          )}
          {!isLanding && (
            <p className="mt-1 text-sm text-muted-foreground">
              See what other users think about Puyer.
            </p>
          )}
        </div>

        <div className={isLanding ? "mt-10 sm:mt-12" : "mt-5"}>
          <PublicReviewsList reviews={reviews} variant={variant} />
        </div>

        {showCta && reviews.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button
              asChild
              variant="outline"
              className="min-h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
            >
              <Link href="/login">Sign in to leave your review</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
