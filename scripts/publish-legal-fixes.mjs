/**
 * Publish the 63 fixed/rewritten contracts/policies (the previously-failing
 * audit docs) to Firestore. Reads /tmp/legal/fix/<slug>.html, maps slug -> docId
 * via /tmp/legal/audit/manifest.json, set+merge.
 *
 * Run:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/publish-legal-fixes.mjs
 */
import fs from 'fs';
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'hangel-new-v18-87297865-9bcc3',
  });
}
const db = admin.firestore();

const work = JSON.parse(fs.readFileSync('/tmp/legal/fix/worklist.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('/tmp/legal/audit/manifest.json', 'utf8'));
const slugToDocId = new Map(manifest.map((m) => [m.slug, m.docId]));

const nowIso = new Date().toISOString();
let updated = 0, errored = 0;
const errors = [];

for (const w of work) {
  const file = `/tmp/legal/fix/${w.slug}.html`;
  if (!fs.existsSync(file)) { errors.push(`${w.slug}: html yok`); errored++; continue; }
  const content = fs.readFileSync(file, 'utf8').trim();
  if (content.length < 1000) { errors.push(`${w.slug}: çok kısa (${content.length})`); errored++; continue; }
  const m = content.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
  const title = m ? m[1].replace(/<[^>]*>/g, '').trim() : (w.title || w.slug);
  const docId = slugToDocId.get(w.slug) || w.slug;
  try {
    await db.collection('contracts').doc(docId).set({
      slug: w.slug,
      title,
      content,
      version: '2.0',
      status: 'yayinlandi',
      publishedAt: nowIso,
      lastUpdated: nowIso,
      updatedAt: nowIso,
      lastReviewedAt: FieldValue.serverTimestamp(),
      lastReviewedBy: 'legal-audit-fix-2026-06',
    }, { merge: true });
    updated++;
    if (updated % 15 === 0) console.log(`  ...${updated}/${work.length}`);
  } catch (e) {
    errored++;
    errors.push(`${w.slug}: ${e.message}`);
  }
}

console.log(`\nDone: updated=${updated}, errored=${errored} (toplam ${work.length})`);
if (errors.length) { console.log('Errors:'); errors.forEach((e) => console.log('  - ' + e)); }

const snap = await db.collection('contracts').get();
const counts = { yayinlandi: 0, taslak: 0, other: 0 };
snap.forEach((d) => {
  const s = d.data().status;
  if (s === 'yayinlandi') counts.yayinlandi++;
  else if (s === 'taslak') counts.taslak++;
  else counts.other++;
});
console.log('Firestore status:', counts, '| total:', snap.size);
process.exit(0);
