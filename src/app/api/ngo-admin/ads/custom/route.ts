/**
 * POST /api/ngo-admin/ads/custom — STK serbest metin → tek reklam önerisi.
 *
 *   body: { text: string, platform?: 'google' | 'meta' | 'tiktok' }
 *   response: { proposal }  (AdProposal şekliyle birebir uyumlu)
 *
 * STK yöneticisi kısa bir serbest metin yazar ("X eğitimimiz var, Y etkinliğimiz
 * var, reklamını vermek istiyoruz"); Gemini bunu Ad Grants uyumlu TEK öneriye çevirir.
 *
 * Yetki: requireNgoAdmin scope 'ads'. Quota AI flow tarafında uygulanır.
 * Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { planCustomAdCampaign } from '@/ai/flows/ad-campaign-planner-flow';
import { AD_PLATFORMS, type AdPlatform } from '@/ai/flows/ad-platforms';
import { AIQuotaExceededError } from '@/ai/flow-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return NextResponse.json({ errorCode: 'MISSING_TEXT', message: 'Lütfen reklamını vermek istediğin metni yaz.' }, { status: 400 });
  }

  const rawPlatform = typeof body.platform === 'string' ? body.platform : '';
  const platform: AdPlatform = (AD_PLATFORMS as readonly string[]).includes(rawPlatform)
    ? (rawPlatform as AdPlatform)
    : 'google';

  // idToken'ı AI flow quota kontrolü için header'dan çıkar (requireNgoAdmin doğruladı).
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  // ngoName'i (kuruluş adı) STK dokümanından al — öneri kalitesini artırır.
  const ngoSnap = await getAdminFirestore().collection(COLLECTIONS.ngos).doc(actor.ngoId).get().catch(() => null);
  const ngoName = ngoSnap?.exists ? (() => {
    const name = (ngoSnap.data() as { name?: unknown } | undefined)?.name;
    return typeof name === 'string' ? name : '';
  })() : '';

  try {
    const result = await planCustomAdCampaign({ text, platform, ngoName }, idToken);
    return NextResponse.json({ proposal: result.proposal });
  } catch (e) {
    if (e instanceof AIQuotaExceededError) {
      return NextResponse.json({ errorCode: 'QUOTA', message: 'Günlük yapay zeka hakkın doldu, yarın tekrar dene.' }, { status: 429 });
    }
    console.error('[ads/custom] error', e);
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Öneri oluşturulamadı, lütfen tekrar dene.' }, { status: 500 });
  }
}
