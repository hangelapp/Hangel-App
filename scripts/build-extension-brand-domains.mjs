#!/usr/bin/env node
/**
 * Chrome Extension için marka domain listesi üretir (Faz 2 — narrow scope manifest).
 *
 * 1. fetchAllAgencyOffers() ile 150+ markanın targetDomain'ini topla.
 * 2. chrome-extension/store-listing/brand-domains.json'a iki formatta yaz:
 *    - matches: manifest.json content_scripts.matches dizisi
 *    - hostPermissions: manifest.json host_permissions dizisi (hangel + markalar)
 *    - domains: temiz domain listesi (debug)
 * 3. chrome-extension/store-listing/manifest-narrow.json: mevcut manifest'in
 *    klonu, ama <all_urls> yerine marka match'leri + host_permissions zenginleştirilmiş.
 *
 * Manifest.json'a otomatik kopyalanmaz — kullanıcı Chrome Web Store onayı
 * geldikten sonra NARROW-SCOPE-MIGRATION.md adımlarıyla manual uygular.
 *
 * Kullanım: node scripts/build-extension-brand-domains.mjs
 *   (Firebase auth gerekmez, sadece HasOffers API çağrısı.)
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXT_DIR = join(ROOT, 'chrome-extension');
const OUT_DIR = join(EXT_DIR, 'store-listing');
const DOMAINS_OUT = join(OUT_DIR, 'brand-domains.json');
const MANIFEST_OUT = join(OUT_DIR, 'manifest-narrow.json');
const MANIFEST_SRC = join(EXT_DIR, 'manifest.json');

// Domain'i temizle: protokol, path, query, www, port → bare apex/subdomain.
function normalizeDomain(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let d = raw.trim().toLowerCase();
  if (!d) return null;
  // URL ise hostname'i çek
  if (d.startsWith('http://') || d.startsWith('https://') || d.startsWith('//')) {
    try {
      const u = new URL(d.startsWith('//') ? `https:${d}` : d);
      d = u.hostname;
    } catch {
      return null;
    }
  }
  // path/query temizle
  d = d.replace(/[/?#].*$/, '');
  // port temizle
  d = d.replace(/:\d+$/, '');
  // www. ön ekini kaldır → match pattern `*.domain.com` zaten www'i kapsar
  d = d.replace(/^www\./, '');
  // basit validasyon: en az bir nokta, sadece harf/rakam/tire/nokta
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)) return null;
  return d;
}

function buildMatchPattern(domain) {
  // *.domain.com/* hem apex hem alt domain'leri kapsar
  return `https://*.${domain}/*`;
}

async function main() {
  console.log('[build-extension-brand-domains] HasOffers API çağrılıyor...');
  const { fetchAllAgencyOffers } = await import('../src/lib/api-clients.ts');
  const brands = await fetchAllAgencyOffers();
  console.log(`[build-extension-brand-domains] ${brands.length} marka alındı.`);

  // Domain'leri topla + dedupe
  const domainSet = new Set();
  const skipped = [];
  for (const b of brands) {
    const d = normalizeDomain(b.targetDomain);
    if (!d) {
      skipped.push({ name: b.name, raw: b.targetDomain });
      continue;
    }
    domainSet.add(d);
  }
  const domains = Array.from(domainSet).sort();
  const matches = domains.map(buildMatchPattern);

  // host_permissions: hangel.org + tüm marka domain'leri
  const hostPermissions = ['https://hangel.org/*', ...matches];

  const domainsPayload = {
    generatedAt: new Date().toISOString(),
    brandCount: brands.length,
    domainCount: domains.length,
    skippedCount: skipped.length,
    matches,
    hostPermissions,
    domains,
    skipped,
  };

  writeFileSync(DOMAINS_OUT, JSON.stringify(domainsPayload, null, 2) + '\n', 'utf8');
  console.log(`[build-extension-brand-domains] ${DOMAINS_OUT} (${domains.length} domain, ${skipped.length} skip)`);

  // Mevcut manifest'i klonla → narrow scope
  const manifestRaw = readFileSync(MANIFEST_SRC, 'utf8');
  const manifest = JSON.parse(manifestRaw);

  manifest.host_permissions = hostPermissions;
  if (Array.isArray(manifest.content_scripts)) {
    manifest.content_scripts = manifest.content_scripts.map((cs) => ({
      ...cs,
      matches,
    }));
  }
  if (Array.isArray(manifest.web_accessible_resources)) {
    manifest.web_accessible_resources = manifest.web_accessible_resources.map((war) => ({
      ...war,
      matches,
    }));
  }

  writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`[build-extension-brand-domains] ${MANIFEST_OUT}`);
  console.log('[build-extension-brand-domains] Tamam. manifest.json otomatik güncellenmedi — NARROW-SCOPE-MIGRATION.md\'ye bak.');
}

main().catch((err) => {
  console.error('[build-extension-brand-domains] HATA:', err);
  process.exit(1);
});
