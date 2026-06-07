/**
 * POST /api/ads/plan
 *
 * STK için Gemini ile 5 Google Ad Grants kampanya önerisi üretir.
 * Body: { orgName, orgType, faaliyetAlani, city, hangelDonationUrl, hangelVolunteerUrl, website }
 * Response: { proposals: AdProposal[] }
 *
 * Auth: Bearer (giriş yapmış kullanıcı). Quota AI flow tarafında uygulanır.
 * Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { planAdCampaigns } from '@/ai/flows/ad-campaign-planner-flow';
import { AIQuotaExceededError } from '@/ai/flow-auth';
import { getAdminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) {
    return NextResponse.json({ errorCode: 'NO_AUTH', message: 'Oturum gerekli.' }, { status: 401 });
  }
  try {
    await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN', message: 'Geçersiz oturum.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 });
  }
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const orgName = str(body.orgName).trim();
  if (!orgName) {
    return NextResponse.json({ errorCode: 'MISSING_ORG', message: 'Kuruluş bilgisi eksik.' }, { status: 400 });
  }

  try {
    const result = await planAdCampaigns(
      {
        orgName,
        orgType: str(body.orgType) || 'STK',
        faaliyetAlani: str(body.faaliyetAlani),
        city: str(body.city),
        hangelDonationUrl: str(body.hangelDonationUrl),
        hangelVolunteerUrl: str(body.hangelVolunteerUrl),
        website: str(body.website),
      },
      idToken,
    );
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AIQuotaExceededError) {
      return NextResponse.json({ errorCode: 'QUOTA', message: 'Günlük yapay zeka hakkın doldu, yarın tekrar dene.' }, { status: 429 });
    }
    console.error('[ads/plan] error', e);
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Plan oluşturulamadı, lütfen tekrar dene.' }, { status: 500 });
  }
}
