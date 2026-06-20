/**
 * Publish all /tmp/rewrite-out-*.json files to Firestore contracts collection.
 *
 * Each file is array of { id, slug, content, version } produced by taslak
 * rewrite agents. Some files may use slug as identifier instead of id — we
 * try both. Idempotent: re-running is safe.
 */
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'hangel-new-v18-87297865-9bcc3',
  });
}
const db = admin.firestore();

const DIR = '/tmp';
const files = fs.readdirSync(DIR).filter(f => /^rewrite-out-\d+\.json$/.test(f));
console.log(`Found ${files.length} rewrite-out files: ${files.join(', ')}`);

const allItems = [];
for (const f of files) {
  try {
    const arr = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    for (const it of arr) allItems.push({ ...it, _source: f });
  } catch (e) {
    console.error(`SKIP ${f}: ${e.message}`);
  }
}
console.log(`Total rewrites to publish: ${allItems.length}`);

const nowIso = new Date().toISOString();
let updated = 0, skipped = 0, errored = 0;
const errors = [];

// First, build a slug → docId map (in case rewrite files used slug as 'id')
const allContracts = await db.collection('contracts').get();
const slugToId = new Map();
allContracts.forEach(d => {
  const data = d.data();
  if (data.slug) slugToId.set(data.slug, d.id);
});

for (const it of allItems) {
  const docId = slugToId.get(it.id) || slugToId.get(it.slug) || it.id;
  if (!docId) {
    console.log(`  SKIP (no doc): ${it.slug || it.id} from ${it._source}`);
    skipped++;
    continue;
  }
  if (typeof it.content !== 'string' || it.content.length < 200) {
    console.log(`  SKIP (short content ${(it.content||'').length}): ${it.slug || it.id}`);
    skipped++;
    continue;
  }
  try {
    await db.collection('contracts').doc(docId).update({
      content: it.content,
      status: 'yayinlandi',
      publishedAt: nowIso,
      lastReviewedAt: FieldValue.serverTimestamp(),
      lastReviewedBy: `manual-publish-from-${it._source}`,
      version: it.version || '1.0',
    });
    updated++;
    if (updated % 10 === 0) console.log(`  progress: ${updated}/${allItems.length}`);
  } catch (e) {
    errored++;
    errors.push(`${it.slug || it.id}: ${e.message}`);
  }
}

console.log(`\nDone: updated=${updated}, skipped=${skipped}, errored=${errored}`);
if (errors.length > 0) {
  console.log('Errors:');
  errors.forEach(e => console.log(`  - ${e}`));
}

// Final state check
const finalSnap = await db.collection('contracts').get();
const counts = { taslak: 0, yayinlandi: 0, other: 0 };
finalSnap.forEach(d => {
  const s = d.data().status;
  if (s === 'taslak') counts.taslak++;
  else if (s === 'yayinlandi') counts.yayinlandi++;
  else counts.other++;
});
console.log(`\nFinal Firestore status counts:`, counts);

process.exit(0);
