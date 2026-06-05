/**
 * GET /api/events/[id]/attendees
 *
 * Bir etkinliğe "going" RSVP'si olan katılımcıların listesini döndürür.
 * Yetki: super-admin VEYA etkinliğin organizatörü (event.createdBy == uid,
 * ya da kullanıcının managedClubId/managedNgoId == event.organizerId).
 *
 * rsvp dokümanları yalnızca { userId, status } tutar; isimler Admin SDK ile
 * users/{uid}.name + Auth displayName üzerinden çözülür (client'a isim sızmaz,
 * sadece yetkili admin görür).
 *
 * Dönüş: { event: { name, date, location }, attendees: [{ name, email }] }
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
  const ev = eventSnap.data() as {
    name?: string; organizerId?: string; createdBy?: string;
    date?: string; startDate?: string;
    location?: { address?: string; district?: string; city?: string };
  };

  // Yetki kontrolü
  let authorized = isSuperAdmin || ev.createdBy === uid;
  if (!authorized && ev.organizerId) {
    const userSnap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const ud = userSnap.data() as { managedClubId?: string; managedNgoId?: string } | undefined;
    if (ud && (ud.managedClubId === ev.organizerId || ud.managedNgoId === ev.organizerId)) {
      authorized = true;
    }
  }
  if (!authorized) return errJson('forbidden', 'Bu etkinliğin katılımcılarını görme yetkin yok', 403);

  // "going" RSVP'leri çek
  const rsvpsSnap = await eventRef.collection(COLLECTIONS.eventRsvps).where('status', '==', 'going').get();
  const userIds = rsvpsSnap.docs.map((d) => d.id);

  // İsimleri çöz — users docs (getAll) + Auth (getUsers, batched 100'lük)
  const nameByUid: Record<string, { name: string; email: string }> = {};
  if (userIds.length > 0) {
    const refs = userIds.map((id) => db.collection(COLLECTIONS.users).doc(id));
    const docs = await db.getAll(...refs);
    for (const d of docs) {
      const data = d.data() as { name?: string; personalInfo?: { email?: string } } | undefined;
      nameByUid[d.id] = { name: (data?.name || '').trim(), email: (data?.personalInfo?.email || '').trim() };
    }
    // Auth fallback (displayName/email) — 100'lük gruplar
    for (let i = 0; i < userIds.length; i += 100) {
      const chunk = userIds.slice(i, i + 100).map((u) => ({ uid: u }));
      try {
        const res = await getAdminAuth().getUsers(chunk);
        for (const u of res.users) {
          const cur = nameByUid[u.uid] || { name: '', email: '' };
          if (!cur.name) cur.name = (u.displayName || '').trim();
          if (!cur.email) cur.email = (u.email || '').trim();
          nameByUid[u.uid] = cur;
        }
      } catch {
        // Auth lookup başarısızsa users doc verisiyle devam
      }
    }
  }

  const attendees = userIds
    .map((id) => {
      const r = nameByUid[id] || { name: '', email: '' };
      return { name: r.name || (r.email ? r.email.split('@')[0] : 'Katılımcı'), email: r.email };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const loc = ev.location;
  const locationStr = loc ? [loc.address, loc.district, loc.city].map((s) => (s || '').trim()).filter(Boolean).join(', ') : '';

  return NextResponse.json({
    event: { name: ev.name || '', date: ev.startDate || ev.date || '', location: locationStr },
    attendees,
  });
}
