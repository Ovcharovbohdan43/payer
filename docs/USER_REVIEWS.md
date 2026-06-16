# User Reviews (Rate Us)

**Version:** 1.0  
**Last updated:** 2026-06-15

## Purpose

Let signed-in users leave feedback about Puyer: a **1–5 star rating** and an **optional comment**. Reviews are stored per user, can be updated later, and are **shown publicly** on the landing page and on the Rate Us page.

## Description

- Route: `/rate-us` (authenticated app area)
- Navigation: sidebar and mobile nav — **Rate us**
- One review per user (`user_reviews.user_id` is unique)
- RLS: users can only read and write their own review row directly
- Public read: RPC `get_public_user_reviews()` — safe fields only (no `user_id`)
- Server-side validation via `userReviewSchema` (Zod)

## Public display

- **Landing** (`/`): section **What our users say** — all reviews in a grid with avatar (logo or initial), stars, comment, date, and average rating. Hidden when there are no reviews yet.
- **Rate Us** (`/rate-us`): **Community reviews** — same list below the submit form for signed-in users.
- Avatar: `profiles.logo_url` when set; otherwise first letter of `business_name`.

## Database

Table: `public.user_reviews`

| Column       | Type        | Notes                          |
|-------------|-------------|--------------------------------|
| id          | uuid        | Primary key                    |
| user_id     | uuid        | FK → profiles, unique          |
| rating      | smallint    | 1–5                            |
| comment     | text        | Max 2000 chars, default `''`   |
| created_at  | timestamptz |                                |
| updated_at  | timestamptz | Set on create/update           |

Migration: `supabase/migrations/20250322000001_user_reviews.sql`

Public RPC: `get_public_user_reviews()` — see `supabase/migrations/20250322000002_public_user_reviews_rpc.sql`

## How to use

1. Sign in to Puyer.
2. Open **Rate us** in the sidebar (or mobile nav).
3. Select 1–5 stars.
4. Optionally write a comment.
5. Click **Submit review** (or **Update review** if you already submitted).

## Examples

**First submission:** 5 stars + comment → row inserted for `auth.uid()`.

**Update:** Change stars or comment → same row updated, `updated_at` refreshed.

## How to test

1. Apply migration on local/prod Supabase.
2. Sign in and open `/rate-us`.
3. Submit without stars → error “Select a star rating”.
4. Submit with 4 stars and a comment → success message; row in `user_reviews`.
5. Reload page → form shows saved rating and comment.
6. Update rating → **Update review** saves changes.
6. Open `/` (landing) — reviews appear in **What our users say** with avatar and comment.
7. Open `/rate-us` while signed in — **Community reviews** shows the same list.

## Limitations

- No admin UI in the app; read reviews in Supabase Dashboard or SQL.
- Comment is optional; rating is required.
- No delete action in UI (user can update instead).
- Public list exposes `business_name` and `logo_url` from profile (same as on public invoices).

## Affected modules

- `supabase/migrations/20250322000001_user_reviews.sql`
- `supabase/migrations/20250322000002_public_user_reviews_rpc.sql`
- `app/(app)/rate-us/page.tsx`
- `app/page.tsx` — landing reviews section
- `app/rate-us/actions.ts`
- `components/rate-us/rate-us-form.tsx`
- `components/rate-us/star-rating.tsx`
- `components/reviews/public-reviews-section.tsx`
- `components/reviews/public-reviews-list.tsx`
- `components/reviews/review-avatar.tsx`
- `components/reviews/review-stars.tsx`
- `lib/reviews/public-reviews.ts`
- `components/layout/app-shell.tsx`
- `components/layout/mobile-nav.tsx`
- `lib/validations/index.ts` — `userReviewSchema`

## Changelog

- [2026-06-15] – Added: public reviews on landing and community list on Rate Us with avatars.
- [2026-06-15] – Added: Rate Us page with star rating and comment; `user_reviews` table and RLS.
