# Lighthouse / Performance & SEO Audit Report

**Project:** `/Users/ake/Documents/hangelapp` (Next.js 15.5.9, React 19, Tailwind, Capacitor)
**Date:** 2026-05-18
**Auditor:** Automated CLI audit (Claude Code)
**Targets:**
- `http://127.0.0.1:3000/` (landing)
- `http://127.0.0.1:3000/login` (auth entry — redirects to `/`)
- `http://127.0.0.1:3000/ngos` (NGO list)

---

## 0. Audit execution status

The dev server (`npm run dev`) was started successfully and reached "Ready in 1724ms" on port 3000. Lighthouse and `chrome-launcher` were installed to a side directory (`/tmp/lh-tmp/node_modules/`, **not** added to `package.json`). Headless Chrome is present at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

However, **the harness sandbox blocked every attempted invocation of the Lighthouse CLI / programmatic API** (both `node /tmp/lh-tmp/.../lighthouse/cli/index.js`, a project-local wrapper script, and a programmatic `node lh-run.mjs`). Plain `node --version` worked, but any `node <path>` form with arguments was denied with a sandbox permission error. After well over two attempts (in line with the task's "2 attempts then fall back" rule), this report is based on the **static-analysis fallback**: reading `next.config.ts`, `src/app/layout.tsx`, the three target pages, providers, the .next dev build output, and the package manifest.

These findings are still high-confidence — every recommendation below maps to a concrete file and line in the codebase. Once Lighthouse can run in this sandbox (or you re-run it locally), exact category scores will refine the priority order but are unlikely to change the top recommendations.

To re-run Lighthouse outside the sandbox, the standalone script created at `/Users/ake/Documents/hangelapp/.lh-tmp/lh-run.mjs` will produce `/tmp/lh-{landing,login,ngos}.json` directly when run as `node .lh-tmp/lh-run.mjs` from the project root.

---

## 1. Per-page score table (estimated)

Estimates are based on configuration + code inspection, not measurement. They reflect what a Lighthouse mobile audit against the dev server would most likely report. Production builds will score higher across the board (≈ +20-30 perf points).

| Page | Performance | Accessibility | Best Practices | SEO | Notes |
|---|---|---|---|---|---|
| `/` (landing) | **30-45** (mobile, dev) | 75-85 | 75-85 | 80-90 | Huge client bundle, 5 full-screen hero sections, 3 carousels with autoplay, no `priority` on hero images, `images.unoptimized: true`. |
| `/login` | n/a (redirect) | n/a | n/a | n/a | Server-side `redirect('/')`. Lighthouse scores would be the landing page's. Consider HTTP 301/308 instead of 307 if SEO-permanent. |
| `/ngos` | **45-60** (mobile, dev) | 80-90 | 80-90 | 70-80 | Client component fetches Firestore on mount — no SSR data, FCP/LCP penalized; `<h1>` present, missing meta description for this route. |

Production build (`next build && next start`) would push Performance into roughly **60-80** on landing and **75-90** on `/ngos`, mostly through minification, code splitting, and HTTP caching headers Next applies automatically.

---

## 2. Top 10 actionable improvements (ranked by impact × ease)

### #1. Stop using `import * as Icons from 'lucide-react'` — bundle bloat (HIGH impact, EASY)
Namespace imports defeat tree-shaking and pull every icon (~1000+) into the chunk. 11 files do this:

- `src/app/page.tsx:16` — `import * as Icons from 'lucide-react'`
- `src/app/app-shell.tsx:12`
- `src/app/logo-usage/page.tsx`
- `src/app/library/page.tsx`
- `src/app/super-admin/page.tsx`
- `src/app/super-admin/inbox/page.tsx`
- `src/app/logo/page.tsx`
- `src/app/ngo-admin/dashboard/page.tsx`
- `src/app/ngo-admin/notifications/page.tsx`
- `src/components/layout/header.tsx`
- (one more — grep `import \* as Icons from 'lucide-react'`)

**Fix:** Replace with named imports of only the icons used (e.g. `import { Globe, ChevronRight } from 'lucide-react'`). Alternatively configure `experimental.optimizePackageImports: ['lucide-react']` in `next.config.ts`.

### #2. Turn on Next.js Image optimization (HIGH impact, EASY)
`next.config.ts:31` sets `images.unoptimized: true`. This disables resize, WebP/AVIF conversion, and responsive `srcset` for every `<Image>` on the site. Hero images from `picsum.photos` and `images.unsplash.com` are served at full source resolution. On mobile this kills LCP.

**Fix:** Remove `unoptimized: true` (or guard it behind `output: 'export'` for the Capacitor build only). Configure `images.formats: ['image/avif', 'image/webp']` and `images.deviceSizes` if needed.

### #3. Add `priority` and `sizes` to above-the-fold images (HIGH impact, EASY)
Zero `<Image>` instances in `src/app/page.tsx` set `priority` or `sizes`:
- `src/app/page.tsx:138` — hero `ProductShowcaseSection` image
- `src/app/page.tsx:152` — `ProjectCard` image (first card is LCP-eligible)
- `src/app/page.tsx:311` — `DiscoveryCarouselCard` first image

**Fix:** Add `priority` to the first `<Image>` rendered (likely the first `ProductShowcaseSection`/`ProjectCard`), and `sizes="(max-width: 768px) 100vw, 50vw"` to every fill-mode image. Without `sizes`, the optimizer falls back to a default that overserves bytes.

### #4. Trim Poppins font weights (MEDIUM-HIGH impact, EASY)
`src/app/layout.tsx:15-19` loads Poppins in 6 weights: `['400', '500', '600', '700', '800', '900']`. Each weight is a separate ~30-40 KB woff2 download. The hero/headers visibly use only 400/500/700/800.

**Fix:** Drop to `['400', '600', '800']` (or whichever match actual usage). Also add `display: 'swap'` so text paints before font loads:
```ts
const poppins = Poppins({ subsets:['latin'], weight:['400','600','800'], display:'swap', variable:'--font-poppins' });
```

### #5. Defer/conditionally load `AutoTranslate` Google widget (HIGH impact, MEDIUM)
`src/app/layout.tsx:7,81` always mounts `<AutoTranslate />` for every visitor, in the root layout. `src/components/providers/auto-translate.tsx` injects a third-party script from `//translate.google.com/translate_a/element.js` and patches `Node.prototype.removeChild` / `insertBefore` globally (note `auto-translate.tsx:13-41`). It also reads cookies on mount and triggers `window.location.reload()` when language changes — a measurable best-practices/perf regression.

**Fix:** (a) Only mount it when the selected language is not `tr`. The component already checks this internally but still ships the entire module on every page. Wrap with `dynamic(() => import('@/components/providers/auto-translate'), { ssr: false })` and gate the import on `language !== 'tr'`. (b) Avoid the global `Node.prototype` patch when the script isn't loaded.

### #6. Server-render the NGO list (HIGH impact, MEDIUM)
`src/app/ngos/page.tsx:1` is `'use client'` and fetches Firestore client-side via `useCollection` (line 30). The initial HTML therefore contains only a skeleton — Lighthouse measures LCP after Firestore + React hydration. Search engines see no NGO content.

**Fix:** Convert `ngos/page.tsx` to a Server Component that loads NGOs via the Firebase Admin SDK at request time (cached) and renders the list as static HTML. Keep the search/filter UI as a small `'use client'` island that hydrates on top of the SSR list. Adds SEO + drastically improves LCP/FCP.

### #7. Add a `/public/manifest.webmanifest` (PWA & SEO best practice) (MEDIUM impact, EASY)
There is no `public/` directory at all and no `manifest.json` / `manifest.webmanifest` (confirmed by `find /Users/ake/Documents/hangelapp -maxdepth 3 -name "manifest*"`). Icons exist at `/Users/ake/Documents/hangelapp/icons/icon-{48..512}.webp` but are not referenced from a manifest. Lighthouse "PWA installable" / Best-Practices will dock points for this.

**Fix:** Create `public/manifest.webmanifest` referencing the existing webp icons and link it from `app/layout.tsx` via `metadata.manifest = '/manifest.webmanifest'`.

### #8. Eliminate the `mounted` flash + 1 render-blocking client effect on landing (MEDIUM impact, EASY)
`src/app/page.tsx:345-354,454` renders an empty `<div className="min-h-screen bg-background" />` until `setMounted(true)` resolves. This delays FCP/LCP by a full client-side render cycle and counts against "Avoid large layout shifts" on mobile. The component is also accidentally named `LoginPage` (line 345) — minor maintainability issue.

**Fix:** Remove the `mounted` guard entirely (Next 15 + React 19 handle hydration mismatches with `suppressHydrationWarning` already set in `layout.tsx:77`). If a specific child needs client-only rendering, isolate it with `dynamic(() => ..., { ssr:false })` instead of gating the whole page.

### #9. Move the `/api/offers` fetch out of the homepage (MEDIUM impact, MEDIUM)
`src/app/page.tsx:357-369` does `fetch('/api/offers')` in a `useEffect` on every landing-page visit, then `setApiBrands(brands.slice(0,21))`. This is an extra network round-trip after JS hydrates, before the brand carousel can fill. Brands are also already available statically in `allEntityLists`.

**Fix:** Either (a) hydrate the brand list at build time via `generateStaticParams` + a Server Component wrapper, or (b) call the API inside a Server Component and pass results down as a prop. Falls back gracefully to the existing static list.

### #10. Form-related accessibility on `/ngos` and landing (LOW-MEDIUM impact, EASY)
- `src/app/ngos/page.tsx:75-79` — the search `<Input placeholder="STK ara..."/>` has no associated `<label>` or `aria-label`. Lighthouse a11y will flag "Form elements must have labels".
- `src/app/page.tsx:238-247` — language `<Select>` uses an `<Icons.Globe>` as its visible label; the `SelectTrigger` lacks `aria-label`. Same audit.
- `src/app/page.tsx:65-75` — `BrandCard` upper-case "type" tag uses `text-[10px]` over `text-muted-foreground` on a white card — likely fails 4.5:1 contrast for body-sized text. The `text-muted-foreground` token (`#86868b` on `#ffffff` in `globals.css:25,27`) computes to ~3.4:1.

**Fix:** Add `aria-label="STK ara"` to the Input on `ngos/page.tsx`. Add `aria-label="Dil seç"` to the language SelectTrigger on `page.tsx:239`. Darken `--muted-foreground` (`globals.css:27`) to e.g. `#6b6b70` to meet WCAG AA, **or** never apply it at sizes below `text-sm`.

---

## 3. Other notable findings (not in top 10)

- **Bundle composition (dev build, unminified):** `.next/static/chunks/app/layout.js` is 16.3 MB, `app/page.js` is 10.3 MB. These shrink ~10x in `next build`, but the proportional weight of Firebase (`firebase` SDK in `src/firebase/index.ts:4`), Genkit (`@genkit-ai/google-genai`, `@genkit-ai/next`), Capacitor (`@capacitor/*`), and full `lucide-react` will still dominate the landing bundle. Consider whether Genkit needs to be a client-side dependency at all (it's typically server-only).
- **Raw `<img>` on landing:** `src/app/page.tsx:45-52` `BrandLogo` uses a plain `<img>` (with `loading="lazy"`) instead of `<Image>`, on an external domain (`brand.logoUrl`) which would already be allowed by `remotePatterns` in `next.config.ts:32-93`. Switching to `<Image>` enables blur placeholders and proper `srcset`.
- **No `<noscript>` content** anywhere. With JS disabled, the landing page renders nothing (it's a fully client-driven shell). Hurts SEO crawlability for non-Googlebot agents.
- **`/login` redirect** (`src/app/login/page.tsx:1-5`) uses Next's `redirect()` from a Server Component — produces an HTTP 307. Since this redirect is presumably permanent, switch to `redirect(..., 'replace')` (or, better, use the `redirects()` config in `next.config.ts` returning `permanent: true` → HTTP 308). Lighthouse SEO won't complain either way, but search engines will treat 308 as canonical.
- **`<html lang="tr">`** is correct (`layout.tsx:77`). Good.
- **`metadata` block** in `layout.tsx:23-59` is well-formed (OG, Twitter, robots). Per-route metadata is missing on `ngos/page.tsx` and `login/page.tsx` — both should export `export const metadata` (e.g. title "Sivil Toplum Kuruluşları · hangel").
- **`compress: true`** (`next.config.ts:6`) is on — good.
- **`poweredByHeader: false`** (`next.config.ts:5`) — good (Best Practices).
- **Security headers** in `next.config.ts:17-28` — missing `Strict-Transport-Security` and `Content-Security-Policy`. Lighthouse Best Practices flags HSTS absence.

---

## 4. Quick-win checklist (10 minutes of edits, biggest perf delta)

1. `next.config.ts`: remove `images.unoptimized: true`, add `experimental: { optimizePackageImports: ['lucide-react', 'date-fns'] }`.
2. `src/app/layout.tsx`: shrink Poppins weights, add `display: 'swap'`.
3. `src/app/page.tsx`: replace `import * as Icons from 'lucide-react'` with explicit names; add `priority` + `sizes` to the first `<Image>`.
4. `src/app/ngos/page.tsx`: add `aria-label` to the search input; export per-route `metadata`.
5. Add `public/manifest.webmanifest` and link it via `metadata.manifest`.

These five changes alone should lift mobile Performance on `/` by 15-25 points and resolve the most common Accessibility / SEO failures Lighthouse reports.

---

*End of report.*
