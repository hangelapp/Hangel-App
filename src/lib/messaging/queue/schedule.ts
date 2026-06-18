/**
 * Schedule promoter: scheduledAt geçmiş kampanyaları enqueue'ye iter.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { enqueueCampaign } from './enqueue';

export interface PromoteResult {
  scanned: number;
  promoted: number;
  failed: Array<{ campaignId: string; error: string }>;
}

export async function promoteScheduledCampaigns(limit = 50): Promise<PromoteResult> {
  const db = getAdminFirestore();
  const now = Timestamp.now();

  // Index-bağımsız: tek eşitlik (status) sorgusu + scheduledAt'i client-side süz/sırala
  // (status+schedule.scheduledAt composite index gerektirmez).
  const nowMs = now.toMillis();
  const schedAt = (d: FirebaseFirestore.QueryDocumentSnapshot): number => {
    const sa = (d.data() as { schedule?: { scheduledAt?: Timestamp } }).schedule?.scheduledAt;
    return sa instanceof Timestamp ? sa.toMillis() : 0;
  };
  const snap = await db
    .collection(COLLECTIONS.campaigns)
    .where('status', '==', 'scheduled')
    .limit(Math.max(limit * 2, 100))
    .get();
  const due = snap.docs
    .filter((d) => schedAt(d) <= nowMs)
    .sort((a, b) => schedAt(a) - schedAt(b))
    .slice(0, limit);

  const result: PromoteResult = { scanned: due.length, promoted: 0, failed: [] };

  for (const doc of due) {
    try {
      await enqueueCampaign(doc.id);
      result.promoted += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.failed.push({ campaignId: doc.id, error: message });
    }
  }

  return result;
}
