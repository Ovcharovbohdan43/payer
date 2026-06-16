import type { PublicUserReview } from "@/lib/reviews/public-reviews";
import { ReviewAvatar } from "@/components/reviews/review-avatar";
import { ReviewStars } from "@/components/reviews/review-stars";

type PublicReviewsListProps = {
  reviews: PublicUserReview[];
  variant?: "landing" | "app";
};

function formatReviewDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export function PublicReviewsList({
  reviews,
  variant = "landing",
}: PublicReviewsListProps) {
  if (!reviews.length) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No reviews yet. Be the first to share your experience.
      </p>
    );
  }

  const cardClass =
    variant === "landing"
      ? "rounded-[16px] border border-white/10 bg-[#121821]/80 p-5 backdrop-blur min-[375px]:rounded-[20px] min-[375px]:p-6"
      : "rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-5";

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
      {reviews.map((review) => {
        const comment = review.comment.trim();
        return (
          <article key={review.id} className={cardClass}>
            <div className="flex items-start gap-3">
              <ReviewAvatar
                businessName={review.businessName}
                logoUrl={review.logoUrl}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="truncate text-sm font-semibold text-white sm:text-base">
                    {review.businessName}
                  </h3>
                  <time
                    className="text-xs text-white/40"
                    dateTime={review.updatedAt}
                  >
                    {formatReviewDate(review.updatedAt)}
                  </time>
                </div>
                <ReviewStars rating={review.rating} size="sm" className="mt-2" />
              </div>
            </div>
            {comment ? (
              <p className="mt-4 text-sm leading-relaxed text-white/75">
                {comment}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
