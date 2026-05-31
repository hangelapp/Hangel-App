/**
 * GET /api/users/me/clubs-events
 *
 * Kullanıcının üye olduğu kulüplerin yaklaşan etkinliklerini döndürür.
 *
 * Kaynak:
 *  - user.volunteerInfo.clubMemberships (education page'den)
 *  - clubs/{clubId}/events veya events collection where clubId in [...]
 *
 * Filtre:
 *  - Etkinlik startDate > now
 *  - status === 'published'
 *
 * Auth: Bearer
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

interface ClubEvent {
  id: string;
  title?: string;
  clubId?: string;
  clubName?: string;
  description?: string;
  startDate?: { toDate: () => Date } | string;
  endDate?: { toDate: () => Date } | string;
  location?: string;
  capacity?: number;
  registeredCount?: number;
  imageUrl?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ errorCode: 'NO_AUTH' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const userSnap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const userData = userSnap.data() as { volunteerInfo?: { clubMemberships?: string[] } } | undefined;
    const clubIds = userData?.volunteerInfo?.clubMemberships ?? [];

    if (clubIds.length === 0) {
      return NextResponse.json({ ok: true, events: [], message: 'Üye olduğun kulüp yok.' });
    }

    // Firestore 'in' query 10 limit — 10'arlı batch
    const events: ClubEvent[] = [];
    const now = new Date();
    for (let i = 0; i < clubIds.length; i += 10) {
      const slice = clubIds.slice(i, i + 10);
      const snap = await db.collection(COLLECTIONS.events)
        .where('clubId', 'in', slice)
        .where('status', '==', 'published')
        .get();
      snap.docs.forEach((d) => {
        const data = d.data() as ClubEvent;
        const start = typeof data.startDate === 'string'
          ? new Date(data.startDate)
          : data.startDate?.toDate?.();
        if (!start || start < now) return;
        events.push({ ...data, id: d.id });
      });
    }

    // Tarihe göre sırala (en yakın önce)
    events.sort((a, b) => {
      const da = typeof a.startDate === 'string' ? new Date(a.startDate) : a.startDate?.toDate?.() ?? new Date();
      const db2 = typeof b.startDate === 'string' ? new Date(b.startDate) : b.startDate?.toDate?.() ?? new Date();
      return da.getTime() - db2.getTime();
    });

    return NextResponse.json({ ok: true, events: events.slice(0, 50) });
  } catch (e) {
    console.error('[clubs-events] error', e);
    return NextResponse.json({
      errorCode: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Bilinmeyen hata.',
    }, { status: 500 });
  }
}
