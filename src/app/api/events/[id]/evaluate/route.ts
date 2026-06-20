/**
 * POST /api/events/[id]/evaluate — etkinlik sonrası değerlendirme (puan + yorum).
 *
 * SADECE "going" RSVP'si olan (etkinliğe katılan) kullanıcı değerlendirebilir.
 * Body: { rating: number(1-5), comment?: string }
 * Kayıt: events/{id}/eventEvaluations/{uid} (merge, tek doc) — idempotent (güncellenebilir).
 * Dönüş: { ok }
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  if (!eventId) return errJson('invalid_event_id', 'Etkinlik kimliği gerekli', 400);

  const token = (req.headers.get('authorization') ?? '').startsWith('Bearer ')
    ? (req.headers.get('authorization') ?? '').slice(7).trim() : '';
  if (!token) return errJson('unauthenticated', 'Token gerekli', 401);

  let uid: string; let name: string | undefined;
  try { const d = await getAdminAuth().verifyIdToken(token); uid = d.uid; name = (d as { name?: string }).name; }
  catch { return errJson('unauthenticated', 'Geçersiz token', 401); }

  let body: { rating?: number; comment?: string };
  try { body = await req.json(); } catch { return errJson('invalid_json', 'Geçersiz istek', 400); }
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return errJson('invalid_rating', 'Puan 1-5 olmalı', 400);
  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 1000) : '';

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);

  // Gating: yalnızca "going" RSVP değerlendirebilir.
  const rsvpSnap = await eventRef.collection(COLLECTIONS.eventRsvps).doc(uid).get();
  if (!rsvpSnap.exists || (rsvpSnap.data() as { status?: string }).status !== 'going') {
    return errJson('not_attending', 'Yalnızca etkinliğe katılanlar değerlendirebilir', 403);
  }

  await eventRef.collection(COLLECTIONS.eventEvaluations).doc(uid).set({
    uid, name: name || '', rating, comment, updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
