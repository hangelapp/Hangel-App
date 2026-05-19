# Runbook: Events `status` Backfill

**Task:** PDF-19-events-admin
**Owner:** devops-lead (executes), backend-lead (verifies)
**Risk:** L (idempotent, reversible)
**When to run:** Once, before the public `/events` page (now filtered by
`status == 'Yayında'`) is shipped to production. Without this backfill, every
legacy event document that predates the approval workflow will disappear from
the public listing.

---

## Background

The super-admin events page (`/super-admin/events`) implements an approval
workflow:

- Clubs create events with `status: 'Beklemede'`.
- Super-admin updates `status` to `'Yayında'` (or `'Reddedildi'`) from
  `/super-admin/events`.
- The public `/events` page now queries
  `where('status', '==', 'Yayında')`.

Documents created before this workflow do **not** carry a `status` field, so
the public query filters them out. Backfilling them to `'Yayında'` preserves
their visibility (they were already public before this change).

## Pre-checks

1. Confirm you have ADC access:
   ```sh
   gcloud auth application-default print-access-token | head -c 12 ; echo
   ```
2. Confirm the active GCP project matches the Firebase project (`hangel-app`
   or `studio` depending on environment).
3. Take a Firestore export of `events` first (see
   `docs/audit/runbooks/firestore-backup.md`). One-shot:
   ```sh
   gcloud firestore export gs://<backup-bucket>/events-$(date +%Y%m%d) \
     --collection-ids=events
   ```

## Backfill script (Node, Admin SDK)

Create a throwaway `scripts/backfill-events-status.ts` (do not commit):

```ts
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
  const snap = await db.collection('events').get();
  console.log(`Scanning ${snap.size} events…`);

  const batchSize = 400;
  let batch = db.batch();
  let pending = 0;
  let updated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (typeof data.status === 'string' && data.status.length > 0) {
      skipped++;
      continue;
    }
    batch.update(doc.ref, {
      status: 'Yayında',
      statusBackfilledAt: FieldValue.serverTimestamp(),
      statusBackfillReason: 'pre-PDF-19 legacy doc',
    });
    pending++;
    updated++;
    if (pending >= batchSize) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();

  console.log(`Done. updated=${updated}, skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Run:

```sh
npx tsx scripts/backfill-events-status.ts
```

## Verify

1. Spot-check 3 random docs in Firestore Console: should now have
   `status: 'Yayında'` and `statusBackfilledAt` timestamp.
2. Open public `/events`: legacy events should reappear.
3. Open `/super-admin/events`: legacy events should land in the "Yayında" tab,
   not "Onay Bekleyenler".

## Rollback

If something looks wrong, revert by re-running with the inverse condition (or
restore from the export taken in the pre-check):

```sh
gcloud firestore import gs://<backup-bucket>/events-YYYYMMDD
```

## Notes

- The script is idempotent: re-running skips docs that already have a status.
- We do **not** backfill `approvedBy` / `approvedAt` — those carry audit
  meaning and should remain empty for legacy docs.
- After the backfill, delete the throwaway script and remove it from disk to
  avoid accidental re-runs with the wrong project.
