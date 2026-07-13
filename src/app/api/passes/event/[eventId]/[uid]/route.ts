/**
 * Apple Wallet — Etkinlik Bileti endpoint (auto-checkin destekli).
 *
 * GET /api/passes/event/{eventId}/{uid}
 *
 * Bearer auth zorunlu. İstek sahibi yalnızca kendi `uid`'i için bilet alabilir
 * ve etkinliğe `going` statüsünde RSVP yapmış olmalıdır.
 *
 * Pass üzerindeki QR kod /api/events/{eventId}/auto-checkin endpoint'ine
 * yönlenir; NGO admin cihazı taradığında otomatik check-in yapılır.
 *
 * Cert eksikse 503 — production'da .p12 yüklendiğinde otomatik çalışır.
 *
 * Not: `src/app/api/passkit/event/[id]/route.ts` aynı işlevi event-only yapar
 * (uid header'dan). Bu endpoint uid'i path'ten alarak admin/paylaşım
 * senaryolarına olanak sağlar (gerekirse yetkilendirme genişletilebilir).
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { generateEventTicket } from '@/lib/passkit/event-ticket';

interface UserDoc {
  name?: string;
  fullName?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

interface EventDoc {
  title?: string;
  name?: string;
  ngoName?: string;
  organizer?: string;
  location?: string | { address?: string; city?: string };
  startDate?: { toDate?: () => Date } | string;
  endDate?: { toDate?: () => Date } | string;
  coordinates?: { lat: number; lng: number };
}

function resolveFullName(u: UserDoc): string {
  if (u.fullName) return u.fullName;
  if (u.name) return u.name;
  if (u.displayName) return u.displayName;
  const combined = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  return u.username ?? 'hangel Katılımcısı';
}

function toDate(v: EventDoc['startDate']): Date | undefined {
  if (!v) return undefined;
  if (typeof v === 'string') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  if (typeof v === 'object' && typeof v.toDate === 'function') {
    return v.toDate();
  }
  return undefined;
}

function resolveLocation(loc: EventDoc['location']): string | undefined {
  if (!loc) return undefined;
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    return [loc.address, loc.city].filter(Boolean).join(', ') || undefined;
  }
  return undefined;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ eventId: string; uid: string }> },
): Promise<NextResponse> {
  const { eventId, uid: targetUid } = await ctx.params;
  if (!eventId || !targetUid) {
    return NextResponse.json({ ok: false, errorCode: 'MISSING_PARAMS', message: 'Etkinlik veya kullanıcı kimliği eksik.' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ ok: false, errorCode: 'NO_AUTH', message: 'Giriş gerekli.' }, { status: 401 });
  }
  let authUid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    authUid = decoded.uid;
  } catch {
    return NextResponse.json({ ok: false, errorCode: 'INVALID_TOKEN', message: 'Geçersiz oturum.' }, { status: 401 });
  }
  if (authUid !== targetUid) {
    return NextResponse.json({ ok: false, errorCode: 'FORBIDDEN', message: 'Sadece kendi biletinizi oluşturabilirsiniz.' }, { status: 403 });
  }

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const [eventSnap, rsvpSnap, userSnap] = await Promise.all([
    eventRef.get(),
    eventRef.collection(COLLECTIONS.eventRsvps).doc(targetUid).get(),
    db.collection(COLLECTIONS.users).doc(targetUid).get(),
  ]);

  if (!eventSnap.exists) {
    return NextResponse.json({ ok: false, errorCode: 'EVENT_NOT_FOUND', message: 'Etkinlik bulunamadı.' }, { status: 404 });
  }
  if (!userSnap.exists) {
    return NextResponse.json({ ok: false, errorCode: 'USER_NOT_FOUND', message: 'Kullanıcı bulunamadı.' }, { status: 404 });
  }
  if (!rsvpSnap.exists || rsvpSnap.data()?.status !== 'going') {
    return NextResponse.json({ ok: false, errorCode: 'NOT_RSVPED', message: 'Önce etkinliğe kayıt olun.' }, { status: 403 });
  }

  const e = eventSnap.data() as EventDoc;
  const u = userSnap.data() as UserDoc;
  const startDate = toDate(e.startDate) ?? new Date();
  const endDate = toDate(e.endDate);
  // QR token: opaque random. Production'da burada HMAC ile imzalanmış token
  // üretilip auto-checkin endpoint'i replay'i önlemek için doğrulamalı.
  const qrToken = randomBytes(20).toString('hex');

  try {
    const buffer = await generateEventTicket({
      uid: targetUid,
      eventId,
      fullName: resolveFullName(u),
      eventTitle: e.title ?? e.name ?? 'hangel Etkinliği',
      ngoName: e.ngoName ?? e.organizer ?? undefined,
      location: resolveLocation(e.location),
      startDate,
      endDate,
      coordinates: e.coordinates,
      qrToken,
      authenticationToken: randomBytes(16).toString('hex'),
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.apple.pkpass',
        'content-disposition': `attachment; filename="hangel-ticket-${eventId}.pkpass"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'PASSKIT_CERTS_MISSING') {
      return NextResponse.json({
        ok: false,
        errorCode: 'PASSKIT_NOT_CONFIGURED',
        message: 'PassKit signing not configured.',
      }, { status: 503 });
    }
    return NextResponse.json({
      ok: false,
      errorCode: 'PKPASS_GENERATION_FAILED',
      message: 'Pass üretilemedi.',
    }, { status: 500 });
  }
}
