/**
 * POST /api/events/[id]/rate-speaker — canlı konuşmacı puanı (1-5).
 *
 * SADECE "going" RSVP'si olan (etkinliğe katıl demiş) kullanıcı puanlayabilir.
 * Body: { contributorIndex: number, rating: number(1-5) }
 * Kayıt: events/{id}/speakerRatings/{uid} → { ratings: { [index]: rating } } (merge).
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

  let uid: string;
  try { uid = (await getAdminAuth().verifyIdToken(token)).uid; }
  catch { return errJson('unauthenticated', 'Geçersiz token', 401); }

  let body: { contributorIndex?: number; rating?: number };
  try { body = await req.json(); } catch { return errJson('invalid_json', 'Geçersiz istek', 400); }
  const idx = Number(body.contributorIndex);
  const rating = Number(body.rating);
  if (!Number.isInteger(idx) || idx < 0) return errJson('invalid_index', 'Geçersiz konuşmacı', 400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return errJson('invalid_rating', 'Puan 1-5 olmalı', 400);

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);

  // Gating: yalnızca "going" RSVP puanlayabilir.
  const rsvpSnap = await eventRef.collection(COLLECTIONS.eventRsvps).doc(uid).get();
  if (!rsvpSnap.exists || (rsvpSnap.data() as { status?: string }).status !== 'going') {
    return errJson('not_attending', 'Yalnızca etkinliğe katılanlar puanlayabilir', 403);
  }

  await eventRef.collection(COLLECTIONS.eventSpeakerRatings).doc(uid).set({
    uid,
    ratings: { [idx]: rating },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return NextResponse.json({ ok: true });
}
