/**
 * Schedule promoter: scheduledAt geçmiş kampanyaları enqueue'ye iter.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { enqueueCampaign } from './enqueue';

export interface PromoteResult {
  scanned: number;
  promoted: number;
  failed: Array<{ campaignId: string; error: string }>;
}

export async function promoteScheduledCampaigns(limit = 50): Promise<PromoteResult> {
  const db = getAdminFirestore();
  const now = Timestamp.now();

  const snap = await db
    .collection('campaigns')
    .where('status', '==', 'scheduled')
    .where('schedule.scheduledAt', '<=', now)
    .orderBy('schedule.scheduledAt')
    .limit(limit)
    .get();

  const result: PromoteResult = { scanned: snap.size, promoted: 0, failed: [] };

  for (const doc of snap.docs) {
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
