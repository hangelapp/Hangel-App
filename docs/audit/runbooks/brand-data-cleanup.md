# Brand data cleanup (PDF audit #1, #2, #4)

Status: requires manual execution against the production Firestore project
(`hangel` / `studio` App Hosting target). No agent runs these — the founder
executes after backup.

## Pre-flight

1. Run `docs/audit/runbooks/firestore-backup.md` against the `brands` and
   `brandApplications` collections.
2. Confirm App Hosting deployment is on a build that already includes the
   donation-rate fix in `src/lib/api-clients.ts` (commit ≥ wave-8 brand fix).

## 1) Demo / seed brand cleanup

The bulk-seed UI on `/super-admin/brands` writes
`docs/database-exports/brands.json` rows directly into the `brands`
collection. Their document IDs follow the pattern `brand-<n>` or
`brand-<slug>` and they carry `donationRate` values that are flat
estimates rather than agency-confirmed rates.

To identify them in the Firebase Console:

```
where('id' in [
  'brand-1','brand-2','brand-3','brand-22','brand-26',
  'brand-trendyol','brand-hepsiburada','brand-n11',
  'brand-gittigidiyor','brand-ciceksepeti', ...
])
```

The full list is `docs/database-exports/brands.json`. For each entry:

- If the brand has a matching live affiliate offer (visible on `/market`
  after the api-clients fix) — **delete** the Firestore doc and let the
  API offer take over. The market page already merges both sources and
  the new super-admin list will surface the API offer as `source: 'api'`.
- If the brand should remain manually managed (no affiliate agency
  integration), keep the doc but update `logoUrl`, `donationRate`, and
  `about` with real values (see section 3).

Bulk delete option (Firebase Console > Firestore > brands collection):

1. Filter `donationRate == 0` — these are placeholder rows that the
   market page now hides anyway. Delete in batches of 500.
2. Filter `slug == ""` or `name == ""` — orphan documents. Delete.

## 2) Brand profile demo info cleanup

The `/market/[id]/page.tsx` hardcoded fallbacks (`1.240`, `12.4%`,
`125.400 ₺`, `4.520`, `845`, `94 / 100`) were removed in the wave-8
brand fix. After deploy, profiles render an empty state when
`brand.followers` / `brand.stats` are missing.

To **populate** real stats per brand, write the following fields to the
brand doc:

```js
{
  followers: <number>,            // active supporter count
  stats: {
    supporters: <number>,
    totalDonation: <number>,      // TRY
    monthlyFollowerGrowth: <number>, // percent
    profileViews: <number>,       // last 30d
    profileShares: <number>,      // last 30d
  }
}
```

Any missing sub-field renders as a hidden row (empty state).

## 3) Logo backfill

Per PDF #4, every brand should display its real logo. The market page
already cascades through `brand.logoUrl` → `logo.uplead.com/<domain>`
→ Google favicon → initial avatar, but Firestore brands lacking a
`logoUrl` rely on the cascade and can end up with a Google favicon
(low quality) on the brand profile page (which uses `AvatarImage`
without the same fallback chain).

To backfill:

1. From Firebase Console, export `brands` collection to JSON.
2. For each brand where `logoUrl` is empty or points to a low-resolution
   favicon, replace with the agency-supplied PNG/SVG or
   `https://logo.clearbit.com/<domain>` (≥128×128).
3. Re-import via the super-admin "Markaları Yükle" bulk tool *after*
   updating `docs/database-exports/brands.json` with the new URLs.

Important: the bulk tool uses `setDoc(..., { merge: true })` so
existing fields (donation rate, contact, address) are preserved.

## Rollback

If a delete batch hits the wrong rows: restore from the pre-flight
Firestore export. The bulk-seed JSON path means re-seeding restores
the placeholder data but not the real updates — back up after each
manual change.
