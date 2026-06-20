"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/rate-us/star-rating";
import { FormErrorToast } from "@/components/ui/form-error-toast";
import { submitUserReviewAction, type UserReviewRow } from "@/app/rate-us/actions";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type RateUsFormProps = {
  existingReview: UserReviewRow | null;
};

export function RateUsForm({ existingReview }: RateUsFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [state, formAction, isPending] = useActionState(submitUserReviewAction, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  const submittedAt = existingReview?.updated_at ?? existingReview?.created_at;

  return (
    <form action={formAction} className="space-y-6">
      <FormErrorToast state={state} />
      <input type="hidden" name="rating" value={rating > 0 ? String(rating) : ""} />

      <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
        <h2 className="mb-1 text-base font-semibold">Your rating</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          How would you rate Puyer so far? Your feedback helps us improve invoicing for freelancers and small businesses.
        </p>
        <StarRating
          id="rating"
          value={rating}
          onChange={setRating}
          disabled={isPending}
        />
      </section>

      <section className="rounded-[16px] border border-white/5 bg-[#121821]/80 p-4 backdrop-blur sm:rounded-[20px] sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="comment">Your comment</Label>
          <p className="text-xs text-muted-foreground">
            Tell us what you like, what could be better, or any bugs you have run into. Optional, but very helpful.
          </p>
          <textarea
            id="comment"
            name="comment"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Love the quick invoice flow, but I'd like…"
            disabled={isPending}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-white/10 bg-[#121821]/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
          />
          <p className="text-right text-xs text-muted-foreground">
            {comment.length}/2000
          </p>
        </div>
      </section>

      {state?.success && (
        <div
          className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>
            Thank you! Your review has been saved.
            {existingReview ? " You can update it anytime." : ""}
          </span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending || rating < 1}
        className="h-11 w-full bg-[#3B82F6] text-white hover:bg-[#2563EB] sm:w-auto sm:min-w-[160px]"
      >
        {isPending
          ? "Saving…"
          : existingReview
            ? "Update review"
            : "Submit review"}
      </Button>

      {submittedAt && !state?.success && (
        <p className="text-xs text-muted-foreground">
          Last updated{" "}
          {new Date(submittedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}
    </form>
  );
}
