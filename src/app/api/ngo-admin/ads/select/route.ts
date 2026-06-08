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

  const db = getAdminFirestore();
  const ref = await db.collection(COLLECTIONS.adPlans).add({
    ngoId: actor.ngoId,
    ngoName: str(body.ngoName).slice(0, 200),
    platform: 'google',
    kind,
    title: title.slice(0, 200),
    goal: str(body.goal).slice(0, 500),
    landing: str(body.landing),
    keywords: arr(body.keywords),
    headlines: arr(body.headlines),
    descriptions: arr(body.descriptions),
    regions: arr(body.regions),
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
