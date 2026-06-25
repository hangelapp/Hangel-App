/**
 * POST /api/ngo-admin/ads/select — STK "Bunu Kur": seçilen AI reklam planını kaydet.
 * GET  /api/ngo-admin/ads/select — STK'nın kaydettiği planları listele.
 *
 * Yetki: requireNgoAdmin (ngoId server tarafında zorlanır — client override edemez).
 * Kayıt `adPlans` koleksiyonuna (Admin SDK). Faz 1'de Google Ads API ile yayınlanır.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 30) as string[] : []);

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 });

  const kind = str(body.kind);
  const title = str(body.title);
  if (!kind || !title) return NextResponse.json({ errorCode: 'MISSING', message: 'Plan bilgisi eksik.' }, { status: 400 });

  // Platform: STK Google/Meta/TikTok bölümlerinden hangisinden kurduysa ona göre.
  const rawPlatform = str(body.platform);
  const platform = rawPlatform === 'meta' || rawPlatform === 'tiktok' ? rawPlatform : 'google';

  const db = getAdminFirestore();
  const ref = await db.collection(COLLECTIONS.adPlans).add({
    ngoId: actor.ngoId,
    ngoName: str(body.ngoName).slice(0, 200),
    platform,
    kind,
    title: title.slice(0, 200),
    goal: str(body.goal).slice(0, 500),
    landing: str(body.landing),
    // Google (Arama) alanları
    keywords: arr(body.keywords),
    headlines: arr(body.headlines),
    descriptions: arr(body.descriptions),
    regions: arr(body.regions),
    // Konum (geo) hedefleme — gerçek Google geo target ID'leri (regions dekoratif kalır).
    ...(Array.isArray(body.geoTargetIds)
      ? { geoTargetIds: body.geoTargetIds.filter((x) => typeof x === 'string').slice(0, 20) }
      : {}),
    // Önerilen günlük bütçe (TL) — varsa kaydet (50-500 clamp; PATCH ile tutarlı).
    ...(typeof body.dailyBudget === 'number' && Number.isFinite(body.dailyBudget)
      ? { dailyBudget: Math.min(500, Math.max(50, body.dailyBudget)) }
      : {}),
    // Meta alanları (Facebook/Instagram)
    audience: str(body.audience).slice(0, 500),
    primaryText: str(body.primaryText).slice(0, 500),
    headline: str(body.headline).slice(0, 200),
    description: str(body.description).slice(0, 300),
    creativeConcept: str(body.creativeConcept).slice(0, 500),
    // TikTok alanları (kısa video)
    videoConcept: str(body.videoConcept).slice(0, 500),
    caption: str(body.caption).slice(0, 300),
    hashtags: arr(body.hashtags),
    estReach: str(body.estReach).slice(0, 200),
    status: 'submitted', // STK gönderdi → hangel ekibi yayınlayacak (Faz 1: otomatik)
    createdBy: actor.uid,
    createdAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ ok: true, id: ref.id });
}

export async function GET(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.adPlans).where('ngoId', '==', auth.actor.ngoId).limit(100).get().catch(() => null);
  const plans = snap
    ? snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const ts = data.createdAt as { toMillis?: () => number } | undefined;
        return { ...data, id: d.id, createdAt: ts?.toMillis?.() ?? null };
      })
    : [];
  return NextResponse.json({ plans });
}

/**
 * PATCH /api/ngo-admin/ads/select — kayıtlı bir planın günlük bütçesini ve/veya
 * konum (geo) hedeflemesini güncelle.
 *
 *   body: { planId, dailyBudget?, geoTargetIds? }
 *
 * Yetki: requireNgoAdmin scope 'ads'. Plan STK'ya ait değilse 403; yayındaysa
 * ('active') düzenleme reddedilir (409). dailyBudget 50-500 TL aralığına kıstırılır.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 });

  const planId = typeof body.planId === 'string' ? body.planId : '';
  if (!planId) return NextResponse.json({ errorCode: 'MISSING', message: 'planId gerekli.' }, { status: 400 });

  const db = getAdminFirestore();
  const planRef = db.collection(COLLECTIONS.adPlans).doc(planId);
  const snap = await planRef.get().catch(() => null);
  if (!snap?.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Plan bulunamadı.' }, { status: 404 });
  }
  const plan = snap.data() as Record<string, unknown>;
  if (plan.ngoId !== actor.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu plan size ait değil.' }, { status: 403 });
  }
  if (plan.status === 'active') {
    return NextResponse.json({ errorCode: 'PUBLISHED', message: 'Yayındaki plan düzenlenemez.' }, { status: 409 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.dailyBudget === 'number' && Number.isFinite(body.dailyBudget)) {
    update.dailyBudget = Math.min(500, Math.max(50, body.dailyBudget));
  }
  if (Array.isArray(body.geoTargetIds)) {
    update.geoTargetIds = body.geoTargetIds.filter((x) => typeof x === 'string').slice(0, 20);
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ errorCode: 'NO_CHANGES', message: 'Güncellenecek alan yok.' }, { status: 400 });
  }

  await planRef.set(update, { merge: true });
  return NextResponse.json({ ok: true });
}
