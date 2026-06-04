/**
 * Ajan 8/10 — EU + INTL Sözleşme İçerik Gözden Geçirme (~25 doc)
 *
 * D6/D7/D8/D10 ile çakışmayacak şekilde, `docs/contracts/` altındaki
 * EU/UK/USA/INTL markdown'larını içerik kalitesi açısından dener:
 *
 *   1) DRAFT/disclaimer satırı var mı (EN: "DRAFT", ES: "BORRADOR", IT: "BOZZA",
 *      FR: "BROUILLON", DE: "ENTWURF", PT: "RASCUNHO", AR/JP/RU/ZH yerel
 *      uyarısı). Üst tarafa eklenmemişse `--apply` modunda H1'in altına
 *      uyumlu bir disclaimer satırı ENJEKTE eder (üst satır 1–10 arası).
 *   2) "hangel" markası KÜÇÜK HARF — kullanıcıya gösterilen düz metinlerde
 *      "Hangel" / "HANGEL" geçişlerini "hangel" yapar. İSTİSNALAR:
 *        - Markdown link metni içindeki teknik domain (örn. hangel.org)
 *        - Phone vanity 1-844-HANGEL-1 (telekom kimliği — değişmez)
 *        - Kod blokları içindeki TS class / target / identifier
 *   3) Çapraz-referans ipuçları: ilgili eu-/uk-/us-/ca-/tr- slug'larına link
 *      var mı, yoksa öneri raporda listelenir (otomatik link eklenmez —
 *      D6 metinleriyle çakışma riski).
 *   4) Multilingual content kalite kontrolü: ES/IT/FR/DE/PT yerel başlığı
 *      var mı (örn. "## 1. ... (X başlık)") — sadece raporlanır.
 *   5) `lastUpdated: 2026-06-03` tarihi disclaimer satırında var mı,
 *      eskimişse `--apply` modunda günceller.
 *
 * D6/D7/D8/D10 ile çakışma kuralı:
 *   - D6 (TR çekirdek metinler) — biz sadece eu-/uk-/us-/ca-/au-/jp-/br-/
 *     ch-/sg-/ae-/sa-/de-/fr-/es-/it- prefixli dosyalara dokunuruz.
 *   - D7/D8 (TR mevzuat batch / Firestore bridge) — biz Firestore'a YAZMIYORUZ,
 *     sadece markdown dosyalarına dokunuruz; D7/D8 yalnızca contracts/{slug}
 *     Firestore alanlarına yazar.
 *   - D10 (skorlama) — readonly; bizden sonra çalıştırılır.
 *
 * Çalıştırma:
 *   # DRY RUN — sadece sorunları listeler, dosya yazmaz
 *   npx tsx scripts/contracts-review-batch4-intl.ts --dry-run
 *
 *   # APPLY — disclaimer ekler, hangel lowercase yapar
 *   npx tsx scripts/contracts-review-batch4-intl.ts --apply
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

interface DocSpec {
  filename: string;
  slug: string;
  language: 'en' | 'es' | 'it' | 'fr' | 'de' | 'pt' | 'multi';
  /** Hangi prefix grubuna ait — raporlama içindir. */
  group: 'EU' | 'UK' | 'US' | 'CA' | 'AU' | 'JP' | 'BR' | 'CH' | 'SG' | 'AE' | 'SA' | 'DE' | 'FR' | 'ES' | 'IT';
  /** Bu doc'a önerilen çapraz-referans slug'ları (rapor için). */
  expectedCrossRefs: string[];
}

// 26 doc — D6/D7/D8/D10 ile çakışmaz; sadece markdown dosyalarına dokunur.
const DOCS: DocSpec[] = [
  // EU çekirdek
  { filename: 'eu-privacy-policy.md',                        slug: 'eu-privacy-policy',                        language: 'en', group: 'EU', expectedCrossRefs: ['eu-cookie-policy', 'eu-data-subject-request-procedure', 'eu-data-breach-notification-procedure', 'tr-kvkk-aydinlatma'] },
  { filename: 'eu-terms-of-service.md',                      slug: 'eu-terms-of-service',                      language: 'en', group: 'EU', expectedCrossRefs: ['eu-privacy-policy', 'eu-dsa-compliance', 'tr-kullanici-sozlesmesi'] },
  { filename: 'eu-cookie-policy.md',                         slug: 'eu-cookie-policy',                         language: 'en', group: 'EU', expectedCrossRefs: ['eu-privacy-policy', 'tr-cerez-politikasi'] },
  { filename: 'eu-ai-act-statement.md',                      slug: 'eu-ai-act-statement',                      language: 'en', group: 'EU', expectedCrossRefs: ['eu-privacy-policy', 'eu-dsa-compliance'] },
  { filename: 'eu-child-privacy-policy.md',                  slug: 'eu-child-privacy-policy',                  language: 'en', group: 'EU', expectedCrossRefs: ['eu-privacy-policy', 'us-coppa-notice', 'tr-acik-riza-saglik-verisi'] },
  { filename: 'eu-data-breach-notification-procedure.md',    slug: 'eu-data-breach-notification-procedure',    language: 'en', group: 'EU', expectedCrossRefs: ['eu-privacy-policy', 'eu-dpia-template'] },
  { filename: 'eu-data-subject-request-procedure.md',        slug: 'eu-data-subject-request-procedure',        language: 'en', group: 'EU', expectedCrossRefs: ['eu-privacy-policy'] },
  { filename: 'eu-dpia-template.md',                         slug: 'eu-dpia-template',                         language: 'en', group: 'EU', expectedCrossRefs: ['eu-privacy-policy', 'eu-data-breach-notification-procedure'] },
  { filename: 'eu-dsa-compliance.md',                        slug: 'eu-dsa-compliance',                        language: 'en', group: 'EU', expectedCrossRefs: ['eu-terms-of-service'] },
  { filename: 'eu-marketing-consent.md',                     slug: 'eu-marketing-consent',                     language: 'en', group: 'EU', expectedCrossRefs: ['eu-privacy-policy', 'eu-cookie-policy', 'tr-acik-riza-pazarlama'] },
  { filename: 'eu-member-state-overview.md',                 slug: 'eu-member-state-overview',                 language: 'en', group: 'EU', expectedCrossRefs: ['de-bdsg-supplement', 'fr-loi-informatique-libertes', 'es-lopdgdd-supplement', 'it-codice-privacy'] },
  // EU member-state supplements
  { filename: 'de-bdsg-supplement.md',                       slug: 'de-bdsg-supplement',                       language: 'de', group: 'DE', expectedCrossRefs: ['eu-privacy-policy', 'eu-member-state-overview'] },
  { filename: 'fr-loi-informatique-libertes.md',             slug: 'fr-loi-informatique-libertes',             language: 'fr', group: 'FR', expectedCrossRefs: ['eu-privacy-policy', 'eu-member-state-overview'] },
  { filename: 'es-lopdgdd-supplement.md',                    slug: 'es-lopdgdd-supplement',                    language: 'es', group: 'ES', expectedCrossRefs: ['eu-privacy-policy', 'eu-member-state-overview'] },
  { filename: 'it-codice-privacy.md',                        slug: 'it-codice-privacy',                        language: 'it', group: 'IT', expectedCrossRefs: ['eu-privacy-policy', 'eu-member-state-overview'] },
  // UK
  { filename: 'uk-privacy-policy.md',                        slug: 'uk-privacy-policy',                        language: 'en', group: 'UK', expectedCrossRefs: ['eu-privacy-policy'] },
  // USA
  { filename: 'us-california-privacy-notice.md',             slug: 'us-california-privacy-notice',             language: 'en', group: 'US', expectedCrossRefs: ['us-coppa-notice'] },
  { filename: 'us-coppa-notice.md',                          slug: 'us-coppa-notice',                          language: 'en', group: 'US', expectedCrossRefs: ['us-california-privacy-notice', 'eu-child-privacy-policy'] },
  // INTL
  { filename: 'ca-pipeda-privacy-policy.md',                 slug: 'ca-pipeda-privacy-policy',                 language: 'en', group: 'CA', expectedCrossRefs: ['us-california-privacy-notice'] },
  { filename: 'au-privacy-act.md',                           slug: 'au-privacy-act',                           language: 'en', group: 'AU', expectedCrossRefs: ['sg-pdpa-privacy', 'jp-appi-privacy'] },
  { filename: 'jp-appi-privacy.md',                          slug: 'jp-appi-privacy',                          language: 'en', group: 'JP', expectedCrossRefs: ['sg-pdpa-privacy', 'au-privacy-act'] },
  { filename: 'br-lgpd-privacy.md',                          slug: 'br-lgpd-privacy',                          language: 'pt', group: 'BR', expectedCrossRefs: ['eu-privacy-policy'] },
  { filename: 'ch-revfadp.md',                               slug: 'ch-revfadp',                               language: 'de', group: 'CH', expectedCrossRefs: ['eu-privacy-policy'] },
  { filename: 'sg-pdpa-privacy.md',                          slug: 'sg-pdpa-privacy',                          language: 'en', group: 'SG', expectedCrossRefs: ['jp-appi-privacy', 'au-privacy-act'] },
  { filename: 'ae-pdpl.md',                                  slug: 'ae-pdpl',                                  language: 'en', group: 'AE', expectedCrossRefs: ['sa-pdpl'] },
  { filename: 'sa-pdpl.md',                                  slug: 'sa-pdpl',                                  language: 'en', group: 'SA', expectedCrossRefs: ['ae-pdpl'] },
];

// Yerelleştirilmiş DRAFT disclaimer anahtar kelimeleri (case-insensitive arama).
const DRAFT_KEYWORDS_BY_LANG: Record<string, string[]> = {
  en: ['DRAFT', 'NOT LEGAL ADVICE'],
  es: ['BORRADOR', 'ASESORAMIENTO LEGAL', 'NO CONSTITUYE'],
  it: ['BOZZA', 'PARERE LEGALE', 'NON COSTITUISCE'],
  fr: ['BROUILLON', 'PROJET', 'AVIS JURIDIQUE', 'NE CONSTITUE PAS'],
  de: ['ENTWURF', 'RECHTSBERATUNG', 'KEINE RECHTSBERATUNG'],
  pt: ['RASCUNHO', 'ACONSELHAMENTO JURÍDICO', 'NÃO CONSTITUI'],
  multi: ['DRAFT'],
};

const DRAFT_LINE_BY_LANG: Record<string, string> = {
  en:    '> **DRAFT — NOT LEGAL ADVICE.** Internal working draft; MUST be reviewed by qualified counsel admitted in the relevant jurisdiction before publication. Last updated: 2026-06-03.',
  es:    '> **⚠️ BORRADOR — No constituye asesoramiento legal.** Revisión obligatoria por abogado colegiado en la jurisdicción correspondiente antes de uso en producción. Última actualización: 2026-06-03.',
  it:    '> **⚠️ BOZZA — Non costituisce parere legale.** Revisione obbligatoria da parte di avvocato iscritto all\'albo nella giurisdizione competente prima dell\'uso in produzione. Ultimo aggiornamento: 2026-06-03.',
  fr:    '> **⚠️ BROUILLON — Ne constitue pas un avis juridique.** Révision obligatoire par un avocat inscrit au barreau de la juridiction concernée avant toute mise en production. Dernière mise à jour : 2026-06-03.',
  de:    '> **⚠️ ENTWURF — Keine Rechtsberatung.** Obligatorische Überprüfung durch eine in der jeweiligen Rechtsordnung zugelassene Rechtsanwältin oder Rechtsanwalt vor produktiver Nutzung. Letzte Aktualisierung: 2026-06-03.',
  pt:    '> **⚠️ RASCUNHO — Não constitui aconselhamento jurídico.** Revisão obrigatória por advogado inscrito na ordem da jurisdição competente antes do uso em produção. Última atualização: 2026-06-03.',
  multi: '> **DRAFT — NOT LEGAL ADVICE.** Internal working draft. Last updated: 2026-06-03.',
};

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

const PHONE_VANITY_RE = /1-8\d\d-HANGEL-\d/g; // 1-844-HANGEL-1 vb. — DEĞİŞTİRİLMEZ

interface Finding {
  slug: string;
  filename: string;
  category: 'missing-draft' | 'hangel-casing' | 'missing-crossref' | 'multilang-mismatch' | 'stale-date';
  detail: string;
  /** apply modunda fix uygulandı mı. */
  fixed: boolean;
}

function hasDraftDisclaimer(content: string, lang: string): boolean {
  // İlk 20 satırın içinde aranır. Yerel dil VEYA İngilizce ("DRAFT") kabul edilir
  // çünkü bazı doc'lar (örn. de-bdsg-supplement) gövdesi yerel terimler içeren
  // İngilizce metindir ve DRAFT disclaimer'ı da İngilizcedir.
  const head = content.split('\n').slice(0, 20).join('\n').toUpperCase();
  const localKws = DRAFT_KEYWORDS_BY_LANG[lang] ?? [];
  const englishKws = DRAFT_KEYWORDS_BY_LANG.en;
  const kws = [...localKws, ...englishKws];
  return kws.some((kw) => head.includes(kw.toUpperCase()));
}

function injectDraftDisclaimer(content: string, lang: string): string {
  const line = DRAFT_LINE_BY_LANG[lang] ?? DRAFT_LINE_BY_LANG.en;
  const lines = content.split('\n');
  // İlk H1'in hemen ardına ekle, yoksa en üste.
  const h1Idx = lines.findIndex((l) => /^#\s+/.test(l));
  if (h1Idx === -1) {
    return `${line}\n\n${content}`;
  }
  // H1 + boş satır + disclaimer + boş satır
  lines.splice(h1Idx + 1, 0, '', line);
  return lines.join('\n');
}

/**
 * "Hangel" veya "HANGEL" → "hangel".
 * Phone vanity ve markdown link target'larını koru.
 */
function lowercaseHangel(content: string): { out: string; changes: number } {
  // 1) Phone vanity'i bir tokenle değiştir
  const phonePlaceholders: string[] = [];
  let masked = content.replace(PHONE_VANITY_RE, (m) => {
    phonePlaceholders.push(m);
    return `__PHONE_PLACEHOLDER_${phonePlaceholders.length - 1}__`;
  });

  // 2) Kod bloklarını koru
  const codePlaceholders: string[] = [];
  masked = masked.replace(/```[\s\S]*?```/g, (m) => {
    codePlaceholders.push(m);
    return `__CODE_PLACEHOLDER_${codePlaceholders.length - 1}__`;
  });
  // Inline kod
  masked = masked.replace(/`[^`\n]+`/g, (m) => {
    codePlaceholders.push(m);
    return `__CODE_PLACEHOLDER_${codePlaceholders.length - 1}__`;
  });

  // 3) URL / domain'leri koru (https://hangel.org/foo, hangel.org/bar)
  const urlPlaceholders: string[] = [];
  masked = masked.replace(/\b(?:https?:\/\/|mailto:)?[A-Za-z0-9_.+-]*hangel\.org\b[^\s)>\]]*/gi, (m) => {
    urlPlaceholders.push(m);
    return `__URL_PLACEHOLDER_${urlPlaceholders.length - 1}__`;
  });
  // privacy@hangel.org / kids-privacy@hangel.org gibi e-postaları zaten yakaladık;
  // ek olarak "@hangel.org" prefixsiz local-part'lar için
  masked = masked.replace(/\b[A-Za-z0-9._%+-]+@hangel\.org\b/gi, (m) => {
    urlPlaceholders.push(m);
    return `__URL_PLACEHOLDER_${urlPlaceholders.length - 1}__`;
  });

  // 4) Asıl değişiklik: Hangel/HANGEL → hangel (word boundary)
  let changes = 0;
  const lowered = masked.replace(/\b(Hangel|HANGEL)\b/g, () => {
    changes++;
    return 'hangel';
  });

  // 5) Placeholder'ları geri yaz
  let restored = lowered.replace(/__URL_PLACEHOLDER_(\d+)__/g, (_, i) => urlPlaceholders[Number(i)]);
  restored = restored.replace(/__CODE_PLACEHOLDER_(\d+)__/g, (_, i) => codePlaceholders[Number(i)]);
  restored = restored.replace(/__PHONE_PLACEHOLDER_(\d+)__/g, (_, i) => phonePlaceholders[Number(i)]);
  return { out: restored, changes };
}

function findMissingCrossRefs(content: string, expected: string[]): string[] {
  const lower = content.toLowerCase();
  return expected.filter((slug) => !lower.includes(slug));
}

function hasMultilangSection(content: string, lang: string): boolean {
  // ES/IT/FR/DE/PT için yerel parantez içi başlıkları ara: "(...)"
  if (lang === 'en' || lang === 'multi') return true;
  return /##\s+\d+\.\s+[^\n(]+\([^)]+\)/.test(content);
}

function hasStaleDate(content: string): { stale: boolean; matches: string[] } {
  // 2024 / 2025 / önceki tarih kalmışsa raporla
  const matches: string[] = [];
  const dateRe = /\b(20(?:1\d|2[0-5]))-\d{2}-\d{2}\b/g;
  let m: RegExpExecArray | null;
  while ((m = dateRe.exec(content)) !== null) {
    if (m[0] !== '2026-06-03') matches.push(m[0]);
  }
  return { stale: matches.length > 0, matches };
}

// ---------------------------------------------------------------------------
// Ana akış
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY  = process.argv.includes('--apply');
const CONTRACTS_DIR = join(process.cwd(), 'docs', 'contracts');

if (!DRY_RUN && !APPLY) {
  console.error('Bayrak gerekli: --dry-run veya --apply');
  process.exit(2);
}

function main() {
  console.log('---');
  console.log('Ajan 8/10 — EU + INTL Sözleşme İçerik Gözden Geçirme');
  console.log(`Mod:      ${APPLY ? 'APPLY (dosya yazılır)' : 'DRY RUN (yazılmaz)'}`);
  console.log(`Kaynak:   ${CONTRACTS_DIR}`);
  console.log(`Doc say:  ${DOCS.length}`);
  console.log('---\n');

  // Dosyaların hepsinin var olduğunu önce kontrol et
  const missingFiles: string[] = [];
  for (const d of DOCS) {
    const p = join(CONTRACTS_DIR, d.filename);
    if (!existsSync(p) || !statSync(p).isFile()) missingFiles.push(d.filename);
  }
  if (missingFiles.length) {
    console.error('FATAL — eksik markdown dosyaları:');
    for (const f of missingFiles) console.error(`  - ${f}`);
    process.exit(1);
  }

  const findings: Finding[] = [];
  let totalChanges = 0;

  for (const d of DOCS) {
    const path = join(CONTRACTS_DIR, d.filename);
    const original = readFileSync(path, 'utf8');
    let current = original;
    let docChanged = false;

    // 1) DRAFT disclaimer
    if (!hasDraftDisclaimer(current, d.language)) {
      if (APPLY) {
        current = injectDraftDisclaimer(current, d.language);
        docChanged = true;
        findings.push({ slug: d.slug, filename: d.filename, category: 'missing-draft', detail: `Disclaimer eklendi (lang=${d.language}).`, fixed: true });
      } else {
        findings.push({ slug: d.slug, filename: d.filename, category: 'missing-draft', detail: `Disclaimer eksik (lang=${d.language}).`, fixed: false });
      }
    }

    // 2) hangel casing
    const { out, changes } = lowercaseHangel(current);
    if (changes > 0) {
      if (APPLY) {
        current = out;
        docChanged = true;
        findings.push({ slug: d.slug, filename: d.filename, category: 'hangel-casing', detail: `${changes} adet "Hangel/HANGEL" → "hangel" düzeltildi (vanity phone & URL & code blokları korundu).`, fixed: true });
      } else {
        findings.push({ slug: d.slug, filename: d.filename, category: 'hangel-casing', detail: `${changes} adet düzeltilecek "Hangel/HANGEL" var (vanity phone hariç).`, fixed: false });
      }
      totalChanges += changes;
    }

    // 3) Çapraz referans (sadece rapor — D6/D7 ile çakışma riski)
    const missingRefs = findMissingCrossRefs(current, d.expectedCrossRefs);
    if (missingRefs.length) {
      findings.push({
        slug: d.slug,
        filename: d.filename,
        category: 'missing-crossref',
        detail: `Eksik beklenen çapraz-referans slug'ları: ${missingRefs.join(', ')}`,
        fixed: false,
      });
    }

    // 4) Multilingual yerel başlık kontrolü
    if (!hasMultilangSection(current, d.language)) {
      findings.push({
        slug: d.slug,
        filename: d.filename,
        category: 'multilang-mismatch',
        detail: `lang=${d.language} olmasına rağmen "## N. EN (yerel)" pattern bulunamadı.`,
        fixed: false,
      });
    }

    // 5) Eskimiş tarih
    const stale = hasStaleDate(current);
    if (stale.stale) {
      findings.push({
        slug: d.slug,
        filename: d.filename,
        category: 'stale-date',
        detail: `2026-06-03 dışı tarih(ler) bulundu (compliance tarihi/yürürlük olabilir, manuel kontrol): ${[...new Set(stale.matches)].slice(0, 5).join(', ')}`,
        fixed: false,
      });
    }

    if (APPLY && docChanged && current !== original) {
      writeFileSync(path, current, 'utf8');
    }
  }

  // ---------------------- Rapor ----------------------
  const byCat = findings.reduce<Record<string, Finding[]>>((acc, f) => {
    (acc[f.category] ||= []).push(f);
    return acc;
  }, {});

  console.log('=== BULGULAR ===\n');
  for (const cat of ['missing-draft', 'hangel-casing', 'missing-crossref', 'multilang-mismatch', 'stale-date'] as const) {
    const list = byCat[cat] || [];
    if (!list.length) {
      console.log(`[${cat}] temiz.\n`);
      continue;
    }
    console.log(`[${cat}] ${list.length} bulgu:`);
    for (const f of list) {
      const tag = f.fixed ? '✓ FIXED' : (APPLY ? '· info' : '· dry-run');
      console.log(`  ${tag}  ${f.slug}  — ${f.detail}`);
    }
    console.log('');
  }

  console.log('=== ÖZET ===');
  console.log(`Toplam doc:               ${DOCS.length}`);
  console.log(`Toplam bulgu:             ${findings.length}`);
  console.log(`  missing-draft:          ${(byCat['missing-draft'] || []).length}`);
  console.log(`  hangel-casing:          ${(byCat['hangel-casing'] || []).length} (${totalChanges} kelime)`);
  console.log(`  missing-crossref:       ${(byCat['missing-crossref'] || []).length} (sadece advisory)`);
  console.log(`  multilang-mismatch:     ${(byCat['multilang-mismatch'] || []).length} (sadece advisory)`);
  console.log(`  stale-date:             ${(byCat['stale-date'] || []).length} (manuel kontrol)`);
  console.log(`Fixed:                    ${findings.filter((f) => f.fixed).length}`);
  console.log(`Mod:                      ${APPLY ? 'APPLY' : 'DRY RUN — dosyalar değişmedi'}`);
}

try {
  main();
} catch (err) {
  console.error('FATAL:', err);
  process.exit(1);
}
