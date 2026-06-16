/**
 * Faz 1+2 yanlış pozitif temizliği — Yozgat (58) + İstanbul (51).
 *
 * GSB ilçe müdürlüğü scrape'inde tablo başlıkları / yurt müdürlüğü adları /
 * personel isimleri ilçe sanılıp `outreachContacts/genc-spor-ilce-{il}-*`
 * altına yazılmıştı. Gerçek sayılar: Yozgat 14, İstanbul 39.
 *
 * Strateji:
 *   1. nufusu.com'dan iki ilin ilçe listesini çek (authoritative).
 *   2. Mevcut Firestore docs'ları çek.
 *   3. parentDocId == 'genc-spor-{il}' filtresi ile eski docları sil.
 *   4. nufusu'dan gelen ilçeleri update-nufusu-ilceler-firestore.mjs ile
 *      aynı şablonda tekrar yaz.
 *
 * Kullanım:
 *   GOOGLE_APPLICATION_CREDENTIALS=... node scripts/scrape-nufusu-fix-yozgat-istanbul.mjs
 *   GOOGLE_APPLICATION_CREDENTIALS=... node scripts/scrape-nufusu-fix-yozgat-istanbul.mjs --dry-run
 *
 * Çıktı (stdout son satır JSON):
 *   { yozgatBefore, yozgatAfter, istanbulBefore, istanbulAfter, deleted, written }
 */
import admin from 'firebase-admin';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DRY_RUN = process.argv.includes('--dry-run');

const TARGETS = [
  { slug: 'yozgat', name: 'Yozgat' },
  { slug: 'istanbul', name: 'İstanbul' },
];

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&([a-z]+);/gi, ' ').trim();
}

function slugify(s) {
  return String(s).toLocaleLowerCase('tr')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function fetchIlceler(slug, name) {
  const url = `https://www.nufusu.com/ilceleri/${slug}-ilceleri-nufusu`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' },
  });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const html = await res.text();
  const re = /<a\s+href="\/ilce\/([^"]+)"\s+title="([^"]+)\s+Nüfusu">([^<]+)<\/a>/g;
  const ilceler = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(html))) {
    const ilceName = decodeHtml(m[3]).trim();
    const key = ilceName.toLocaleLowerCase('tr');
    if (!seen.has(key)) {
      seen.add(key);
      ilceler.push({ name: ilceName, slug: m[1] });
    }
  }
  return ilceler;
}

async function commitBatched(ops, label) {
  if (ops.length === 0) return 0;
  if (DRY_RUN) return ops.length;
  let batch = db.batch();
  let pending = 0;
  let done = 0;
  for (const fn of ops) {
    fn(batch);
    pending++;
    done++;
    if (pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();
  return done;
}

async function processProvince(target) {
  const ilSlug = target.slug;
  const ilName = target.name;
  const parentId = `genc-spor-${ilSlug}`;

  const beforeSnap = await db.collection('outreachContacts')
    .where('parentDocId', '==', parentId).get();
  const before = beforeSnap.size;

  console.log(`\n[${ilName}] ${before} mevcut doc. nufusu.com çekiliyor...`);
  const ilceler = await fetchIlceler(ilSlug, ilName);
  console.log(`[${ilName}] nufusu.com → ${ilceler.length} ilçe.`);

  // 1. Eski docları sil
  const deleteOps = beforeSnap.docs.map((d) => (b) => b.delete(d.ref));
  const deleted = await commitBatched(deleteOps, `${ilName} delete`);
  console.log(`[${ilName}] ${DRY_RUN ? '(dry) ' : ''}silinen: ${deleted}`);

  // 2. nufusu listesini yeniden yaz
  const writeOps = ilceler.map((ilce) => {
    const ilceSlug = slugify(ilce.name);
    const docId = `genc-spor-ilce-${ilSlug}-${ilceSlug}`;
    const ref = db.collection('outreachContacts').doc(docId);
    const data = {
      name: `${ilce.name} Gençlik ve Spor İlçe Müdürlüğü`,
      shortName: `${ilce.name} GSİM`,
      type: 'GencSporIlceMudurlugu',
      city: ilName,
      district: ilce.name,
      website: `https://${ilSlug}.gsb.gov.tr`,
      parentDocId: parentId,
      source: 'nufusu-com-fix-yozgat-istanbul',
      emailGuess: `${ilceSlug}.im@gsb.gov.tr`,
      updatedAt: Date.now(),
    };
    return (b) => b.set(ref, data, { merge: true });
  });
  const written = await commitBatched(writeOps, `${ilName} write`);
  console.log(`[${ilName}] ${DRY_RUN ? '(dry) ' : ''}yazılan: ${written}`);

  let after;
  if (DRY_RUN) {
    after = ilceler.length;
  } else {
    const afterSnap = await db.collection('outreachContacts')
      .where('parentDocId', '==', parentId).get();
    after = afterSnap.size;
  }

  return { before, after, deleted, written };
}

async function main() {
  console.log(`Faz 1+2 yanlış pozitif fix${DRY_RUN ? ' (DRY RUN)' : ''}: ${TARGETS.map((t) => t.name).join(', ')}`);

  const results = {};
  let totalDeleted = 0;
  let totalWritten = 0;

  for (const t of TARGETS) {
    const r = await processProvince(t);
    results[t.slug] = r;
    totalDeleted += r.deleted;
    totalWritten += r.written;
    await new Promise((res) => setTimeout(res, 300));
  }

  const summary = {
    yozgatBefore: results.yozgat.before,
    yozgatAfter: results.yozgat.after,
    istanbulBefore: results.istanbul.before,
    istanbulAfter: results.istanbul.after,
    deleted: totalDeleted,
    written: totalWritten,
    dryRun: DRY_RUN,
  };

  console.log('\n--- SUMMARY ---');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
