/**
 * POST /api/events/[id]/live — canlı yayını BAŞLAT / BİTİR (organizatör/super-admin).
 *
 * Body: { action: 'start' | 'end' }
 *  - start → event.live=true, liveStartedAt; "going" RSVP'lere "🔴 canlı başladı" bildirimi.
 *  - end   → event.live=false, liveEndedAt.
 * Dönüş: { ok, live }
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { notifyUser } from '@/lib/notify-user';

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

  let uid: string; let role: unknown;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid; role = (decoded as { role?: unknown }).role;
  } catch { return errJson('unauthenticated', 'Geçersiz token', 401); }

  let body: { action?: 'start' | 'end' };
  try { body = await req.json(); } catch { return errJson('invalid_json', 'Geçersiz istek', 400); }
  const action = body.action;
  if (action !== 'start' && action !== 'end') return errJson('invalid_action', "action 'start' veya 'end' olmalı", 400);

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return errJson('event_not_found', 'Etkinlik bulunamadı', 404);
  const ev = eventSnap.data() as { name?: string; organizerId?: string; organizer?: string; createdBy?: string };

  // Yetki — organizatör veya super-admin (complete route ile aynı desen).
  let authorized = role === 'super-admin' || ev.createdBy === uid;
  if (!authorized && ev.organizerId) {
    const ud = (await db.collection(COLLECTIONS.users).doc(uid).get()).data() as { managedClubId?: string; managedNgoId?: string } | undefined;
    if (ud && (ud.managedClubId === ev.organizerId || ud.managedNgoId === ev.organizerId)) authorized = true;
  }
  if (!authorized) return errJson('forbidden', 'Bu etkinliği yönetme yetkin yok', 403);

  if (action === 'start') {
    await eventRef.update({ live: true, liveStartedAt: FieldValue.serverTimestamp(), liveEndedAt: null });
    // "going" RSVP'lere canlı bildirimi — best-effort, cap'li.
    const eventName = ev.name || 'Etkinlik';
    try {
      const goingSnap = await eventRef.collection(COLLECTIONS.eventRsvps).where('status', '==', 'going').limit(500).get();
      await Promise.allSettled(goingSnap.docs.map((d) => notifyUser({
        userId: d.id,
        title: `🔴 ${eventName} canlı başladı`,
        body: 'Etkinlik şimdi başladı — katılmak için dokun.',
        link: `/events/${eventId}`,
        type: 'event',
      })));
    } catch { /* bildirim best-effort */ }
    return NextResponse.json({ ok: true, live: true });
  }

  await eventRef.update({ live: false, liveEndedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true, live: false });
}
