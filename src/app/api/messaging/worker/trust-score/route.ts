/**
 * Günlük cron: aktif tüm NGO'ların trust score'unu yeniden hesapla.
 */

import { NextResponse } from 'next/server';
import { checkMessagingKey } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { recomputeTrustScore } from '@/lib/messaging/trust-score';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const unauthorized = checkMessagingKey(req);
  if (unauthorized) return unauthorized;

  const db = getAdminFirestore();
  const walletsSnap = await db.collection('ngoMessagingWallets').get();
  const ngoIds = walletsSnap.docs.map((d) => d.id);

  const results: Array<{ ngoId: string; score?: number; error?: string }> = [];
  for (const ngoId of ngoIds) {
    try {
      const score = await recomputeTrustScore(ngoId);
      results.push({ ngoId, score: score.score });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ ngoId, error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
