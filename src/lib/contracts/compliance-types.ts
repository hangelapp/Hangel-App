/**
 * Compliance scoring schema for hangel sözleşme/politika dokümanları.
 *
 * Bu modül **saf TypeScript** tipleridir; Firestore admin SDK, browser, ya da
 * Node.js script bağlamı fark etmeksizin import edilebilir. Yan etki yoktur.
 *
 * Veri akışı:
 *   contracts/{slug}.content (markdown)
 *      │
 *      ▼  compliance-engine (rule-based, deterministic, LLM YOK)
 *      │
 *      ▼
 *   contractCompliance/{slug}__{jurisdiction}  ← ComplianceScore docs
 *
 * Doc id formatı: `{contractSlug}__{jurisdiction}` (ör. "tr-kvkk__TR").
 * Tek doc / (slug, jurisdiction) çifti. Idempotent yazım.
 */

/**
 * Genişletilmiş jurisdiction kümesi.
 *
 * Not: `src/lib/contracts/jurisdiction.ts`'teki runtime routing bucket'larından
 * (TR / EU / UK / US-CA / US-OTHER / OTHER) farklıdır — burada **ülke düzeyinde**
 * scoring yapıyoruz. Bir contract aynı anda farklı 12 jurisdiction için ayrı
 * skor üretir; bunlar admin uyum matrisinde gösterilir.
 */
export const COMPLIANCE_JURISDICTIONS = [
  'TR',     // Türkiye — KVKK + ikincil mevzuat
  'EU',     // GDPR + e-Privacy + DSA + DMA
  'UK',     // UK GDPR + DPA 2018 + PECR
  'US-CA',  // CCPA / CPRA
  'DE',     // BDSG + GDPR
  'FR',     // Loi Informatique et Libertés + GDPR
  'ES',     // LOPDGDD + GDPR
  'IT',     // Codice Privacy + GDPR
  'CA',     // PIPEDA + provincial
  'AU',     // Privacy Act 1988 + APPs
  'JP',     // APPI (個人情報保護法)
  'BR',     // LGPD
] as const;

export type ComplianceJurisdiction = typeof COMPLIANCE_JURISDICTIONS[number];

/**
 * Severity tier for a missing required topic. Determines admin UI sort order
 * and whether `contractCompliance.score` should be considered "blocking" for
 * publication.
 */
export type ComplianceSeverity = 'high' | 'medium' | 'low';

export interface CompliantSection {
  /** Markdown başlığı (## ile başlayan satırın text içeriği). */
  heading: string;
  /** Bu başlığın karşıladığı zorunlu mevzuat referansları. */
  matchedLaws: string[];
}

export interface MissingSection {
  /** Karşılanmamış zorunlu konunun makine-okur kimliği (topic id). */
  topic: string;
  /** İlgili mevzuat madde/kanun referansları. */
  requiredLaws: string[];
  severity: ComplianceSeverity;
}

export interface ComplianceSuggestion {
  /** Hangi missing topic'i karşıladığı. */
  topic: string;
  /** Önerilen şablon metni (kısa, Markdown). */
  sourceText: string;
  /** Varsa `docs/contracts/` altındaki referans markdown docId. */
  sourceDoc?: string;
}

/**
 * Bir (contractSlug, jurisdiction) çiftine ait skor. Firestore'da
 * `contractCompliance/{slug}__{jurisdiction}` doc id'si ile saklanır.
 */
export interface ComplianceScore {
  contractSlug: string;
  jurisdiction: ComplianceJurisdiction;
  /** 0-100. (matched / total required topics) * 100, integer'a yuvarlanmış. */
  score: number;
  compliantSections: CompliantSection[];
  missingSections: MissingSection[];
  suggestions: ComplianceSuggestion[];
  /** ISO 8601 timestamp. */
  lastScoredAt: string;
}

/**
 * `contractCompliance` doc id deterministik üretici. Slug normalize edilir
 * (küçük harf, alfanümerik + tire), jurisdiction olduğu gibi append edilir.
 *
 * NOT: Şu anda contracts/{slug} doc id'leri zaten normalize biçimde
 * yazıldığı için bu fonksiyon idempotent davranır.
 */
export function buildComplianceDocId(slug: string, jurisdiction: ComplianceJurisdiction): string {
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${safe}__${jurisdiction}`;
}

/** Type guard for incoming jurisdiction strings (e.g. query params). */
export function isComplianceJurisdiction(value: string): value is ComplianceJurisdiction {
  return (COMPLIANCE_JURISDICTIONS as readonly string[]).includes(value);
}
