"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ReviewCard } from "@/components/landing/review-card";
import type { PublicUserReview } from "@/lib/reviews/public-reviews";

const AUTO_ADVANCE_MS = 6000;

function useVisibleSlotCount() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const lg = window.matchMedia("(min-width: 1024px)");
    const sm = window.matchMedia("(min-width: 640px)");

    const update = () => {
      if (lg.matches) setCount(3);
      else if (sm.matches) setCount(2);
      else setCount(1);
    };

    update();
    lg.addEventListener("change", update);
    sm.addEventListener("change", update);
    return () => {
      lg.removeEventListener("change", update);
      sm.removeEventListener("change", update);
    };
  }, []);

  return count;
}

export function ReviewsCarousel({ reviews }: { reviews: PublicUserReview[] }) {
  const visibleCount = useVisibleSlotCount();
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const advance = useCallback(() => {
    setOffset((current) => (current + 1) % reviews.length);
  }, [reviews.length]);

  useEffect(() => {
    if (paused || reduceMotion || reviews.length <= visibleCount) return;

    const timer = window.setInterval(advance, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [advance, paused, reduceMotion, reviews.length, visibleCount]);

  const slots = Math.min(visibleCount, reviews.length);

  return (
    <div
      className="mt-12"
      aria-live="polite"
      aria-roledescription="carousel"
      aria-label="User reviews"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        className={cn(
          "grid items-stretch gap-4",
          slots === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          slots === 2 && "grid-cols-1 sm:grid-cols-2",
          slots === 1 && "grid-cols-1"
        )}
      >
        {Array.from({ length: slots }).map((_, slotIndex) => {
          const review = reviews[(offset + slotIndex) % reviews.length];

          return (
            <div key={slotIndex} className="h-full">
              <div
                key={`${slotIndex}-${review.id}-${offset}`}
                className={cn(
                  "h-full",
                  !reduceMotion && "animate-review-carousel-in"
                )}
              >
                <ReviewCard review={review} highlighted={slotIndex === 0} />
              </div>
            </div>
          );
        })}
      </div>

      {reviews.length > visibleCount && (
        <div className="mt-6 flex justify-center gap-2">
          {reviews.map((review, index) => (
            <button
              key={review.id}
              type="button"
              aria-label={`Show review ${index + 1} of ${reviews.length}`}
              aria-current={index === offset ? "true" : undefined}
              onClick={() => setOffset(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === offset
                  ? "w-6 bg-brand"
                  : "w-2 bg-white/20 hover:bg-white/35"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
