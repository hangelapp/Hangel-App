/**
 * POST /api/ngo-admin/ads/tiktok/publish — onaylanan reklam planını TikTok'a yayınla.
 *
 *   body: { planId }
 *
 * Yetki: requireNgoAdmin scope 'ads'. Akış (Meta Ads publish deseni):
 *  - config yoksa 503 TIKTOK_NOT_CONFIGURED
 *  - hesap bağlı değilse (accessToken + advertiserId eksik) 409 NOT_CONNECTED
 *  - plan yoksa 404; plan başka STK'ya aitse 403
 *  - createTiktokCampaign çağrılır → adPlans status='active' güncellenir
 *  - createTiktokCampaign throw ederse 502 PUBLISH_FAILED (raw error sızdırmaz)
 *
 * accessToken yalnız server tarafında okunur; asla loglanmaz / client'a dönmez.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import {
  createTiktokCampaign,
  getTiktokConfig,
  type AdPlanForCampaign,
} from '@/lib/ads/tiktok-ads';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const config = getTiktokConfig();
  if (!config) {
    return NextResponse.json(
      { errorCode: 'TIKTOK_NOT_CONFIGURED', message: 'TikTok reklam bağlantısı henüz yapılandırılmadı.' },
      { status: 503 }
    );
  }

  const body = (await req.json().catch(() => null)) as { planId?: unknown } | null;
  const planId = typeof body?.planId === 'string' ? body.planId : '';
  if (!planId) {
    return NextResponse.json(
      { errorCode: 'MISSING', message: 'planId gerekli.' },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();

  // --- Connected account (long-lived accessToken + advertiserId). ---
  const acctSnap = await db
    .collection(COLLECTIONS.tiktokAccounts)
    .doc(actor.ngoId)
    .get()
    .catch(() => null);
  const acct = acctSnap?.exists
    ? (acctSnap.data() as { accessToken?: unknown; advertiserId?: unknown } | undefined)
    : undefined;
  const accessToken = typeof acct?.accessToken === 'string' ? acct.accessToken : '';
  const advertiserId = typeof acct?.advertiserId === 'string' ? acct.advertiserId : '';
  if (!accessToken || !advertiserId) {
    return NextResponse.json(
      { errorCode: 'NOT_CONNECTED', message: 'Önce TikTok reklam hesabını bağlayın.' },
      { status: 409 }
    );
  }

  // --- Plan ownership. ---
  const planSnap = await db
    .collection(COLLECTIONS.adPlans)
    .doc(planId)
    .get()
    .catch(() => null);
  if (!planSnap?.exists) {
    return NextResponse.json(
      { errorCode: 'NOT_FOUND', message: 'Plan bulunamadı.' },
      { status: 404 }
    );
  }
  const plan = planSnap.data() as Record<string, unknown>;
  if (plan.ngoId !== actor.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu plan size ait değil.' },
      { status: 403 }
    );
  }

  const planForCampaign: AdPlanForCampaign = {
    title: typeof plan.title === 'string' ? plan.title : undefined,
  };

  let campaignId: string;
  try {
    const result = await createTiktokCampaign(config, accessToken, advertiserId, planForCampaign);
    campaignId = result.campaignId;
  } catch {
    // Do not leak the raw provider error.
    return NextResponse.json(
      { errorCode: 'PUBLISH_FAILED', message: 'Yayınlama başarısız.' },
      { status: 502 }
    );
  }

  await db.collection(COLLECTIONS.adPlans).doc(planId).set(
    {
      status: 'active',
      tiktokCampaignId: campaignId,
      publishedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, status: 'active', campaignId });
}
