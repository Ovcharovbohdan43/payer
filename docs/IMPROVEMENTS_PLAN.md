# Improvement Plan (Phased)

Phased implementation of SEO, security, accessibility, and performance improvements.

## Phase 1: Security (Critical)
- [x] Add security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security
- [x] Remove hardcoded secret fallback in production (remember-cookie)

## Phase 2: Error Handling
- [x] Custom 404 page (`app/not-found.tsx`)
- [x] Error boundary (`app/error.tsx`)

## Phase 3: SEO
- [x] Canonical URLs in metadata
- [x] Add `/demo` to sitemap
- [x] Dynamic metadata for `/i/[publicId]` and `/o/[publicId]`
- [x] Verify/fix opengraph-image if needed

## Phase 4: Accessibility
- [x] Skip to main content link in layout

## Phase 5: Performance
- [x] Replace raw `<img>` with `next/image` where possible (i/[publicId], o/[publicId], app-shell, settings-form)
- [x] Configure `images.remotePatterns` for Supabase Storage
- [x] Cache-Control headers for PDF API routes (public and private)

## Excluded (for now)
- Sentry / error logging
- API rate limiting
- CORS configuration
