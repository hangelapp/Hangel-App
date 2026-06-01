/**
 * GET /api/clip/event/[id]
 *
 * App Clip event detayı endpoint'i. iOS App Clip experience'larından (NFC
 * tag / Smart Banner / QR) açıldığında etkinlik bilgilerini gösterebilmek
 * için minimum auth ile veri döner.
 *
 * Auth modeli:
 *  - Firebase ID token (Bearer) varsa kullanılır
 *  - Aksi halde `X-Device-Id` header ile anonymous device tanımlanır
 *
 * App Clip 10MB binary limit nedeniyle Firebase SDK init etmez; bütün
 * Firestore okumaları bu endpoint üzerinden yapılır. Public event metadata
 * + RSVP / check-in bilgisi (varsa) döner.
 *
 * Rate limit: anonymous device başına 60 req/dk.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { checkRateLimit } from '@/lib/rate-limit';
import { createHash } from 'crypto';

export const runtime = 'nodejs';

interface EventDocData {
  title?: string;
  name?: string;
  organizer?: string;
  organizerId?: string;
  ngoName?: string;
  imageUrl?: string;
  description?: string;
  location?: string | { city?: string; district?: string; type?: string; address?: string };
  coordinates?: { lat: number; lng: number };
  startDate?: { toDate?: () => Date } | string;
  endDate?: { toDate?: () => Date } | string;
  status?: string;
  capacity?: { max?: number; current?: number } | number;
  checkedInCount?: number;
  category?: string;
  slug?: string;
}

function hashDeviceId(deviceId: string): string {
  return createHash('sha256').update(deviceId).digest('hex').slice(0, 32);
}

function dateToIso(value: { toDate?: () => Date } | string | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: eventId } = await ctx.params;
  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ errorCode: 'INVALID_EVENT_ID' }, { status: 400 });
  }

  // Resolve identity: Firebase token preferred, otherwise anonymous device id
  let uid: string | null = null;
  let deviceHash: string | null = null;

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
  } else {
    const deviceId = req.headers.get('x-device-id')?.trim();
    if (!deviceId || deviceId.length < 8) {
      return NextResponse.json(
        { errorCode: 'NO_AUTH', message: 'Bearer token veya X-Device-Id gerekli.' },
        { status: 401 },
      );
    }
    deviceHash = hashDeviceId(deviceId);
  }

  // Rate limit (per device or uid)
  const rateKey = uid ?? `dev_${deviceHash}`;
  const rateRes = await checkRateLimit({
    bucket: 'clip-event-get',
    key: rateKey,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateRes.allowed) {
    return NextResponse.json(
      { errorCode: 'RATE_LIMITED', message: 'Çok fazla istek; biraz bekleyin.' },
      { status: 429 },
    );
  }

  try {
    const db = getAdminFirestore();
    const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return NextResponse.json({ errorCode: 'EVENT_NOT_FOUND' }, { status: 404 });
    }

    const e = eventSnap.data() as EventDocData;

    // Sub-status check — taslak veya iptal etkinlikleri App Clip'te gösterme
    if (e.status === 'Beklemede' || e.status === 'İptal' || e.status === 'cancelled') {
      return NextResponse.json(
        { errorCode: 'EVENT_NOT_AVAILABLE', message: 'Etkinlik şu anda erişilebilir değil.' },
        { status: 403 },
      );
    }

    // Capacity info
    let capacityMax: number | null = null;
    if (typeof e.capacity === 'object' && e.capacity !== null) {
      capacityMax = typeof e.capacity.max === 'number' && e.capacity.max > 0 ? e.capacity.max : null;
    } else if (typeof e.capacity === 'number' && e.capacity > 0) {
      capacityMax = e.capacity;
    }

    // User-specific state (only if authenticated with uid)
    let userRsvpStatus: string | null = null;
    let userCheckedIn = false;
    if (uid) {
      const [rsvpSnap, checkinSnap] = await Promise.all([
        eventRef.collection(COLLECTIONS.eventRsvps).doc(uid).get(),
        eventRef.collection(COLLECTIONS.eventCheckins).doc(uid).get(),
      ]);
      if (rsvpSnap.exists) {
        userRsvpStatus = (rsvpSnap.data() as { status?: string })?.status ?? null;
      }
      userCheckedIn = checkinSnap.exists;
    }

    return NextResponse.json({
      ok: true,
      event: {
        id: eventSnap.id,
        title: e.title ?? e.name ?? '',
        organizer: e.organizer ?? e.ngoName ?? '',
        organizerId: e.organizerId ?? null,
        imageUrl: e.imageUrl ?? null,
        description: e.description ?? null,
        location: e.location ?? null,
        coordinates: e.coordinates ?? null,
        startDate: dateToIso(e.startDate),
        endDate: dateToIso(e.endDate),
        category: e.category ?? null,
        slug: e.slug ?? null,
        capacity: {
          max: capacityMax,
          checkedIn: typeof e.checkedInCount === 'number' ? e.checkedInCount : 0,
        },
      },
      viewer: {
        authenticated: uid !== null,
        rsvpStatus: userRsvpStatus,
        checkedIn: userCheckedIn,
      },
    });
  } catch (err) {
    console.error('[clip/event] error', err);
    return NextResponse.json(
      {
        errorCode: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Bilinmeyen hata.',
      },
      { status: 500 },
    );
  }
}
