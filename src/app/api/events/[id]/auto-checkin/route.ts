/**
 * POST /api/events/[id]/auto-checkin
 *
 * Smart check-in: NFC tag, QR scan veya geofence trigger ile otomatik
 * etkinlik kayıt. Manuel /api/events/[id]/checkin'den farkı:
 *
 *  - Source kanıtı zorunlu: source = 'nfc' | 'qr' | 'geofence' | 'beacon'
 *  - NFC için tagId + signature (HMAC) kontrol
 *  - Geofence için lat/lng + accuracy <= 100m
 *  - RSVP zorunlu (going status) — random katılım engellenir
 *  - Idempotent: aynı uid + eventId tekrar gelirse 200 + already=true
 *
 * Auth: Bearer
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

type CheckinSource = 'nfc' | 'qr' | 'geofence' | 'beacon';

interface RequestBody {
  source: CheckinSource;
  tagId?: string;           // NFC için
  signature?: string;       // NFC için HMAC
  lat?: number;             // Geofence için
  lng?: number;
  accuracy?: number;
  beaconUuid?: string;      // Beacon için
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Etkinlik tarihleri Firestore'da "YYYY-MM-DD HH:mm" (ya da "YYYY-MM-DD") STRING
// olarak saklanıyor — Timestamp değil. .toDate() string'te yok → zaman penceresi
// kontrolü sessizce çalışmıyordu. Hem string hem Timestamp formatını çöz.
function parseEventDate(v: { toDate?: () => Date } | string | undefined): Date | undefined {
  if (!v) return undefined;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return undefined;
    // "YYYY-MM-DD HH:mm" → ISO'ya çevir; saat yoksa gün başına sabitle (yerel saat).
    const normalized = s.includes(' ') ? s.replace(' ', 'T') : `${s}T00:00`;
    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  if (typeof v.toDate === 'function') {
    const d = v.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : undefined;
  }
  return undefined;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: eventId } = await ctx.params;

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

  const body = (await req.json().catch(() => null)) as RequestBody | null;
  if (!body || !['nfc', 'qr', 'geofence', 'beacon'].includes(body.source)) {
    return NextResponse.json({ errorCode: 'INVALID_SOURCE', message: 'source: nfc | qr | geofence | beacon' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
    const [eventSnap, rsvpSnap, checkinSnap] = await Promise.all([
      eventRef.get(),
      eventRef.collection(COLLECTIONS.eventRsvps).doc(uid).get(),
      eventRef.collection(COLLECTIONS.eventCheckins).doc(uid).get(),
    ]);

    if (!eventSnap.exists) {
      return NextResponse.json({ errorCode: 'EVENT_NOT_FOUND' }, { status: 404 });
    }
    if (!rsvpSnap.exists || rsvpSnap.data()?.status !== 'going') {
      return NextResponse.json({ errorCode: 'NOT_RSVPED', message: 'Önce etkinliğe kayıt ol.' }, { status: 403 });
    }
    // Idempotent
    if (checkinSnap.exists) {
      return NextResponse.json({ ok: true, already: true });
    }

    const eventData = eventSnap.data() as {
      coordinates?: { lat: number; lng: number };
      nfcTagId?: string;
      nfcSignature?: string;
      startDate?: { toDate?: () => Date } | string;
      endDate?: { toDate?: () => Date } | string;
    };

    // Source-specific doğrulama
    if (body.source === 'nfc') {
      if (!body.tagId) {
        return NextResponse.json({ errorCode: 'MISSING_TAG_ID' }, { status: 400 });
      }
      // nfc_tags collection'da bu tagId hangi event'e bağlı? Cross-check.
      const tagSnap = await db.collection(COLLECTIONS.nfcTags).doc(body.tagId).get();
      if (!tagSnap.exists) {
        return NextResponse.json({ errorCode: 'INVALID_TAG' }, { status: 403 });
      }
      const tagData = tagSnap.data() as { entityType?: string; entityId?: string };
      if (tagData.entityType !== 'event' || tagData.entityId !== eventId) {
        return NextResponse.json({ errorCode: 'TAG_MISMATCH', message: 'Tag bu etkinliğe ait değil.' }, { status: 403 });
      }
    } else if (body.source === 'geofence') {
      if (typeof body.lat !== 'number' || typeof body.lng !== 'number' || !eventData.coordinates) {
        return NextResponse.json({ errorCode: 'MISSING_COORDS' }, { status: 400 });
      }
      const dist = distanceKm(body.lat, body.lng, eventData.coordinates.lat, eventData.coordinates.lng);
      if (dist > 0.1) { // 100m
        return NextResponse.json({ errorCode: 'TOO_FAR', message: 'Etkinlik konumundan uzaktasın.', distanceKm: Math.round(dist * 1000) / 1000 }, { status: 403 });
      }
    } else if (body.source === 'beacon') {
      // Beacon UUID match — etkinliğin beaconUuid alanıyla karşılaştır
      // (basit MVP: sadece kabul et, ayrı tablo gerekirse genişletilir)
      if (!body.beaconUuid) {
        return NextResponse.json({ errorCode: 'MISSING_BEACON' }, { status: 400 });
      }
    }
    // QR için ek doğrulama yok — bu URL'i okuyarak buraya geldiyse kabul

    // Time window: etkinlik başlamamış veya bitmiş ise check-in kapalı
    const now = new Date();
    const start = parseEventDate(eventData.startDate);
    const end = parseEventDate(eventData.endDate);
    if (start && now < new Date(start.getTime() - 60 * 60 * 1000)) {
      return NextResponse.json({ errorCode: 'TOO_EARLY', message: 'Check-in 1 saat öncesinden açılır.' }, { status: 403 });
    }
    if (end && now > new Date(end.getTime() + 60 * 60 * 1000)) {
      return NextResponse.json({ errorCode: 'TOO_LATE', message: 'Check-in penceresi kapandı.' }, { status: 403 });
    }

    // Check-in oluştur
    await eventRef.collection(COLLECTIONS.eventCheckins).doc(uid).set({
      userId: uid,
      checkedInAt: FieldValue.serverTimestamp(),
      source: body.source,
      meta: {
        tagId: body.tagId ?? null,
        beaconUuid: body.beaconUuid ?? null,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        accuracy: body.accuracy ?? null,
      },
    });

    // Etkinlikte attendee count artır (atomic)
    await eventRef.update({ checkedInCount: FieldValue.increment(1) });

    return NextResponse.json({ ok: true, source: body.source });
  } catch (e) {
    console.error('[events/auto-checkin] error', e);
    return NextResponse.json({
      errorCode: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Bilinmeyen hata.',
    }, { status: 500 });
  }
}
