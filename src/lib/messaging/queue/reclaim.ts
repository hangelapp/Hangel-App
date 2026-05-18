/**
 * Expired lease sweep: leasedUntil geçmiş job'ları pending'e döndür.
 * Worker crash veya timeout durumunda kuyruğun tıkanmaması için.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { JobStatus } from '../types';

export async function reclaimExpiredLeases(limit = 200): Promise<{ reclaimed: number }> {
  const db = getAdminFirestore();
  const now = Timestamp.now();
  const snap = await db
    .collection(COLLECTIONS.messageJobs)
    .where('status', '==', 'leased')
    .where('leasedUntil', '<=', now)
    .limit(limit)
    .get();

  if (snap.empty) return { reclaimed: 0 };

  const batch = db.batch();
  for (const doc of snap.docs) {
    batch.update(doc.ref, {
      status: 'pending' as JobStatus,
      leasedUntil: FieldValue.delete(),
      workerId: FieldValue.delete(),
      nextAttemptAt: now,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  return { reclaimed: snap.size };
}
