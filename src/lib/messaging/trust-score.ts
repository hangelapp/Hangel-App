/**
 * NGO trust score hesaplama.
 *
 * Rolling 7-day window:
 *  - complaint_rate = complaints / sent
 *  - bounce_rate = bounces / sent
 *  - opt_out_rate = unsubscribes / sent
 *
 * score = 100 - (complaint*1000 + bounce*200 + opt_out*100), clamped [0,100]
 *
 * Throttle multiplier:
 *  score >= 80 → 1.0
 *  60-80 → 0.7
 *  40-60 → 0.4
 *  < 40  → 0.1
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface TrustScore {
  ngoId: string;
  sent7d: number;
  bounces7d: number;
  complaints7d: number;
  optOuts7d: number;
  bounceRate: number;
  complaintRate: number;
  optOutRate: number;
  score: number;
  throttleMultiplier: number;
  lastComputedAt?: unknown;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function multiplierFor(score: number): number {
  if (score >= 80) return 1.0;
  if (score >= 60) return 0.7;
  if (score >= 40) return 0.4;
  return 0.1;
}

export function computeScore(stats: { sent: number; bounces: number; complaints: number; optOuts: number }): {
  bounceRate: number;
  complaintRate: number;
  optOutRate: number;
  score: number;
  throttleMultiplier: number;
} {
  const sent = Math.max(1, stats.sent);
  const bounceRate = stats.bounces / sent;
  const complaintRate = stats.complaints / sent;
  const optOutRate = stats.optOuts / sent;
  const penalty = complaintRate * 1000 + bounceRate * 200 + optOutRate * 100;
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  return {
    bounceRate,
    complaintRate,
    optOutRate,
    score,
    throttleMultiplier: multiplierFor(score),
  };
}

export async function recomputeTrustScore(ngoId: string): Promise<TrustScore> {
  const db = getAdminFirestore();
  const since = Timestamp.fromMillis(Date.now() - SEVEN_DAYS_MS);

  // 7-day window içindeki kampanya stats'larını topla
  const campsSnap = await db
    .collection('campaigns')
    .where('ngoId', '==', ngoId)
    .where('createdAt', '>=', since)
    .get();

  let sent = 0;
  let bounces = 0;
  let complaints = 0;
  let optOuts = 0;

  for (const doc of campsSnap.docs) {
    const c = doc.data() as { stats?: { sent?: number; bounced?: number; failed?: number; unsubscribed?: number } };
    sent += c.stats?.sent ?? 0;
    bounces += c.stats?.bounced ?? 0;
    optOuts += c.stats?.unsubscribed ?? 0;
  }

  // complaints: deliveryEvents type='complained'
  const complaintsSnap = await db
    .collection('deliveryEvents')
    .where('type', '==', 'complained')
    .where('receivedAt', '>=', since)
    .get();
  for (const doc of complaintsSnap.docs) {
    const e = doc.data() as { campaignId?: string };
    if (!e.campaignId) continue;
    const camp = campsSnap.docs.find((c) => c.id === e.campaignId);
    if (camp) complaints += 1;
  }

  const computed = computeScore({ sent, bounces, complaints, optOuts });

  const trust: TrustScore = {
    ngoId,
    sent7d: sent,
    bounces7d: bounces,
    complaints7d: complaints,
    optOuts7d: optOuts,
    ...computed,
    lastComputedAt: FieldValue.serverTimestamp(),
  };

  await db.collection('ngoTrustScores').doc(ngoId).set(trust, { merge: true });
  return trust;
}

export async function getThrottleMultiplier(ngoId: string): Promise<number> {
  const db = getAdminFirestore();
  const snap = await db.collection('ngoTrustScores').doc(ngoId).get();
  if (!snap.exists) return 1.0;
  const data = snap.data() as { throttleMultiplier?: number };
  return data.throttleMultiplier ?? 1.0;
}
