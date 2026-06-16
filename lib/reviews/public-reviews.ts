import { createClient } from "@/lib/supabase/server";

export type PublicUserReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  businessName: string;
  logoUrl: string | null;
};

type PublicUserReviewRow = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  business_name: string;
  logo_url: string | null;
};

function mapPublicReview(row: PublicUserReviewRow): PublicUserReview {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    businessName: row.business_name,
    logoUrl: row.logo_url,
  };
}

export async function listPublicUserReviews(): Promise<PublicUserReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_user_reviews");

  if (error || !data?.length) return [];
  return (data as PublicUserReviewRow[]).map(mapPublicReview);
}

export function getAverageRating(reviews: PublicUserReview[]): number | null {
  if (!reviews.length) return null;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
