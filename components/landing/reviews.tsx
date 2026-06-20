import Link from "next/link";
import { Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimateInView } from "@/components/animate-in-view";
import { ReviewCard } from "@/components/landing/review-card";
import { ReviewsCarousel } from "@/components/landing/reviews-carousel";
import {
  getAverageRating,
  listPublicUserReviews,
} from "@/lib/reviews/public-reviews";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < count ? "h-4 w-4 fill-amber text-amber" : "h-4 w-4 text-white/15"
          }
        />
      ))}
    </div>
  );
}

export async function Reviews() {
  const reviews = await listPublicUserReviews();
  if (!reviews.length) return null;

  const averageRating = getAverageRating(reviews);
  const useCarousel = reviews.length > 3;

  return (
    <section id="reviews" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <AnimateInView className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-brand">Reviews</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
          What our users say
        </h2>
        {averageRating !== null && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Stars count={Math.round(averageRating)} />
            <span className="text-sm text-white/60">
              {averageRating.toFixed(1)} average · {reviews.length}{" "}
              {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/60 sm:text-base">
          Real feedback from freelancers and small businesses using Puyer.
        </p>
      </AnimateInView>

      {useCarousel ? (
        <ReviewsCarousel reviews={reviews} />
      ) : (
        <div className="mt-12 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <AnimateInView key={review.id} delay={i * 70} className="h-full">
              <ReviewCard review={review} highlighted={i === 0} />
            </AnimateInView>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 border-white/15 bg-white/[0.02] px-5 text-white hover:bg-white/5"
          )}
        >
          Sign in to leave your review
        </Link>
      </div>
    </section>
  );
}
