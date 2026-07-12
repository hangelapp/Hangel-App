/**
 * Çağrı memnuniyet anketi.
 *
 * GET  /api/ngo-admin/call-center/sessions/[id]/survey  → anket meta (public sayfa için)
 *      { ngoName, done } — auth GEREKMEZ (link paylaşılabilir), sadece meta döner.
 * POST /api/ngo-admin/call-center/sessions/[id]/survey  { rating: 1-5, comment? }
 *      → callSessions/{id}.survey yazar. auth GEREKMEZ (arayan doldurur), ama
 *        aynı oturuma tek kez yazılır (done ise 409).
 *
 * Not: rating dışında PII toplanmaz. sessionId zaten paylaşılan linktedir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Kimlik eksik.' }, { status: 400 });
  const db = getAdminFirestore();
  const snap = await db.collection(CALL_SESSIONS).doc(id).get();
  if (!snap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Anket bulunamadı.' }, { status: 404 });
  const d = snap.data() as { ngoId?: string; survey?: { rating?: number } };

  let ngoName = 'Sivil toplum kuruluşu';
  if (d.ngoId) {
    const ngo = await db.collection(COLLECTIONS.ngos).doc(d.ngoId).get().catch(() => null);
    const nn = ngo?.data() as { name?: string } | undefined;
    if (nn?.name) ngoName = nn.name;
  }
  return NextResponse.json({ ngoName, done: !!(d.survey && typeof d.survey.rating === 'number') });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Kimlik eksik.' }, { status: 400 });

  let body: { rating?: unknown; comment?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ errorCode: 'BAD_RATING', message: 'Puan 1-5 arası olmalı.' }, { status: 400 });
  }
  const comment = typeof body.comment === 'string' ? body.comment.slice(0, 500) : '';

  const db = getAdminFirestore();
  const ref = db.collection(CALL_SESSIONS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Anket bulunamadı.' }, { status: 404 });
  const existing = snap.data() as { survey?: { rating?: number } };
  if (existing.survey && typeof existing.survey.rating === 'number') {
    return NextResponse.json({ errorCode: 'ALREADY_DONE', message: 'Bu anket zaten yanıtlanmış. Teşekkürler!' }, { status: 409 });
  }

  await ref.set({
    survey: { rating, comment, at: FieldValue.serverTimestamp() },
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
