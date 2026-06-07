/**
 * scripts/match-platforms.mjs
 *
 * 6 STK platformunun scrape edilmiş üye listelerini registryDernekler +
 * registryVakiflar koleksiyonlarındaki kayıtlarla eşleştirir ve eşleşen
 * dokümanlara `platforms` arrayUnion('PlatformAdı') yazar.
 *
 * Strateji:
 *   1. Tüm registryDernekler/Vakıflar nameLower → docId index'i bellekte tut
 *      (~107K doc, ~10 MB; tek seferlik startup ~30s).
 *   2. Her platform için scraped name'leri normalize et:
 *      - Türkçe locale lowercase
 *      - Diakritik strip (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u)
 *      - "derneği/vakfı" suffix'i sondan kaldır
 *      - "ve" "için" gibi stop words'leri at
 *      - Token set
 *   3. Match:
 *      (a) EXACT nameLower match (en güvenilir)
 *      (b) Substring: registry name normalize edilmiş içinde scrape edilmiş
 *          token set'inin %75'i geçiyorsa eşle
 *   4. Eşleşen doc'lara `platforms` arrayUnion('PlatformAdı')
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/match-platforms.mjs [--dry-run] [--platform=acikacik]
 */
import admin from 'firebase-admin';
import { readFileSync, writeFileSync } from 'node:fs';
import { FieldValue } from 'firebase-admin/firestore';

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyPlatform = args.find((a) => a.startsWith('--platform='))?.split('=')[1];

// Platform key → (jsonPath, label, includesType)
const PLATFORMS = {
  acikacik:      { json: '/tmp/scrape-acikacik.json',      label: 'Açık Açık' },
  abilitypool:   { json: '/tmp/scrape-abilitypool.json',   label: 'Ability Pool' },
  helpsteps:     { json: '/tmp/scrape-helpsteps.json',     label: 'HelpSteps' },
  gonulluyuzbiz: { json: '/tmp/scrape-gonulluyuzbiz.json', label: 'gonulluyuzbiz.gov.tr' },
  adimadim:      { json: '/tmp/scrape-adimadim.json',      label: 'Adım Adım', optional: true },
  // Afet Platformu — manuel kısaltma map ile ayrı script (afet-platform-map.mjs)
};

// Normalize: lowercase + diakritik strip + suffix trim + stop word filter
function normalize(name) {
  if (!name) return '';
  let s = name.toLocaleLowerCase('tr');
  s = s.replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
       .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
       .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
  s = s.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

const STOP = new Set(['ve', 'icin', 'ile', 'bir', 'da', 'de', 'ya', 'mi', 'mu', 'mü', 'mı']);
const SUFFIX_PATTERNS = [
  / dernegi$/, / dernek$/, / vakfi$/, / vakif$/, / vakf$/, / federasyonu$/,
  / cemiyeti$/, / kurulusu$/, / kulubu$/, / spor kulubu$/,
];

function tokens(name) {
  let s = normalize(name);
  for (const re of SUFFIX_PATTERNS) s = s.replace(re, '');
  return s.split(' ').filter((t) => t.length > 1 && !STOP.has(t));
}

function tokenOverlap(a, b) {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  let hit = 0;
  for (const t of a) if (setB.has(t)) hit += 1;
  return hit / a.length;
}

async function loadRegistry(collection) {
  console.log(`  loading ${collection}...`);
  const arr = []; // { id, name, nameLower, normalizedName, tokens }
  const PAGE = 5000;
  let lastDoc = null;
  while (true) {
    let q = db.collection(collection).orderBy('__name__').limit(PAGE);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      const d = doc.data();
      const name = d.name || '';
      arr.push({
        id: doc.id,
        name,
        nameLower: d.nameLower || normalize(name),
        normalizedName: normalize(name),
        tokens: tokens(name),
      });
    }
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
  }
  console.log(`  ${collection}: ${arr.length} docs loaded`);
  return arr;
}

function findMatch(scrapedName, registry) {
  const sNorm = normalize(scrapedName);
  const sTokens = tokens(scrapedName);

  // (a) Exact nameLower match (büyük olasılıkla isabet)
  const exact = registry.find((r) => r.nameLower === sNorm);
  if (exact) return { match: exact, score: 1.0, method: 'exact' };

  // (b) Diakritik-strip match (nameLower'da diakritik var, normalize'da yok)
  const exactNorm = registry.find((r) => r.normalizedName === sNorm);
  if (exactNorm) return { match: exactNorm, score: 0.99, method: 'norm-exact' };

  if (sTokens.length < 2) return null; // tek-token match riskli

  // (c) Token overlap: scrape tokens'ın %75+'sı registry name'inde var
  const candidates = [];
  for (const r of registry) {
    const overlap = tokenOverlap(sTokens, r.tokens);
    if (overlap >= 0.75) candidates.push({ r, overlap });
  }
  if (candidates.length === 0) return null;
  // En yüksek skorlu ve registry tokens'ı en kısa olan (best fit) seç
  candidates.sort((a, b) => b.overlap - a.overlap || a.r.tokens.length - b.r.tokens.length);
  const best = candidates[0];
  // Ambiguity check: 2+ candidate çok yakınsa skip (false positive riski)
  if (candidates.length > 1 && candidates[1].overlap >= best.overlap - 0.05) {
    // Çok yakın 2 candidate var, sadece tokens uzunluğu birebir aynıysa seç
    const ties = candidates.filter((c) => c.overlap >= best.overlap - 0.05);
    if (ties.length > 1) return null; // belirsiz, atla
  }
  return { match: best.r, score: best.overlap, method: 'token-overlap' };
}

async function processPlatform(key, cfg, vakiflar, dernekler) {
  let raw;
  try { raw = JSON.parse(readFileSync(cfg.json, 'utf8')); }
  catch (e) {
    if (cfg.optional) { console.log(`  ${key}: dosya yok, atlandı`); return null; }
    throw e;
  }
  const items = raw.items || [];
  console.log(`\n=== ${cfg.label} (${items.length} STK) ===`);

  const report = { matched: [], unmatched: [] };
  for (const it of items) {
    const candidates = [
      findMatch(it.name, dernekler),
      findMatch(it.name, vakiflar),
    ].filter(Boolean);
    if (candidates.length === 0) { report.unmatched.push(it.name); continue; }
    // İkisi de eşleşirse en yüksek skorluyu al
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const collection = best === candidates[0] && dernekler.includes(best.match)
      ? 'registryDernekler' : 'registryVakiflar';
    report.matched.push({
      scraped: it.name,
      docId: best.match.id,
      registryName: best.match.name,
      collection: dernekler.find((d) => d.id === best.match.id) ? 'registryDernekler' : 'registryVakiflar',
      method: best.method,
      score: Number(best.score.toFixed(3)),
    });
  }

  console.log(`  ✓ matched:   ${report.matched.length}`);
  console.log(`  ✗ unmatched: ${report.unmatched.length}`);

  // Write (Firestore arrayUnion platforms)
  if (!dryRun && report.matched.length > 0) {
    let pending = 0;
    let batch = db.batch();
    for (const m of report.matched) {
      const ref = db.collection(m.collection).doc(m.docId);
      batch.set(ref, {
        platforms: FieldValue.arrayUnion(cfg.label),
        updatedAt: Date.now(),
      }, { merge: true });
      pending += 1;
      if (pending >= 400) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
    if (pending > 0) await batch.commit();
    console.log(`  → wrote platforms to ${report.matched.length} docs`);
  }
  return report;
}

async function main() {
  console.log(`Match-Platforms run${dryRun ? ' (DRY-RUN)' : ''}${onlyPlatform ? ` [${onlyPlatform} only]` : ''}\n`);
  console.log('Loading registry collections...');
  const [vakiflar, dernekler] = await Promise.all([
    loadRegistry('registryVakiflar'),
    loadRegistry('registryDernekler'),
  ]);

  const allReports = {};
  for (const [key, cfg] of Object.entries(PLATFORMS)) {
    if (onlyPlatform && key !== onlyPlatform) continue;
    const report = await processPlatform(key, cfg, vakiflar, dernekler);
    if (report) allReports[key] = report;
  }

  // Detaylı rapor JSON
  const reportPath = '/tmp/match-platforms-report.json';
  writeFileSync(reportPath, JSON.stringify(allReports, null, 2));
  console.log(`\nDetailed report: ${reportPath}`);
  console.log('\n=== SUMMARY ===');
  for (const [k, r] of Object.entries(allReports)) {
    console.log(`  ${k.padEnd(15)} matched=${String(r.matched.length).padStart(3)} unmatched=${String(r.unmatched.length).padStart(3)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
