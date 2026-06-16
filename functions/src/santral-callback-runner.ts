/**
 * Sanal Santral callback runner.
 *
 * Schedule: every 1 minute (Europe/Istanbul).
 * İş: santralScheduledCallbacks.status='pending' AND scheduledAt <= now()
 *     olan callback'leri 'due' yapar ve ilgili contact'i priority=true işaretler
 *     → çağrı merkezi sırasında üst sıraya çıkar.
 *
 * KVKK: hiçbir kişisel veri log'a yazılmaz, sadece sayım/ID.
 * Region: europe-west1.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';
const BATCH_LIMIT = 100;

export const santralCallbackRunner = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: TIMEZONE,
    region: REGION,
  },
  async () => {
    const db = getFirestore();
    const now = Timestamp.now();

    const dueSnap = await db
      .collection('santralScheduledCallbacks')
      .where('status', '==', 'pending')
      .where('scheduledAt', '<=', now)
      .orderBy('scheduledAt', 'asc')
      .limit(BATCH_LIMIT)
      .get();

    if (dueSnap.empty) {
      logger.info('santralCallbackRunner: no due callbacks');
      return;
    }

    let processed = 0;
    let errors = 0;
    const contactsToFlag = new Set<string>();
    const auditEntries: Array<{ callbackId: string; contactId: string; scheduledAt: string }> = [];

    let batch = db.batch();
    let pending = 0;

    for (const doc of dueSnap.docs) {
      try {
        const d = doc.data();
        const contactId = String(d.contactId || '');
        const ngoId = String(d.ngoId || '');
        if (!contactId || !ngoId) {
          errors += 1;
          continue;
        }

        batch.update(doc.ref, {
          status: 'due',
          activatedAt: FieldValue.serverTimestamp(),
        });
        pending += 1;

        if (!contactsToFlag.has(contactId)) {
          contactsToFlag.add(contactId);
          batch.update(db.collection('santralContacts').doc(contactId), {
            priority: true,
            priorityReason: 'callback-due',
            priorityCallbackId: doc.id,
            updatedAt: FieldValue.serverTimestamp(),
          });
          pending += 1;
        }

        auditEntries.push({
          callbackId: doc.id,
          contactId,
          scheduledAt: d.scheduledAt?.toDate?.()?.toISOString?.() ?? 'unknown',
        });

        processed += 1;

        if (pending >= 400) {
          await batch.commit();
          batch = db.batch();
          pending = 0;
        }
      } catch (err) {
        errors += 1;
        logger.error('santralCallbackRunner: doc failed', { id: doc.id, err: (err as Error).message });
      }
    }

    if (pending > 0) await batch.commit();

    if (auditEntries.length) {
      try {
        await db.collection('callAuditLog').add({
          type: 'callback.batch-activated',
          processed,
          errors,
          entries: auditEntries.slice(0, 50),
          at: FieldValue.serverTimestamp(),
        });
      } catch (err) {
        logger.warn('santralCallbackRunner: audit write failed', { err: (err as Error).message });
      }
    }

    logger.info('santralCallbackRunner: done', { processed, errors });
  },
);
