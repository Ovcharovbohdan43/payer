# Microsoft Clarity

Behavior analytics for public site traffic: session replays, heatmaps, rage clicks, and scroll depth. Complements Vercel Analytics and server-side `site_analytics_events`.

## Purpose

Track how **guests** (and signed-in users) interact with marketing pages, invoice payment links, demo flows, and other public routes — without building custom recording infrastructure.

## Setup

1. Create a project at [clarity.microsoft.com](https://clarity.microsoft.com).
2. Copy **Project ID** from **Settings → Overview**.
3. Add to `.env.local` (and Vercel project env for production):

```env
NEXT_PUBLIC_CLARITY_PROJECT_ID=xaecq4ktz6
```

If unset, the app falls back to the production project ID configured in `lib/analytics/clarity-project-id.ts`.

## How it works

| Module | Role |
|--------|------|
| `lib/analytics/clarity-project-id.ts` | Project ID (`xaecq4ktz6` default) and official bootstrap snippet |
| `components/analytics/microsoft-clarity-script.tsx` | Injects Microsoft snippet in `<head>` via `next/script` |
| `components/analytics/microsoft-clarity-page-views.tsx` | Client: `clarity("set", "page", pathname)` on App Router navigations |
| `app/layout.tsx` | `<MicrosoftClarityScript />` in `<head>`, page views in `<body>` |

Uses the official Microsoft `<head>` snippet (same as Clarity dashboard). No extra npm package.

## Verify

1. Open the site in a browser with the env var set.
2. DevTools → **Network** → filter `clarity` — request to `https://www.clarity.ms/tag/<project-id>` should appear.
3. In Clarity dashboard, **Recordings** may take 30–60 minutes to show first sessions.

## Privacy

- Clarity may record clicks, scrolls, and DOM snapshots. Configure **masking** in the Clarity project (Settings) for sensitive fields (payment forms, PII).
- Privacy Policy (`/privacy`) already mentions analytics tools generically; mention Clarity in cookie/analytics disclosures if you add a consent banner.
- Do not pass secrets or card data via `Clarity.setTag` / custom tags.

## Limitations

- **Local CSS in replays:** Clarity fetches CSS from a public URL during replay. Local-only builds may show unstyled replays; production (`puyer.org`) is unaffected.
- **Admin / API:** Sessions on `/admin` are recorded if Clarity is enabled globally; use Clarity URL filters or separate projects if you need to exclude internal tools.
- **SPA:** Page changes are reported via `setTag("page", pathname)`; deep client-only state changes without route change are not separate “pages” in Clarity.

## Related

- Server page views: `docs/ADMIN_PANEL.md` (`site_analytics_events`)
- Vercel Analytics: `app/layout.tsx`
- Funnel events: `lib/analytics/track-funnel-event.ts`

## Version

- **2026-06-21** — Initial integration

## Changelog

- [2026-06-21] – Added: official Microsoft Clarity `<head>` snippet, project `xaecq4ktz6`, SPA page tags
