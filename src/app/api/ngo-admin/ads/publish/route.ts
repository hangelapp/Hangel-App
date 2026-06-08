/**
 * POST /api/ngo-admin/ads/publish — onaylanan reklam planını Google Ads'e yayınla.
 *
 *   body: { planId }
 *
 * Yetki: requireNgoAdmin scope 'ads'. Akış:
 *  - config yoksa 503 ADS_NOT_CONFIGURED
 *  - hesap bağlı değilse 409 NOT_CONNECTED
 *  - plan yoksa 404; plan başka STK'ya aitse 403
 *  - createSearchCampaign çağrılır → adPlans status='active' güncellenir
 *  - createSearchCampaign throw ederse 502 PUBLISH_FAILED (raw error sızdırmaz)
 *
 * refreshToken yalnız server tarafında okunur; asla loglanmaz / client'a dönmez.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import {
  createSearchCampaign,
  getGoogleAdsConfig,
  type AdPlanForCampaign,
} from '@/lib/ads/google-ads';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const config = getGoogleAdsConfig();
  if (!config) {
    return NextResponse.json(
      { errorCode: 'ADS_NOT_CONFIGURED', message: 'Google Ads bağlantısı henüz yapılandırılmadı.' },
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

  // --- Connected account (refresh token + customerId). ---
  const acctSnap = await db
    .collection(COLLECTIONS.adAccounts)
    .doc(actor.ngoId)
    .get()
    .catch(() => null);
  const acct = acctSnap?.exists
    ? (acctSnap.data() as { refreshToken?: unknown; customerId?: unknown } | undefined)
    : undefined;
  const refreshToken = typeof acct?.refreshToken === 'string' ? acct.refreshToken : '';
  const customerId = typeof acct?.customerId === 'string' ? acct.customerId : '';
  if (!refreshToken || !customerId) {
    return NextResponse.json(
      { errorCode: 'NOT_CONNECTED', message: 'Önce Google Ads hesabını bağlayın.' },
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
    landing: typeof plan.landing === 'string' ? plan.landing : undefined,
    keywords: Array.isArray(plan.keywords)
      ? plan.keywords.filter((k): k is string => typeof k === 'string')
      : undefined,
    headlines: Array.isArray(plan.headlines)
      ? plan.headlines.filter((h): h is string => typeof h === 'string')
      : undefined,
    descriptions: Array.isArray(plan.descriptions)
      ? plan.descriptions.filter((d): d is string => typeof d === 'string')
      : undefined,
  };

  let campaignResourceName: string;
  try {
    const result = await createSearchCampaign(config, refreshToken, customerId, planForCampaign);
    campaignResourceName = result.campaignResourceName;
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
      campaignResourceName,
      publishedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, status: 'active', campaignId: campaignResourceName });
}
