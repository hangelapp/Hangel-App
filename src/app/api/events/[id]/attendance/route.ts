/**
 * GET /api/events/[id]/attendance
 *
 * Etkinliğin KAYIT (RSVP "going") + CHECK-IN durumunu birleşik döndürür.
 * Yetki: super-admin VEYA etkinliğin organizatörü (event.createdBy == uid VEYA
 * kullanıcının managedClubId/managedNgoId == event.organizerId).
 *
 * rsvps yalnız super-admin'e (rules), checkins organizatöre listelenebilir; bu
 * yüzden okuma Admin SDK ile yapılır (yetki burada doğrulanır, client'a yalnız
 * yetkiliyse döner). İsimler users/{uid}.name + Auth displayName üzerinden çözülür.
 *
 * Dönüş: {
 *   event: { name },
 *   registeredCount, checkedInCount,
 *   people: [{ uid, name, email, registered, checkedIn, checkedInAt }]
 * }
 * (checkedIn=true olanlar panelde yeşil + "Check-in yaptı" gösterilir.)
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

interface Person {
  uid: string;
  name: string;
  email: string;
  registered: boolean;
  checkedIn: boolean;
  checkedInAt: string | null;
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
  const ev = eventSnap.data() as { name?: string; organizerId?: string; createdBy?: string };

  // Yetki
  let authorized = isSuperAdmin || ev.createdBy === uid;
  if (!authorized && ev.organizerId) {
    const userSnap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const ud = userSnap.data() as { managedClubId?: string; managedNgoId?: string } | undefined;
    if (ud && (ud.managedClubId === ev.organizerId || ud.managedNgoId === ev.organizerId)) authorized = true;
  }
  if (!authorized) return errJson('forbidden', 'Bu etkinliği yönetme yetkin yok', 403);

  // RSVP "going" + check-ins
  const [rsvpsSnap, checkinsSnap] = await Promise.all([
    eventRef.collection(COLLECTIONS.eventRsvps).where('status', '==', 'going').get(),
    eventRef.collection(COLLECTIONS.eventCheckins).get(),
  ]);

  const registeredUids = new Set(rsvpsSnap.docs.map((d) => d.id));
  const checkinByUid = new Map<string, string | null>(); // uid -> checkedInAt ISO
  const anonCheckins: Person[] = [];
  for (const d of checkinsSnap.docs) {
    const data = d.data() as { uid?: string | null; anonymous?: boolean; checkedInAt?: { toDate?: () => Date } };
    const at = data.checkedInAt?.toDate?.()?.toISOString() ?? null;
    if (data.uid) checkinByUid.set(data.uid, at);
    else anonCheckins.push({ uid: d.id, name: 'Anonim katılımcı (App Clip)', email: '', registered: false, checkedIn: true, checkedInAt: at });
  }

  // Birleşik uid kümesi (kayıt + check-in)
  const allUids = Array.from(new Set<string>([...registeredUids, ...checkinByUid.keys()]));

  // İsim çöz
  const nameByUid: Record<string, { name: string; email: string }> = {};
  if (allUids.length > 0) {
    const docs = await db.getAll(...allUids.map((id) => db.collection(COLLECTIONS.users).doc(id)));
    for (const d of docs) {
      const data = d.data() as { name?: string; personalInfo?: { email?: string } } | undefined;
      nameByUid[d.id] = { name: (data?.name || '').trim(), email: (data?.personalInfo?.email || '').trim() };
    }
    for (let i = 0; i < allUids.length; i += 100) {
      const chunk = allUids.slice(i, i + 100).map((u) => ({ uid: u }));
      try {
        const res = await getAdminAuth().getUsers(chunk);
        for (const u of res.users) {
          const cur = nameByUid[u.uid] || { name: '', email: '' };
          if (!cur.name) cur.name = (u.displayName || '').trim();
          if (!cur.email) cur.email = (u.email || '').trim();
          nameByUid[u.uid] = cur;
        }
      } catch { /* Auth lookup başarısızsa users doc verisiyle devam */ }
    }
  }

  const people: Person[] = allUids
    .map((id) => {
      const r = nameByUid[id] || { name: '', email: '' };
      return {
        uid: id,
        name: r.name || (r.email ? r.email.split('@')[0] : 'Katılımcı'),
        email: r.email,
        registered: registeredUids.has(id),
        checkedIn: checkinByUid.has(id),
        checkedInAt: checkinByUid.get(id) ?? null,
      };
    })
    .concat(anonCheckins)
    // Önce check-in yapanlar (yeşil), sonra isme göre
    .sort((a, b) => (Number(b.checkedIn) - Number(a.checkedIn)) || a.name.localeCompare(b.name, 'tr'));

  return NextResponse.json({
    event: { name: ev.name || '' },
    registeredCount: registeredUids.size,
    checkedInCount: checkinByUid.size + anonCheckins.length,
    people,
  });
}
