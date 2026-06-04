/**
 * Publish the 62 rewritten seed contracts/policies to the Firestore `contracts`
 * collection. Create-or-update (set+merge) so every slug lands & goes live
 * immediately (runtime reads Firestore first, overriding the code seed).
 *
 * Input: /tmp/rewrite-out-1.json  = [{ id, slug, content, version }]
 * Title is derived from the doc's first <h3>. Existing extra fields
 * (kind, jurisdiction, targetGroups, …) are preserved by the merge.
 *
 * Run:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     node scripts/publish-legal-rewrite.mjs
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

const items = JSON.parse(fs.readFileSync('/tmp/rewrite-out-1.json', 'utf8'));
console.log(`Loaded ${items.length} rewritten docs.`);

// Map existing slug -> docId (some Firestore docs use a docId != slug).
const snap = await db.collection('contracts').get();
const slugToId = new Map();
const existingIds = new Set();
snap.forEach((d) => {
  existingIds.add(d.id);
  const data = d.data();
  if (data.slug) slugToId.set(data.slug, d.id);
});
console.log(`Firestore currently has ${snap.size} contract docs.`);

const nowIso = new Date().toISOString();
let created = 0, updated = 0, errored = 0;
const errors = [];

for (const it of items) {
  if (typeof it.content !== 'string' || it.content.length < 200) {
    errors.push(`${it.slug}: short content (${(it.content || '').length})`);
    errored++;
    continue;
  }
  const m = it.content.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
  const title = m ? m[1].replace(/<[^>]*>/g, '').trim() : it.slug;
  const docId = slugToId.get(it.slug) || it.slug;
  const isExisting = existingIds.has(docId);
  const data = {
    slug: it.slug,
    title,
    content: it.content,
    version: it.version || '2.0',
    status: 'yayinlandi',
    publishedAt: nowIso,
    lastUpdated: nowIso,
    updatedAt: nowIso,
    lastReviewedAt: FieldValue.serverTimestamp(),
    lastReviewedBy: 'legal-rewrite-2026-06',
  };
  try {
    await db.collection('contracts').doc(docId).set(data, { merge: true });
    isExisting ? updated++ : created++;
  } catch (e) {
    errored++;
    errors.push(`${it.slug}: ${e.message}`);
  }
}

console.log(`\nDone: created=${created}, updated=${updated}, errored=${errored}`);
if (errors.length) { console.log('Errors:'); errors.forEach((e) => console.log('  - ' + e)); }

// Final status counts
const finalSnap = await db.collection('contracts').get();
const counts = { yayinlandi: 0, taslak: 0, other: 0 };
finalSnap.forEach((d) => {
  const s = d.data().status;
  if (s === 'yayinlandi') counts.yayinlandi++;
  else if (s === 'taslak') counts.taslak++;
  else counts.other++;
});
console.log('Final Firestore status counts:', counts, '| total:', finalSnap.size);
process.exit(0);
