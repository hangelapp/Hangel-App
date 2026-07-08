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
import { resolveOrgAdminCtx } from '@/lib/ngo-admin/org-admin-auth';
import { generateSocialShare } from '@/ai/flows/social-share-flow';
import { SOCIAL_SHARE_KINDS, type SocialShareKind } from '@/ai/flows/social-share-types';
import { AIQuotaExceededError } from '@/ai/flow-auth';

export const runtime = 'nodejs';

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * AI kullanılamadığında (ör. GEMINI_API_KEY yok / flow hatası) deterministik,
 * platforma uygun paylaşım metinleri üretir — böylece "Sosyal Medya" butonu HER
 * ZAMAN çalışır (boş/hata yerine kullanılabilir metin döner).
 */
function templatePosts(
  kind: SocialShareKind,
  f: { title: string; description: string; date?: string; location?: string; city?: string; ngoName?: string; url?: string },
): Array<{ platform: string; text: string; hashtags: string[] }> {
  const when = f.date ? `\n📅 ${f.date}` : '';
  const where = f.city || f.location ? `\n📍 ${f.city || f.location}` : '';
  const url = f.url ? `\n${f.url}` : '';
  const by = f.ngoName ? `\n— ${f.ngoName}` : '';
  const desc = f.description ? `\n${f.description}` : '';
  const noun = kind === 'event' ? 'etkinliğine' : 'ilanına';
  const tags = kind === 'event' ? ['#hangel', '#etkinlik', '#sivilToplum'] : ['#hangel', '#gönüllülük', '#sivilToplum'];
  return [
    { platform: 'x', text: `${f.title}${when}${where}${by}${url}`.slice(0, 260), hashtags: tags },
    { platform: 'instagram', text: `✨ ${f.title}${desc}${when}${where}${by}${url}`, hashtags: [...tags, '#iyilik'] },
    { platform: 'facebook', text: `${f.title}${desc}${when}${where}${by}${url}`, hashtags: tags },
    { platform: 'linkedin', text: `${f.ngoName || 'Kuruluşumuz'} olarak "${f.title}" ${noun} sizi davet ediyoruz.${desc}${when}${where}${url}`, hashtags: tags },
    { platform: 'whatsapp', text: `*${f.title}*${desc}${when}${where}${by}${url}`, hashtags: [] },
  ];
}

export async function POST(req: NextRequest) {
  // Yetki: STK / marka / kulüp yöneticisi VEYA super-admin. Eski requireNgoAdmin
  // yalnız NGO admini kabul ediyordu → super-admin ve KULÜP/MARKA yöneticilerinde
  // 403 dönüp "Sosyal Medya" dialog'u hata veriyordu (etkinlikleri kulüpler de açar).
  const auth = await resolveOrgAdminCtx(req);
  if (!auth.ok) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: auth.error }, { status: auth.status });
  }

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
    // AI kullanılamıyorsa (key yok / flow hatası) ŞABLON metinlerle devam et —
    // buton hata yerine kullanılabilir paylaşım metni gösterir.
    console.error('[social-share] AI hata, şablona düşülüyor', e);
    const posts = templatePosts(kind, {
      title,
      description: str(body.description),
      date: str(body.date) || undefined,
      location: str(body.location) || undefined,
      city: str(body.city) || undefined,
      ngoName: str(body.ngoName) || undefined,
      url: str(body.url) || undefined,
    });
    return NextResponse.json({ ok: true, posts, fallback: true });
  }
}
