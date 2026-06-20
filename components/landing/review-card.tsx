import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewAvatar } from "@/components/reviews/review-avatar";
import type { PublicUserReview } from "@/lib/reviews/public-reviews";

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

function formatReviewDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export function ReviewCard({
  review,
  highlighted = false,
}: {
  review: PublicUserReview;
  highlighted?: boolean;
}) {
  const comment = review.comment.trim();

  return (
    <figure
      className={cn(
        "flex h-full min-h-[220px] flex-col rounded-2xl border p-6 sm:min-h-[240px]",
        highlighted
          ? "border-brand/20 bg-gradient-to-b from-brand/10 to-card/60"
          : "border-white/8 bg-card/60"
      )}
    >
      <Stars count={review.rating} />
      <blockquote
        className={cn(
          "mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-pretty",
          comment ? "text-white/70" : "text-white/50"
        )}
      >
        {comment ? (
          <>&ldquo;{comment}&rdquo;</>
        ) : (
          <>Rated {review.rating} out of 5 stars.</>
        )}
      </blockquote>
      <figcaption className="mt-5 flex shrink-0 items-center gap-3">
        <ReviewAvatar
          businessName={review.businessName}
          logoUrl={review.logoUrl}
          size="sm"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {review.businessName}
          </p>
          <p className="text-xs text-white/50">
            {formatReviewDate(review.updatedAt)}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
