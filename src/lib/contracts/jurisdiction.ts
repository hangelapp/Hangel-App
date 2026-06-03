/**
 * Jurisdiction detection for multi-region contract / policy routing.
 *
 * Priority order (highest → lowest):
 *   1. Explicit user profile country (`users/{uid}.country`, ISO 3166-1 alpha-2).
 *   2. Locale (e.g. `tr` → TR, `de` → EU, `fr` → EU, `en` → US-OTHER as a soft default).
 *   3. Request geo header (Vercel `x-vercel-ip-country`, Cloudflare `cf-ipcountry`,
 *      or Next.js `geo.country` exposed on middleware Request).
 *   4. Hard default: `TR` (hangel is Türkiye-based).
 *
 * Output bucket — collapses every supported country into one of six jurisdictions
 * that we maintain a contract set for. New buckets must be added BOTH here and in
 * `registry.ts` (otherwise loader falls back to `OTHER`).
 *
 * NOTE: This file is pure (no side effects, no Firestore/network). Safe for both
 * server (RSC, route handlers) and client. Edge runtime compatible.
 */

export const JURISDICTIONS = ['TR', 'EU', 'UK', 'US-CA', 'US-OTHER', 'OTHER'] as const;
export type Jurisdiction = typeof JURISDICTIONS[number];

export const DEFAULT_JURISDICTION: Jurisdiction = 'TR';

/** ISO 3166-1 alpha-2 → 27 EU member states. */
const EU_COUNTRIES = new Set<string>([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA (GDPR applies)
  'IS', 'LI', 'NO',
]);

/** Locale (ISO 639-1) → default jurisdiction guess used only when country is unknown. */
const LOCALE_DEFAULT: Record<string, Jurisdiction> = {
  tr: 'TR',
  de: 'EU',
  fr: 'EU',
  es: 'EU',
  it: 'EU',
  nl: 'EU',
  pt: 'EU',
  pl: 'EU',
  ru: 'OTHER',
  ar: 'OTHER',
  fa: 'OTHER',
  ha: 'OTHER',
  en: 'US-OTHER',
};

/**
 * Map a raw country code + optional US state into one of our jurisdiction buckets.
 *
 * `country` is case-insensitive; whitespace is trimmed. Unknown codes return `OTHER`.
 * `usState` is only consulted when `country === 'US'` and uses ISO 3166-2 region
 * codes (e.g. `'CA'` for California).
 */
export function bucketFromCountry(country: string | null | undefined, usState?: string | null): Jurisdiction {
  if (!country) return 'OTHER';
  const cc = country.trim().toUpperCase();
  if (!cc) return 'OTHER';
  if (cc === 'TR') return 'TR';
  if (cc === 'GB' || cc === 'UK') return 'UK';
  if (cc === 'US') {
    const region = (usState || '').trim().toUpperCase();
    return region === 'CA' ? 'US-CA' : 'US-OTHER';
  }
  if (EU_COUNTRIES.has(cc)) return 'EU';
  return 'OTHER';
}

/**
 * Inputs accepted by `resolveJurisdiction`. Every field is optional; the function
 * walks the priority chain and returns the first match.
 */
export interface JurisdictionInputs {
  /** User profile country (ISO 3166-1 alpha-2) — strongest signal. */
  profileCountry?: string | null;
  /** US state for users whose `profileCountry === 'US'` (lets us separate CA from rest). */
  profileUsState?: string | null;
  /** Active app locale (`tr` / `en` / `de` / `fr` / …). */
  locale?: string | null;
  /** Country code from edge geo header (Vercel / Cloudflare). */
  geoCountry?: string | null;
  /** US state from edge geo header (Vercel `x-vercel-ip-country-region`). */
  geoUsState?: string | null;
}

/**
 * Resolve a {@link Jurisdiction} bucket from the available signals. Pure function;
 * always returns a value (falls back to {@link DEFAULT_JURISDICTION}).
 */
export function resolveJurisdiction(inputs: JurisdictionInputs): Jurisdiction {
  if (inputs.profileCountry) {
    const fromProfile = bucketFromCountry(inputs.profileCountry, inputs.profileUsState);
    if (fromProfile !== 'OTHER') return fromProfile;
  }
  if (inputs.geoCountry) {
    const fromGeo = bucketFromCountry(inputs.geoCountry, inputs.geoUsState);
    if (fromGeo !== 'OTHER') return fromGeo;
  }
  if (inputs.locale) {
    const loc = inputs.locale.split('-')[0]?.toLowerCase();
    if (loc && LOCALE_DEFAULT[loc]) return LOCALE_DEFAULT[loc];
  }
  return DEFAULT_JURISDICTION;
}

/**
 * Read the standard edge geo headers used by Vercel & Cloudflare. Pass the
 * `Headers` instance from a Next.js server component / route handler.
 */
export function jurisdictionFromHeaders(headers: Headers): Pick<JurisdictionInputs, 'geoCountry' | 'geoUsState'> {
  const country =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-country-code') ||
    null;
  const region =
    headers.get('x-vercel-ip-country-region') ||
    headers.get('cf-region-code') ||
    null;
  return { geoCountry: country, geoUsState: region };
}

/** Human-readable label (used in jurisdiction dropdowns). */
export const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  TR: 'Türkiye (KVKK)',
  EU: 'Avrupa Birliği / EEA (GDPR)',
  UK: 'United Kingdom (UK GDPR + DPA 2018)',
  'US-CA': 'United States — California (CCPA/CPRA)',
  'US-OTHER': 'United States — Other states',
  OTHER: 'Other / Default',
};
