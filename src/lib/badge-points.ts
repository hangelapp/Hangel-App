/**
 * Badge Points — Hangel per-area scoring from real user activity.
 *
 * Pure functions + constants. No React, no Firestore, no side effects.
 * Mirrors the style of `src/lib/volunteer-matching.ts`.
 *
 * The 19 badge "social areas" all end in " Gönüllüsü" (see `badges` in
 * `@/lib/data`). We derive per-area points from three signals:
 *   - Confirmed donations to an NGO whose category maps to a badge area
 *   - Past volunteering records (explicit area, or via the NGO category)
 *   - Successful invites (always credited to "hangel Gönüllüsü")
 *
 * Functions never throw — missing/undefined fields simply contribute 0.
 */

import { badges } from '@/lib/data';

// ---------- Scoring constants ----------

/** Each confirmed donation to an NGO in area A → +25 to area A. */
export const DONATION_AREA_POINTS = 25;

/** Each successful invite → +10 to "hangel Gönüllüsü". */
export const INVITE_AREA_POINTS = 10;

/** Area that invites are always credited to. */
export const HANGEL_AREA = 'hangel Gönüllüsü';

/** Default points for a volunteering record without an explicit point value. */
const DEFAULT_VOLUNTEERING_POINTS = 50;

/** Donation statuses that count as confirmed/deposited. */
const CONFIRMED_DONATION_STATUSES = ['Yatırıldı', 'Tamamlandı'];

// ---------- Public input types (loose; mirrors actual Firestore docs) ----------

export interface DonationLike {
  status?: string;
  ngoIds?: string[];
  ngo?: string[];
}

export interface PastVolunteeringLike {
  points?: number;
  socialArea?: string;
  area?: string;
  ngoId?: string;
  organization?: string;
}

export interface ComputeAreaPointsInput {
  donations: DonationLike[];
  ngoCategoryById: Record<string, string>; // ngoId -> NGO.category
  pastVolunteering: PastVolunteeringLike[];
  inviteCount: number;
}

// ---------- Helpers ----------

const TR_LOCALE = 'tr';

const trLower = (s: unknown): string =>
  typeof s === 'string' ? s.trim().toLocaleLowerCase(TR_LOCALE) : '';

const AREA_SUFFIX = ' Gönüllüsü';

/** Unique set of badge social areas, derived from `badges` to stay in sync. */
const BADGE_AREAS: string[] = Array.from(new Set(badges.map((b) => b.socialArea)));

/**
 * Pre-computed [keyword, fullArea] pairs where keyword is the area string with
 * the trailing " Gönüllüsü" stripped and lower-cased (e.g. "çevre", "kan bağışı").
 */
const AREA_KEYWORDS: Array<{ keyword: string; area: string }> = BADGE_AREAS.map((area) => {
  const base = area.endsWith(AREA_SUFFIX) ? area.slice(0, -AREA_SUFFIX.length) : area;
  return { keyword: trLower(base), area };
});

/**
 * Explicit aliases checked before keyword matching. Each alias (lower-cased,
 * Turkish-aware) maps a common NGO category vocabulary to a full badge area.
 */
const ALIASES: Array<{ match: string; area: string }> = [
  { match: 'yardımlaşma', area: 'Sosyal Yardım Gönüllüsü' },
  { match: 'yardim', area: 'Sosyal Yardım Gönüllüsü' },
  { match: 'sosyal yardım', area: 'Sosyal Yardım Gönüllüsü' },
  { match: 'dayanışma', area: 'Afet Gönüllüsü' },
  { match: 'afet', area: 'Afet Gönüllüsü' },
  { match: 'sanat', area: 'Kültür ve Sanat Gönüllüsü' },
  { match: 'kültür', area: 'Kültür ve Sanat Gönüllüsü' },
  { match: 'mülteci', area: 'Göç ve Mülteci Gönüllüsü' },
  { match: 'göç', area: 'Göç ve Mülteci Gönüllüsü' },
  { match: 'engelli', area: 'Engelsiz Yaşam Gönüllüsü' },
  { match: 'engelsiz', area: 'Engelsiz Yaşam Gönüllüsü' },
];

// ---------- Public API ----------

/**
 * Map a free-form NGO category string to one of the 19 full badge area
 * strings, or null if nothing matches.
 *
 * Aliases are checked first, then keyword containment in either direction
 * (category contains keyword, or keyword contains category). Turkish-aware,
 * case-insensitive.
 */
export function mapCategoryToBadgeArea(category: string | undefined | null): string | null {
  const cat = trLower(category);
  if (!cat) return null;

  for (const { match, area } of ALIASES) {
    if (cat.includes(match)) return area;
  }

  for (const { keyword, area } of AREA_KEYWORDS) {
    if (!keyword) continue;
    if (cat.includes(keyword) || keyword.includes(cat)) return area;
  }

  return null;
}

/**
 * Compute per-area badge points from a user's real activity. Returns a map of
 * full badge area string -> integer points. Defensive: missing/undefined
 * arrays are treated as empty.
 */
export function computeAreaPoints(input: ComputeAreaPointsInput): Record<string, number> {
  const totals: Record<string, number> = {};
  const add = (area: string, points: number) => {
    totals[area] = (totals[area] || 0) + points;
  };

  const donations = Array.isArray(input?.donations) ? input.donations : [];
  const ngoCategoryById =
    input?.ngoCategoryById && typeof input.ngoCategoryById === 'object'
      ? input.ngoCategoryById
      : {};
  const pastVolunteering = Array.isArray(input?.pastVolunteering) ? input.pastVolunteering : [];
  const inviteCount = Number(input?.inviteCount) || 0;

  // --- Donations ---
  for (const donation of donations) {
    const status = donation?.status;
    if (!status || !CONFIRMED_DONATION_STATUSES.includes(status)) continue;
    const ngoIds = Array.isArray(donation?.ngoIds) ? donation.ngoIds : [];
    for (const ngoId of ngoIds) {
      if (!ngoId || ngoId === 'Atanmamış') continue;
      const area = mapCategoryToBadgeArea(ngoCategoryById[ngoId]);
      if (area) add(area, DONATION_AREA_POINTS);
    }
  }

  // --- Volunteering ---
  for (const doc of pastVolunteering) {
    let area: string | null = null;
    if (doc?.socialArea) {
      area = doc.socialArea;
    } else if (doc?.area) {
      area = doc.area;
    } else if (doc?.ngoId && ngoCategoryById[doc.ngoId]) {
      area = mapCategoryToBadgeArea(ngoCategoryById[doc.ngoId]);
    }
    if (!area) continue;
    const points = typeof doc?.points === 'number' && doc.points > 0 ? doc.points : DEFAULT_VOLUNTEERING_POINTS;
    add(area, points);
  }

  // --- Invites ---
  if (inviteCount > 0) {
    add(HANGEL_AREA, inviteCount * INVITE_AREA_POINTS);
  }

  // Round all totals to integers.
  for (const area of Object.keys(totals)) {
    totals[area] = Math.round(totals[area]);
  }

  return totals;
}
