/**
 * Backfill `status: 'Yayında'` on legacy event docs that lack a status field.
 * Idempotent: only writes to docs MISSING the status field.
 *
 * Run with ADC:
 *   gcloud auth application-default login
 *   node scripts/backfill-events-status.mjs
 *
 * Add --dry to list candidates without writing.
 */
import admin from 'firebase-admin';

const DRY = process.argv.includes('--dry');
const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: PROJECT_ID,
});

const db = admin.firestore();

async function run() {
  console.log(`[backfill-events-status] dry=${DRY} project=${PROJECT_ID}`);
  const snap = await db.collection('events').get();
  console.log(`[backfill-events-status] total events: ${snap.size}`);

  const candidates = [];
  snap.forEach((doc) => {
    const data = doc.data();
    if (!data.status) candidates.push({ id: doc.id, name: data.name ?? data.title ?? '(no title)' });
  });
  console.log(`[backfill-events-status] missing status: ${candidates.length}`);
  for (const c of candidates.slice(0, 20)) console.log(`  - ${c.id} | ${c.name}`);
  if (candidates.length > 20) console.log(`  ... and ${candidates.length - 20} more`);

  if (DRY) {
    console.log('[backfill-events-status] DRY mode — no writes.');
    return;
  }
  if (candidates.length === 0) {
    console.log('[backfill-events-status] nothing to backfill.');
    return;
  }

  const BATCH = 450;
  let written = 0;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const slice = candidates.slice(i, i + BATCH);
    const batch = db.batch();
    for (const c of slice) {
      batch.update(db.collection('events').doc(c.id), {
        status: 'Yayında',
        backfilledStatusAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    written += slice.length;
    console.log(`[backfill-events-status] wrote ${written}/${candidates.length}`);
  }
  console.log('[backfill-events-status] done.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[backfill-events-status] FAILED:', err.message);
    process.exit(1);
  });
