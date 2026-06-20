/**
 * GET /api/events/[id]/live-stats — canlı yönetici paneli istatistikleri.
 *
 * SADECE organizatör/super-admin görebilir (desen: complete/route.ts yetki kontrolü).
 *   • checkinCount: events/{id}/checkins doküman sayısı.
 *   • avgSpeakerRating + ratingCount: events/{id}/speakerRatings altındaki TÜM
 *     kullanıcıların verdiği konuşmacı puanlarının ortalaması (her doc.ratings
 *     map'indeki tüm değerler tek havuzda ortalanır).
 * Dönüş: { checkinCount, avgSpeakerRating, ratingCount }
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  if (!eventId) return errJson('invalid_event_id', 'Etkinlik kimliği gerekli', 400);

  const token = (req.headers.get('authorization') ?? '').startsWith('Bearer ')
    ? (req.headers.get('authorization') ?? '').slice(7).trim() : '';
  if (!token) return errJson('unauthenticated', 'Token gerekli', 401);

  let uid: string; let role: unknown;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid; role = (decoded as { role?: unknown }).role;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }
  const isSuperAdmin = role === 'super-admin';

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return errJson('event_not_found', 'Etkinlik bulunamadı', 404);
  const ev = eventSnap.data() as { organizerId?: string; createdBy?: string };

  // Yetki — organizatör veya super-admin (complete/route.ts ile aynı mantık).
  let authorized = isSuperAdmin || ev.createdBy === uid;
  if (!authorized && ev.organizerId) {
    const ud = (await db.collection(COLLECTIONS.users).doc(uid).get()).data() as { managedClubId?: string; managedNgoId?: string } | undefined;
    if (ud && (ud.managedClubId === ev.organizerId || ud.managedNgoId === ev.organizerId)) authorized = true;
  }
  if (!authorized) return errJson('forbidden', 'Bu paneli görme yetkin yok', 403);

  const [checkinsSnap, ratingsSnap] = await Promise.all([
    eventRef.collection(COLLECTIONS.eventCheckins).get(),
    eventRef.collection(COLLECTIONS.eventSpeakerRatings).get(),
  ]);

  const checkinCount = checkinsSnap.size;

  // Tüm kullanıcıların verdiği konuşmacı puanlarını tek havuzda topla → ortalama.
  let ratingSum = 0; let ratingCount = 0;
  for (const d of ratingsSnap.docs) {
    const ratings = (d.data() as { ratings?: Record<string, unknown> }).ratings;
    if (!ratings || typeof ratings !== 'object') continue;
    for (const v of Object.values(ratings)) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 1 && n <= 5) { ratingSum += n; ratingCount++; }
    }
  }
  const avgSpeakerRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;

  return NextResponse.json({ checkinCount, avgSpeakerRating, ratingCount });
}
