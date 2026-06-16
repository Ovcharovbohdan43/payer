"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  id?: string;
};

const LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

export function StarRating({ value, onChange, disabled, id }: StarRatingProps) {
  return (
    <div className="space-y-2">
      <div
        id={id}
        role="radiogroup"
        aria-label="Star rating"
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= value;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? "" : "s"} — ${LABELS[star - 1]}`}
              disabled={disabled}
              onClick={() => onChange(star)}
              className={cn(
                "rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121821] disabled:cursor-not-allowed disabled:opacity-50",
                filled
                  ? "text-amber-400 hover:text-amber-300"
                  : "text-white/25 hover:text-white/50"
              )}
            >
              <Star
                className="size-8 min-[375px]:size-9"
                fill={filled ? "currentColor" : "none"}
                strokeWidth={filled ? 0 : 1.5}
              />
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        {value > 0 ? LABELS[value - 1] : "Tap a star to rate your experience"}
      </p>
    </div>
  );
}
