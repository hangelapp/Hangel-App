/**
 * POST /api/ngo-admin/social-share — etkinlik/gönüllülük ilanı → 5 platform paylaşım metni.
 *
 *   body: { kind: 'event' | 'volunteering', title, description?, date?, location?, city?, ngoName?, url? }
 *   response: { ok: true, posts: Array<{ platform, text, hashtags }> }
 *
 * Yönetici bir etkinlik/ilan seçer; Gemini her sosyal medya platformu için ayrı
 * paylaşım metni üretir; yönetici kopyalar.
 *
 * Yetki: requireNgoAdmin (etkinlik + gönüllülük panellerinde kullanılır).
 * Quota AI flow tarafında uygulanır. Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { generateSocialShare } from '@/ai/flows/social-share-flow';
import { SOCIAL_SHARE_KINDS, type SocialShareKind } from '@/ai/flows/social-share-types';
import { AIQuotaExceededError } from '@/ai/flow-auth';

export const runtime = 'nodejs';

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req);
  if ('error' in auth) return auth.error;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 });
  }

  const rawKind = str(body.kind);
  const kind: SocialShareKind = (SOCIAL_SHARE_KINDS as readonly string[]).includes(rawKind)
    ? (rawKind as SocialShareKind)
    : 'event';

  const title = str(body.title);
  if (!title) {
    return NextResponse.json({ errorCode: 'MISSING_TITLE', message: 'Paylaşılacak içeriğin başlığı bulunamadı.' }, { status: 400 });
  }

  // idToken'ı AI flow quota kontrolü için header'dan çıkar (requireNgoAdmin doğruladı).
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  try {
    const result = await generateSocialShare(
      {
        kind,
        title,
        description: str(body.description),
        date: str(body.date) || undefined,
        location: str(body.location) || undefined,
        city: str(body.city) || undefined,
        ngoName: str(body.ngoName) || undefined,
        url: str(body.url) || undefined,
      },
      idToken,
    );
    return NextResponse.json({ ok: true, posts: result.posts });
  } catch (e) {
    if (e instanceof AIQuotaExceededError) {
      return NextResponse.json({ errorCode: 'QUOTA', message: 'Günlük yapay zeka hakkın doldu, yarın tekrar dene.' }, { status: 429 });
    }
    console.error('[social-share] error', e);
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Paylaşım metni oluşturulamadı, lütfen tekrar dene.' }, { status: 500 });
  }
}
