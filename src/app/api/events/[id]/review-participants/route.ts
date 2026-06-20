/**
 * POST /api/events/[id]/review-participants
 *
 * Yönetici "Tamamla" akışında her katılımcıya puan (1-5) + opsiyonel yorum verir.
 * Bu rota değerlendirmeleri events/{id}/participantReviews/{uid} altına yazar (Admin
 * SDK → rules gerektirmez). Sertifika GÖNDERMEZ; o adım "Etkinliği Kapat" =
 * /api/events/[id]/complete ile olur (kayıtlı yorum/puan teşekkür DM'ine işlenir).
 *
 * Body: { reviews: [{ uid, rating, comment }] }
 * Yetki: super-admin VEYA etkinlik organizatörü.
 * Dönüş: { ok: true, saved }
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

interface ReviewItem {
  uid?: string;
  rating?: number;
  comment?: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  if (!eventId) return errJson('invalid_event_id', 'Etkinlik kimliği gerekli', 400);

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return errJson('unauthenticated', 'Token gerekli', 401);

  let uid: string;
  let role: unknown;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
    role = (decoded as { role?: unknown }).role;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }
  const isSuperAdmin = role === 'super-admin';

  let body: { reviews?: ReviewItem[] };
  try {
    body = (await req.json()) as { reviews?: ReviewItem[] };
  } catch {
    return errJson('invalid_json', 'Geçersiz JSON', 400);
  }
  const reviews = Array.isArray(body.reviews) ? body.reviews : [];
  if (reviews.length === 0) return errJson('no_reviews', 'Değerlendirme listesi boş', 400);

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return errJson('event_not_found', 'Etkinlik bulunamadı', 404);
  const ev = eventSnap.data() as { organizerId?: string; createdBy?: string } | undefined;

  let authorized = isSuperAdmin || ev?.createdBy === uid;
  if (!authorized && ev?.organizerId) {
    const ud = (await db.collection(COLLECTIONS.users).doc(uid).get()).data() as
      | { managedClubId?: string; managedNgoId?: string }
      | undefined;
    if (ud && (ud.managedClubId === ev.organizerId || ud.managedNgoId === ev.organizerId)) authorized = true;
  }
  if (!authorized) return errJson('forbidden', 'Bu etkinliği değerlendirme yetkin yok', 403);

  const col = eventRef.collection(COLLECTIONS.eventParticipantReviews);
  let saved = 0;
  const batch = db.batch();
  for (const r of reviews) {
    if (!r.uid || typeof r.uid !== 'string') continue;
    const rating = Number(r.rating);
    const hasRating = Number.isInteger(rating) && rating >= 1 && rating <= 5;
    const comment = typeof r.comment === 'string' ? r.comment.slice(0, 1000).trim() : '';
    // Ne puan ne yorum varsa atla (boş değerlendirme yazma).
    if (!hasRating && !comment) continue;
    batch.set(
      col.doc(r.uid),
      {
        uid: r.uid,
        rating: hasRating ? rating : FieldValue.delete(),
        comment,
        reviewedBy: uid,
        reviewedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    saved++;
  }
  if (saved > 0) await batch.commit();

  return NextResponse.json({ ok: true, saved });
}
