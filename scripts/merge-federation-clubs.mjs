/**
 * scripts/merge-federation-clubs.mjs
 *
 * /tmp/scrape-fed-*.json dosyalarındaki spor kulüplerini topla, dedupe et,
 * outreachContacts/sporkulup-{slug} dokumanlarına yaz. Aynı kulüp birden
 * fazla federasyonda görülürse tek doc + federations: arrayUnion(...).
 *
 * Algoritma:
 *   1. /tmp/scrape-fed-*.json dosyalarını oku
 *   2. Her item için name'i normalize → slug üret → docId
 *   3. In-memory Map<slug, ClubRecord>: aynı slug için federations Set'e ekle
 *   4. Firestore'a batch yaz: type='SporKulübü', federations: arrayUnion
 *   5. Idempotent: merge:true + arrayUnion → tekrar çalıştırılırsa yeni
 *      federasyonlar mevcut doc'a eklenir, mevcut alanlar bozulmaz
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/merge-federation-clubs.mjs [--dry-run]
 */
import admin from 'firebase-admin';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { FieldValue } from 'firebase-admin/firestore';

admin.initializeApp({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Türkçe normalize: tr-locale lowercase + diakritik strip + suffix kaldır
function normalize(name) {
  if (!name) return '';
  let s = name.toLocaleLowerCase('tr');
  s = s.replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
       .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
       .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
  s = s.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

// Slug üret (Firestore docId için)
function slugify(name) {
  return normalize(name).replace(/\s+/g, '-').slice(0, 80);
}

// Dedup için "core name" — sponsor ön/son ekleri kaldır
// "Spor Kulübü", "Kulübü", "Derneği" gibi suffix'leri trim et
const SUFFIX_PATTERNS = [
  / spor kulubu( dernegi)?$/,
  / kulubu( dernegi)?$/,
  / genclik ve spor kulubu( dernegi)?$/,
  / spor kulubu vakfi$/,
  / dernegi$/,
];
function coreSlug(name) {
  let s = normalize(name);
  for (const re of SUFFIX_PATTERNS) s = s.replace(re, '');
  return s.replace(/\s+/g, '-').slice(0, 80);
}

async function main() {
  console.log(`Federation clubs merge${dryRun ? ' (DRY-RUN)' : ''}\n`);

  // 1. JSON dosyalarını yükle
  const files = readdirSync('/tmp').filter((f) => f.startsWith('scrape-fed-') && f.endsWith('.json'));
  console.log(`Scrape dosyaları: ${files.length}`);
  let totalRaw = 0;
  let failed = 0;
  const fedContrib = {}; // { federationName: count }
  // dedup key → record
  const clubs = new Map();

  for (const fname of files) {
    let data;
    try { data = JSON.parse(readFileSync(`/tmp/${fname}`, 'utf8')); }
    catch (e) { console.warn(`  ! parse fail ${fname}: ${e.message}`); failed += 1; continue; }
    const fedName = data.federationName || fname.replace('scrape-fed-', '').replace('.json', '');
    const items = data.items || [];
    fedContrib[fedName] = items.length;
    totalRaw += items.length;
    for (const it of items) {
      const name = (it.name || '').trim();
      if (!name || name.length < 3) continue;
      const key = coreSlug(name);
      if (!key) continue;
      const existing = clubs.get(key);
      if (existing) {
        existing.federations.add(fedName);
        // En uzun ismi koru (daha tanımlayıcı genelde)
        if (name.length > existing.name.length) existing.name = name;
        // City/league varsa ve mevcut boşsa ekle
        if (it.city && !existing.city) existing.city = it.city;
        if (it.email && !existing.email) existing.email = it.email;
        if (it.website && !existing.website) existing.website = it.website;
      } else {
        clubs.set(key, {
          slug: key,
          name,
          city: it.city || null,
          email: it.email || null,
          website: it.website || null,
          federations: new Set([fedName]),
        });
      }
    }
  }

  const uniqueCount = clubs.size;
  const multiFedCount = Array.from(clubs.values()).filter((c) => c.federations.size > 1).length;
  console.log(`\n=== ÖZET ===`);
  console.log(`Raw items: ${totalRaw}`);
  console.log(`Unique kulüp: ${uniqueCount}`);
  console.log(`Çoklu federasyon: ${multiFedCount}`);
  console.log(`Failed parse: ${failed}`);
  console.log(`\nFederasyon başına kulüp sayısı:`);
  Object.entries(fedContrib).sort((a, b) => b[1] - a[1]).forEach(([f, c]) => {
    console.log(`  ${String(c).padStart(5)}  ${f}`);
  });

  // 2. Firestore'a yaz
  if (!dryRun && uniqueCount > 0) {
    console.log(`\n→ Firestore'a yazılıyor...`);
    let written = 0;
    let pending = 0;
    let batch = db.batch();
    for (const c of clubs.values()) {
      const docId = `sporkulup-${c.slug}`;
      const ref = db.collection('outreachContacts').doc(docId);
      const payload = {
        name: c.name,
        type: 'SporKulübü',
        source: 'federation-scrape',
        federations: FieldValue.arrayUnion(...Array.from(c.federations)),
        updatedAt: Date.now(),
      };
      if (c.city) payload.city = c.city;
      if (c.email) payload.email = c.email;
      if (c.website) payload.website = c.website;
      // status default 'active' (sadece yeni doc için)
      payload.status = 'active';
      // createdAt sadece yeni doc'larda; mevcut doc'larda dokunmaz
      payload.createdAt = FieldValue.serverTimestamp();

      batch.set(ref, payload, { merge: true });
      pending += 1;
      written += 1;
      if (pending >= 400) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
        if (written % 2000 === 0) console.log(`  ...${written} yazıldı`);
      }
    }
    if (pending > 0) await batch.commit();
    console.log(`✓ ${written} doc yazıldı`);
  }

  // 3. Rapor kaydet
  const report = {
    generatedAt: new Date().toISOString(),
    totalRaw,
    uniqueCount,
    multiFedCount,
    fedContrib,
    failed,
    samples: Array.from(clubs.values()).slice(0, 10).map((c) => ({
      slug: c.slug,
      name: c.name,
      federationCount: c.federations.size,
      federations: Array.from(c.federations),
    })),
  };
  writeFileSync('/tmp/merge-federation-clubs-report.json', JSON.stringify(report, null, 2));
  console.log(`\n→ Rapor: /tmp/merge-federation-clubs-report.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
