/**
 * Contract registry — maps each (jurisdiction, contractType) pair to the
 * canonical document id (the markdown file under `docs/contracts/{docId}.md`).
 *
 * `docId` matches the filename WITHOUT the `.md` extension. Markdown files are
 * authored by the legal-content agents; this file only references them by id so
 * the routing layer never has to inspect the markdown source.
 *
 * Adding a new jurisdiction:
 *   1. Add the bucket in `jurisdiction.ts` (`JURISDICTIONS` const + bucket logic).
 *   2. Add a row in `CONTRACT_REGISTRY` below with the docId for each type.
 *   3. Drop the markdown files into `docs/contracts/`.
 *   4. The loader/page/admin UI pick them up automatically — no further wiring.
 */

import type { Jurisdiction } from './jurisdiction';

/** Supported contract / policy document types. */
export const CONTRACT_TYPES = [
  'tos',          // Terms of service / user agreement
  'privacy',      // Privacy policy (GDPR / KVKK / CCPA …)
  'kvkk',         // KVKK aydınlatma metni (TR-specific but exposed under generic id)
  'cookies',      // Cookie policy / e-Privacy
  'donor',        // Donor / bağışçı agreement
  'volunteer',    // Volunteer / gönüllülük agreement
  'child',        // Children's data (COPPA / KVKK md.10)
] as const;

export type ContractType = typeof CONTRACT_TYPES[number];

/** Internal mapping: `jurisdiction → contractType → docId | null`. */
export type ContractRegistry = Record<Jurisdiction, Partial<Record<ContractType, string>>>;

/**
 * Initial registry. `null`/missing entries mean "fall back to the default
 * jurisdiction (TR)". docId values match files under `docs/contracts/`.
 *
 * Markdown filenames may be created by the legal-content agents; only the
 * documents listed under `docs/contracts/` today resolve. Anything else
 * returns `notFound()` at the page layer until the markdown lands.
 */
export const CONTRACT_REGISTRY: ContractRegistry = {
  TR: {
    tos: 'tr-kullanici-sozlesmesi',
    privacy: 'tr-gizlilik-politikasi',
    kvkk: 'tr-kvkk-aydinlatma',
    cookies: 'tr-cerez-politikasi',
    donor: 'tr-bagisci-sozlesmesi',
    volunteer: 'tr-gonulluluk-sozlesmesi',
    child: 'tr-acik-riza-saglik-verisi',
  },
  EU: {
    tos: 'eu-terms-of-service',
    privacy: 'eu-privacy-policy',
    cookies: 'eu-cookie-policy',
    donor: 'eu-donor-agreement',
    volunteer: 'eu-volunteer-agreement',
    child: 'eu-child-data-policy',
  },
  UK: {
    tos: 'uk-terms-of-service',
    privacy: 'uk-privacy-policy',
    cookies: 'uk-cookie-policy',
    donor: 'uk-donor-agreement',
    volunteer: 'uk-volunteer-agreement',
    child: 'uk-child-data-policy',
  },
  'US-CA': {
    tos: 'us-ca-terms-of-service',
    privacy: 'us-ca-privacy-policy',
    cookies: 'us-ca-cookie-policy',
    donor: 'us-ca-donor-agreement',
    volunteer: 'us-ca-volunteer-agreement',
    child: 'us-ca-child-data-policy',
  },
  'US-OTHER': {
    tos: 'us-terms-of-service',
    privacy: 'us-privacy-policy',
    cookies: 'us-cookie-policy',
    donor: 'us-donor-agreement',
    volunteer: 'us-volunteer-agreement',
    child: 'us-child-data-policy',
  },
  OTHER: {
    // Falls through to TR — explicit override only when intentional.
  },
};

/**
 * Returns the docId for a given (jurisdiction, contractType) pair, falling
 * back to the TR set, then `null` if nothing matches.
 */
export function resolveDocId(jurisdiction: Jurisdiction, type: ContractType): string | null {
  const direct = CONTRACT_REGISTRY[jurisdiction]?.[type];
  if (direct) return direct;
  const tr = CONTRACT_REGISTRY.TR?.[type];
  return tr ?? null;
}

/** Human-readable label for the type (used in admin lists & breadcrumbs). */
export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  tos: 'Kullanım Şartları',
  privacy: 'Gizlilik Politikası',
  kvkk: 'KVKK Aydınlatma Metni',
  cookies: 'Çerez Politikası',
  donor: 'Bağışçı Sözleşmesi',
  volunteer: 'Gönüllülük Sözleşmesi',
  child: 'Çocuk Verisi Politikası',
};

/** Type guard for URL `[type]` route params. */
export function isContractType(value: string): value is ContractType {
  return (CONTRACT_TYPES as readonly string[]).includes(value);
}
