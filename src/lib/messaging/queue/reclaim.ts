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
  // Index-bağımsız: tek eşitlik (status) sorgusu + leasedUntil'i client-side süz
  // (status+leasedUntil composite index gerektirmez).
  const nowMs = now.toMillis();
  const snap = await db
    .collection(COLLECTIONS.messageJobs)
    .where('status', '==', 'leased')
    .limit(Math.max(limit * 2, 400))
    .get();
  const expired = snap.docs.filter((d) => {
    const lu = (d.data() as { leasedUntil?: Timestamp }).leasedUntil;
    return lu instanceof Timestamp && lu.toMillis() <= nowMs;
  }).slice(0, limit);

  if (expired.length === 0) return { reclaimed: 0 };

  const batch = db.batch();
  for (const doc of expired) {
    batch.update(doc.ref, {
      status: 'pending' as JobStatus,
      leasedUntil: FieldValue.delete(),
      workerId: FieldValue.delete(),
      nextAttemptAt: now,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  return { reclaimed: expired.length };
}
