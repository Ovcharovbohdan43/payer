"use server";

import { createClient } from "@/lib/supabase/server";
import { userReviewSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export type UserReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

export async function getUserReview(): Promise<UserReviewRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_reviews")
    .select("id, user_id, rating, comment, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function submitUserReviewAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const raw = {
    rating: formData.get("rating"),
    comment: formData.get("comment") ?? "",
  };
  const parsed = userReviewSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.rating?.[0] ?? first.comment?.[0] ?? "Invalid review";
    return { error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const now = new Date().toISOString();
  const payload = {
    user_id: user.id,
    rating: parsed.data.rating,
    comment: (parsed.data.comment ?? "").trim(),
    updated_at: now,
  };

  const { data: existing } = await supabase
    .from("user_reviews")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("user_reviews").update(payload).eq("user_id", user.id)
    : await supabase.from("user_reviews").insert(payload);

  if (error) {
    return { error: "Could not save your review. Please try again." };
  }

  revalidatePath("/rate-us");
  revalidatePath("/");
  return { success: true };
}
