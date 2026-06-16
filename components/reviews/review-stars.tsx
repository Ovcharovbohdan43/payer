import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type ReviewStarsProps = {
  rating: number;
  size?: "sm" | "md";
  className?: string;
};

export function ReviewStars({ rating, size = "md", className }: ReviewStarsProps) {
  const starClass = size === "sm" ? "size-4" : "size-5";

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        return (
          <Star
            key={star}
            className={cn(
              starClass,
              filled ? "text-amber-400" : "text-white/20"
            )}
            fill={filled ? "currentColor" : "none"}
            strokeWidth={filled ? 0 : 1.5}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
