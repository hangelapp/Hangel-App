/**
 * GET /api/events/[id]/participants
 *
 * "Tamamla" akışı için katılımcı listesi: RSVP "going" + check-in yapanların
 * birleşimi, isim/avatar ve (varsa) mevcut yönetici değerlendirmesi (puan+yorum)
 * ile döner — böylece yönetici dialogda her katılımcıyı puanlayıp yorum yazabilir.
 *
 * Yetki: super-admin VEYA etkinlik organizatörü (createdBy / managed*Id eşleşmesi).
 * rsvp/checkin dokümanları sadece uid tutar; isim Admin SDK ile users/{uid}.name +
 * Auth displayName üzerinden çözülür (client'a sızmaz, sadece yetkili yönetici görür).
 *
 * Dönüş: { participants: [{ uid, name, avatarUrl, role, rating, comment }] }
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
  if (!authorized) return errJson('forbidden', 'Bu etkinliğin katılımcılarını görme yetkin yok', 403);

  // RSVP "going" + check-in birleşimi.
  const [rsvpsSnap, checkinsSnap, reviewsSnap] = await Promise.all([
    eventRef.collection(COLLECTIONS.eventRsvps).where('status', '==', 'going').get(),
    eventRef.collection(COLLECTIONS.eventCheckins).get(),
    eventRef.collection(COLLECTIONS.eventParticipantReviews).get(),
  ]);
  const uids = new Set<string>(rsvpsSnap.docs.map((d) => d.id));
  for (const d of checkinsSnap.docs) {
    const u = (d.data() as { uid?: string | null }).uid;
    if (u) uids.add(u);
  }
  const roleByUid: Record<string, string> = {};
  for (const d of rsvpsSnap.docs) {
    const r = (d.data() as { role?: string }).role;
    if (r) roleByUid[d.id] = r;
  }
  const reviewByUid: Record<string, { rating?: number; comment?: string }> = {};
  for (const d of reviewsSnap.docs) {
    const data = d.data() as { rating?: number; comment?: string };
    reviewByUid[d.id] = { rating: data.rating, comment: data.comment };
  }

  const userIds = Array.from(uids);
  const profileByUid: Record<string, { name: string; avatarUrl: string; email: string }> = {};
  if (userIds.length > 0) {
    const refs = userIds.map((id) => db.collection(COLLECTIONS.users).doc(id));
    const docs = await db.getAll(...refs);
    for (const d of docs) {
      const data = d.data() as { name?: string; avatarUrl?: string; personalInfo?: { email?: string } } | undefined;
      profileByUid[d.id] = {
        name: (data?.name || '').trim(),
        avatarUrl: (data?.avatarUrl || '').trim(),
        email: (data?.personalInfo?.email || '').trim(),
      };
    }
    for (let i = 0; i < userIds.length; i += 100) {
      const chunk = userIds.slice(i, i + 100).map((u) => ({ uid: u }));
      try {
        const res = await getAdminAuth().getUsers(chunk);
        for (const u of res.users) {
          const cur = profileByUid[u.uid] || { name: '', avatarUrl: '', email: '' };
          if (!cur.name) cur.name = (u.displayName || '').trim();
          if (!cur.avatarUrl) cur.avatarUrl = (u.photoURL || '').trim();
          if (!cur.email) cur.email = (u.email || '').trim();
          profileByUid[u.uid] = cur;
        }
      } catch {
        // Auth lookup başarısızsa users doc verisiyle devam.
      }
    }
  }

  const participants = userIds
    .map((id) => {
      const p = profileByUid[id] || { name: '', avatarUrl: '', email: '' };
      const rev = reviewByUid[id] || {};
      return {
        uid: id,
        name: p.name || (p.email ? p.email.split('@')[0] : 'Katılımcı'),
        avatarUrl: p.avatarUrl,
        role: roleByUid[id] || 'participant',
        rating: typeof rev.rating === 'number' ? rev.rating : 0,
        comment: rev.comment || '',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  return NextResponse.json({ participants });
}
