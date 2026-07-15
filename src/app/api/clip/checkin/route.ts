/**
 * POST /api/clip/checkin
 *
 * App Clip QR / NFC otomatik check-in endpoint'i. Tam app yüklenmeden iOS
 * App Clip içinden çağrılır. İki kimlik modu destekler:
 *
 *  1. Authenticated (Firebase ID token): events/{eventId}/checkins/{uid}
 *  2. Anonymous device: events/{eventId}/checkins/dev_{hash} — App Clip
 *     kullanıcısı henüz tam app'e geçmediği için doc.userId boş tutulur;
 *     full sign-in olduğunda backfill için deviceId hash kaydedilir.
 *
 * Body:
 *   { eventId: string, source: 'qr' | 'nfc', tagId?: string }
 *
 * Headers:
 *   Authorization: Bearer <idToken>           (opsiyonel)
 *   X-Device-Id: <stable device identifier>   (anonymous için zorunlu)
 *
 * Rate limit: device başına 6 req/dk (idempotent — aynı eventId tekrarı 200).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { checkRateLimit } from '@/lib/rate-limit';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'crypto';
import { checkinCodeFor, normalizeCode } from '@/lib/checkin-code';

export const runtime = 'nodejs';

// İlk (kimliği doğrulanmış) check-in'de kullanıcının impact puanına eklenir.
// Anonim (App Clip dev_) check-in'lerde puan verilmez (kullanıcı yok).
const CHECKIN_POINTS = 5;

type ClipCheckinSource = 'qr' | 'nfc' | 'code';

interface ClipCheckinBody {
  eventId?: string;
  source?: ClipCheckinSource;
  tagId?: string;
  code?: string;
}

function hashDeviceId(deviceId: string): string {
  return createHash('sha256').update(deviceId).digest('hex').slice(0, 32);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Identity
  let uid: string | null = null;
  let deviceHash: string | null = null;
  const rawDeviceId = req.headers.get('x-device-id')?.trim();

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(
        authHeader.slice('Bearer '.length).trim(),
      );
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 });
    }
  }

  if (rawDeviceId && rawDeviceId.length >= 8) {
    deviceHash = hashDeviceId(rawDeviceId);
  }

  if (!uid && !deviceHash) {
    return NextResponse.json(
      { errorCode: 'NO_AUTH', message: 'Bearer token veya X-Device-Id gerekli.' },
      { status: 401 },
    );
  }

  // Rate limit
  const rateKey = uid ?? `dev_${deviceHash}`;
  const rateRes = await checkRateLimit({
    bucket: 'clip-checkin',
    key: rateKey,
    limit: 6,
    windowMs: 60_000,
  });
  if (!rateRes.allowed) {
    return NextResponse.json(
      { errorCode: 'RATE_LIMITED', message: 'Çok fazla deneme; biraz bekleyin.' },
      { status: 429 },
    );
  }

  // Body
  let body: ClipCheckinBody;
  try {
    body = (await req.json()) as ClipCheckinBody;
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_JSON' }, { status: 400 });
  }

  const eventId = body.eventId?.trim();
  const source = body.source;
  if (!eventId) {
    return NextResponse.json({ errorCode: 'MISSING_EVENT_ID' }, { status: 400 });
  }
  if (source !== 'qr' && source !== 'nfc' && source !== 'code') {
    return NextResponse.json(
      { errorCode: 'INVALID_SOURCE', message: "source: 'qr', 'nfc' veya 'code'." },
      { status: 400 },
    );
  }

  // QR'sız kod ile check-in — istemci kontrolü bypass edilebilir; sunucuda da
  // deterministik kodu yeniden hesaplayıp karşılaştır (ek savunma).
  if (source === 'code') {
    if (normalizeCode(body.code) !== checkinCodeFor('event', eventId)) {
      return NextResponse.json({ ok: false, message: 'Kod hatalı' }, { status: 400 });
    }
  }

  try {
    const db = getAdminFirestore();
    const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return NextResponse.json({ errorCode: 'EVENT_NOT_FOUND' }, { status: 404 });
    }
    const eventData = eventSnap.data() as {
      status?: string;
      startDate?: { toDate?: () => Date };
      endDate?: { toDate?: () => Date };
    };

    if (
      eventData.status === 'Beklemede' ||
      eventData.status === 'İptal' ||
      eventData.status === 'cancelled'
    ) {
      return NextResponse.json(
        { errorCode: 'EVENT_NOT_AVAILABLE' },
        { status: 403 },
      );
    }

    // NFC için tag doğrulama (qr'da App Clip URL kanıtı yeterli)
    if (source === 'nfc') {
      if (!body.tagId) {
        return NextResponse.json({ errorCode: 'MISSING_TAG_ID' }, { status: 400 });
      }
      const tagSnap = await db.collection(COLLECTIONS.nfcTags).doc(body.tagId).get();
      if (!tagSnap.exists) {
        return NextResponse.json({ errorCode: 'INVALID_TAG' }, { status: 403 });
      }
      const tagData = tagSnap.data() as { entityType?: string; entityId?: string };
      if (tagData.entityType !== 'event' || tagData.entityId !== eventId) {
        return NextResponse.json(
          { errorCode: 'TAG_MISMATCH', message: 'Tag bu etkinliğe ait değil.' },
          { status: 403 },
        );
      }
    }

    // Time window: 1 saat öncesi - 1 saat sonrası
    const now = new Date();
    const start = eventData.startDate?.toDate?.();
    const end = eventData.endDate?.toDate?.();
    if (start && now < new Date(start.getTime() - 60 * 60 * 1000)) {
      return NextResponse.json(
        { errorCode: 'TOO_EARLY', message: 'Check-in 1 saat öncesinden açılır.' },
        { status: 403 },
      );
    }
    if (end && now > new Date(end.getTime() + 60 * 60 * 1000)) {
      return NextResponse.json(
        { errorCode: 'TOO_LATE', message: 'Check-in penceresi kapandı.' },
        { status: 403 },
      );
    }

    // Doc id: uid varsa kullanıcı bazlı, yoksa device hash bazlı
    const checkinDocId = uid ?? `dev_${deviceHash}`;
    const checkinRef = eventRef.collection(COLLECTIONS.eventCheckins).doc(checkinDocId);
    const existing = await checkinRef.get();

    // Idempotent: zaten var
    if (existing.exists) {
      return NextResponse.json({ ok: true, already: true, checkinId: checkinDocId });
    }

    await checkinRef.set({
      uid: uid ?? null,
      deviceHash: deviceHash ?? null,
      anonymous: uid === null,
      source,
      checkedInAt: FieldValue.serverTimestamp(),
      meta: {
        clip: true,
        tagId: body.tagId ?? null,
      },
    });

    await eventRef.update({ checkedInCount: FieldValue.increment(1) });

    // Kimliği doğrulanmış ilk check-in → impact puanı (uygulama açıldığında
    // milestone konfetisi de bu artışla tetiklenir).
    if (uid) {
      await db.collection(COLLECTIONS.users).doc(uid)
        .update({ impactScore: FieldValue.increment(CHECKIN_POINTS) })
        .catch(() => undefined);

      // QR/NFC ile check-in yapan kullanıcı KESİN katıldı → RSVP'yi de 'going'
      // yaz. Katılımcı listesi (/api/events/[id]/attendees) yalnız 'going' RSVP'yi
      // gösteriyordu; bu satır olmadan QR ile gelenler listede GÖRÜNMÜYORDU.
      await eventRef.collection(COLLECTIONS.eventRsvps).doc(uid)
        .set({ userId: uid, status: 'going', source: 'checkin', updatedAt: FieldValue.serverTimestamp() }, { merge: true })
        .catch(() => undefined);
    }

    return NextResponse.json({ ok: true, checkinId: checkinDocId, source, points: uid ? CHECKIN_POINTS : 0 });
  } catch (err) {
    console.error('[clip/checkin] error', err);
    return NextResponse.json(
      {
        errorCode: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Bilinmeyen hata.',
      },
      { status: 500 },
    );
  }
}
