/**
 * scripts/match-afet-platformu.mjs
 *
 * Afet Platformu (afetplatformu.org.tr/uyelerimiz/) sayfasında sadece logo
 * dosyaları var, textual STK adı yok. /tmp/scrape-afetplatformu.json item
 * name'leri dosya slug'larından türetilmiş ("ACEV LOGO", "ahbaplogo" gibi).
 *
 * Bu script logo slug → gerçek STK adı manuel mapping kullanır. Sadece
 * kesin tanıdığım STK'lar map'lendi; belirsizler (ret, jci, leap, ingec,
 * tarde, faydası, 0ama4yhn7llob, 66d71ab9 vb.) atlandı.
 *
 * Eklenen platform: "Afet Platformu"
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/match-afet-platformu.mjs [--dry-run]
 */
import admin from 'firebase-admin';
import { writeFileSync } from 'node:fs';
import { FieldValue } from 'firebase-admin/firestore';

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Logo slug → tam STK adı (registry'de aratılacak). Düşük güven seviyesinde
// belirsizler dahil edilmedi (örn. "ret", "jci", "leap").
const KNOWN = [
  'Anne Çocuk Eğitim Vakfı',                        // ACEV LOGO
  'Hayata Destek İnsani Yardım Derneği',            // hayatadesteklogo
  'Ahbap Platformu Derneği',                        // ahbaplogo
  'Dünya Doktorları Derneği',                       // dünyadok
  'Türkiye İnsan Kaynakları Eğitim Vakfı',          // tikav logo
  'Uluslararası Mavi Hilal İnsani Yardım ve Kalkınma Vakfı', // ibc - International Blue Crescent
  'İhtiyaç Haritası Derneği',                       // ihtiyaç
  'Nirengi Derneği',                                 // nirengi
  'Genç Hayat Vakfı',                                // gençhayat
  'Gönüllü Hareketi Derneği',                        // gönüllühareketi
  'Kadın Emeğini Değerlendirme Vakfı',              // kedv
  'Önemsiyoruz Derneği',                             // önemsiyoruz
  '65+ Yaşlı Hakları Derneği',                       // yaşlı hakları
  'Beyaz Nokta Gelişim Vakfı',                       // beyaz nokta
  'Lokman Hekim Sağlık Vakfı',                       // lokman hekim
  'Temel İhtiyaç Derneği',                           // tider
  'Toplum Gönüllüleri Vakfı',                        // tog
  'Türk Psikologlar Derneği',                        // türk psikologlar
  'Açık Açık Derneği',                               // açık açık
  'Türkiye Eğitim Gönüllüleri Vakfı',               // tegv
  'Sevgi ve Kardeşlik Derneği',                      // sevgikardeşlik
  'Kadın Dayanışma Vakfı',                           // kadav
  'Türkiye Kadın Girişimciler Derneği',             // kagider
  'Koruncuk Vakfı',                                  // koruncuk
  'Öğretmen Akademisi Vakfı',                        // örav
  'İnsani Yardım Vakfı',                             // humanrelief (geniş eşleme)
  'Unvansız Gönüllüler Derneği',                     // unvansız gönüllüler
  'Türkiye Down Sendromu Derneği',                   // dowm
  'Maya Vakfı',                                      // maya
  'Sabancı Vakfı',                                   // sabancu
  'Acil İhtiyaç Projesi Vakfı',                      // aip
  'Tüvana Okuma İstekli Çocuk Eğitim Vakfı',        // toçev
  'Kanserli Çocuklara Umut Vakfı',                   // kaçuv
  'AKUT Arama Kurtarma Derneği Vakfı',               // akutvakfı
  'AKUT Arama Kurtarma Derneği',                     // akut
  'Çekül Vakfı',                                     // çekül
  'Türk Kanser Derneği',                             // türkkanser
  'TEMA Vakfı',                                      // tema
  'Adım Adım Oluşumu Derneği',                       // adımadım
  'Tohum Türkiye Otizm Erken Tanı ve Eğitim Vakfı', // tohum
  'JCI Türkiye',                                     // jci
  'Türkiye Aile Sağlığı ve Planlaması Vakfı',       // tapv
  'Türkiye İhracatçılar Meclisi',                    // tim
  'AbilityPool',                                     // ability
  'Türkiye Halk Sağlığı Derneği',                    // halksağlığı
];

function normalize(name) {
  if (!name) return '';
  let s = name.toLocaleLowerCase('tr');
  s = s.replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
       .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
       .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
  s = s.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}
const STOP = new Set(['ve', 'icin', 'ile']);
const SUFFIX_PATTERNS = [/ dernegi$/, / dernek$/, / vakfi$/, / vakif$/, / federasyonu$/, / cemiyeti$/, / kulubu$/, / spor kulubu$/];
function tokens(name) {
  let s = normalize(name);
  for (const re of SUFFIX_PATTERNS) s = s.replace(re, '');
  return s.split(' ').filter((t) => t.length > 1 && !STOP.has(t));
}
function overlap(a, b) {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  return a.filter((t) => setB.has(t)).length / a.length;
}

async function loadRegistry(collection) {
  console.log(`  loading ${collection}...`);
  const arr = [];
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
      arr.push({ id: doc.id, name, nameLower: d.nameLower || normalize(name), normalizedName: normalize(name), tokens: tokens(name) });
    }
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
  }
  console.log(`  ${collection}: ${arr.length} docs`);
  return arr;
}

function findMatch(scrapedName, registry) {
  const sNorm = normalize(scrapedName);
  const sTokens = tokens(scrapedName);
  const exact = registry.find((r) => r.nameLower === sNorm);
  if (exact) return { match: exact, score: 1.0, method: 'exact' };
  const exactNorm = registry.find((r) => r.normalizedName === sNorm);
  if (exactNorm) return { match: exactNorm, score: 0.99, method: 'norm-exact' };
  if (sTokens.length < 2) return null;
  const candidates = [];
  for (const r of registry) {
    const ov = overlap(sTokens, r.tokens);
    if (ov >= 0.75) candidates.push({ r, ov });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.ov - a.ov || a.r.tokens.length - b.r.tokens.length);
  return { match: candidates[0].r, score: candidates[0].ov, method: 'token-overlap' };
}

async function main() {
  console.log(`Afet Platformu manuel map run${dryRun ? ' (DRY-RUN)' : ''}\n`);
  const [vakiflar, dernekler] = await Promise.all([loadRegistry('registryVakiflar'), loadRegistry('registryDernekler')]);

  const matched = [];
  const unmatched = [];
  for (const name of KNOWN) {
    const dM = findMatch(name, dernekler);
    const vM = findMatch(name, vakiflar);
    const candidates = [dM, vM].filter(Boolean).sort((a, b) => b.score - a.score);
    if (!candidates.length) { unmatched.push(name); continue; }
    const best = candidates[0];
    const collection = dernekler.find((d) => d.id === best.match.id) ? 'registryDernekler' : 'registryVakiflar';
    matched.push({ manual: name, registryName: best.match.name, docId: best.match.id, collection, score: Number(best.score.toFixed(3)) });
  }

  console.log(`\n✓ matched:   ${matched.length}`);
  console.log(`✗ unmatched: ${unmatched.length}`);
  if (unmatched.length) {
    console.log('Unmatched (registry\'de bulunamadı):');
    unmatched.forEach((u) => console.log(`  - ${u}`));
  }

  if (!dryRun && matched.length) {
    let pending = 0;
    let batch = db.batch();
    for (const m of matched) {
      const ref = db.collection(m.collection).doc(m.docId);
      batch.set(ref, { platforms: FieldValue.arrayUnion('Afet Platformu'), updatedAt: Date.now() }, { merge: true });
      pending += 1;
      if (pending >= 400) { await batch.commit(); batch = db.batch(); pending = 0; }
    }
    if (pending > 0) await batch.commit();
    console.log(`→ wrote 'Afet Platformu' to ${matched.length} docs`);
  }

  writeFileSync('/tmp/afet-platformu-match-report.json', JSON.stringify({ matched, unmatched }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
