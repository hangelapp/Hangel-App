/**
 * Etkinlik akıllı check-in / check-out endpoint'i — Faz 1.
 *
 * POST: kullanıcı QR/NFC ile etkinlik check-in yapar; konum doğrulamalı (100m).
 * DELETE: kullanıcı manuel veya geofence exit otomatik check-out yapar.
 *
 * Path: events/{eventId}/checkins/{uid}
 *
 * Doğrulama:
 *  - Etkinlik var mı (publish/active)
 *  - Lokasyon etkinlik koordinatlarına 100m içinde mi (manual hariç)
 *  - Kullanıcı zaten check-in mi (idempotent: bir kere yazılır)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

const CHECK_IN_RADIUS_METERS = 100;

const PostBodySchema = z.object({
  method: z.enum(['qr', 'nfc', 'manual']),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional(),
  }).optional(),
});

interface EventDoc {
  status?: string;
  coordinates?: { lat: number; lng: number };
  startDate?: { toDate?: () => Date } | string;
  endDate?: { toDate?: () => Date } | string;
}

// Etkinlik tarihleri Firestore'da "YYYY-MM-DD HH:mm" (ya da "YYYY-MM-DD") STRING
// olarak saklanıyor — Timestamp değil. .toDate() string'te yok → zaman penceresi
// kontrolü hiç çalışmıyordu. Hem string hem Timestamp formatını çöz.
function parseEventDate(v: EventDoc['startDate']): Date | undefined {
  if (!v) return undefined;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return undefined;
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

function haversine(a: { latitude: number; longitude: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(b.lat - a.latitude);
  const dLng = toRad(b.lng - a.longitude);
  const sa = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}

async function verifyAuthUid(req: NextRequest): Promise<{ uid: string } | { error: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ errorCode: 'NO_AUTH', message: 'Authorization gerekli.' }, { status: 401 }) };
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
    return { uid: decoded.uid };
  } catch {
    return { error: NextResponse.json({ errorCode: 'INVALID_TOKEN', message: 'Geçersiz oturum.' }, { status: 401 }) };
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: eventId } = await ctx.params;
  if (!eventId) return NextResponse.json({ errorCode: 'NO_EVENT_ID' }, { status: 400 });

  const auth = await verifyAuthUid(req);
  if ('error' in auth) return auth.error;
  const { uid } = auth;

  let body: z.infer<typeof PostBodySchema>;
  try {
    body = PostBodySchema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message ?? 'Geçersiz veri.' : 'Body okunamadı.';
    return NextResponse.json({ errorCode: 'INVALID_BODY', message }, { status: 400 });
  }

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    return NextResponse.json({ errorCode: 'EVENT_NOT_FOUND' }, { status: 404 });
  }
  const event = eventSnap.data() as EventDoc;

  // Konum doğrulaması (qr + nfc için zorunlu; manual'da admin override sayar)
  if (body.method !== 'manual') {
    if (!body.location) {
      return NextResponse.json({ errorCode: 'LOCATION_REQUIRED', message: 'QR/NFC check-in için konum izni gerekli.' }, { status: 400 });
    }
    if (!event.coordinates) {
      return NextResponse.json({ errorCode: 'EVENT_HAS_NO_COORDINATES', message: 'Etkinlik koordinatı tanımlı değil.' }, { status: 409 });
    }
    const distance = haversine(body.location, event.coordinates);
    if (distance > CHECK_IN_RADIUS_METERS) {
      return NextResponse.json({
        errorCode: 'TOO_FAR',
        message: `Etkinliğe ${Math.round(distance)}m uzaklıktasınız. ${CHECK_IN_RADIUS_METERS}m içinde olmalısınız.`,
      }, { status: 403 });
    }
  }

  // Zaman penceresi: check-in 1 saat öncesinden açılır, bitişten 1 saat sonra kapanır.
  // (Tarih string parse edilmeden bu kontrol hiç çalışmıyordu.)
  const now = new Date();
  const start = parseEventDate(event.startDate);
  const end = parseEventDate(event.endDate);
  if (start && now < new Date(start.getTime() - 60 * 60 * 1000)) {
    return NextResponse.json({ errorCode: 'TOO_EARLY', message: 'Check-in 1 saat öncesinden açılır.' }, { status: 403 });
  }
  if (end && now > new Date(end.getTime() + 60 * 60 * 1000)) {
    return NextResponse.json({ errorCode: 'TOO_LATE', message: 'Check-in penceresi kapandı.' }, { status: 403 });
  }

  const checkinRef = eventRef.collection(COLLECTIONS.eventCheckins).doc(uid);
  const existing = await checkinRef.get();
  if (existing.exists && !existing.data()?.checkedOutAt) {
    // Idempotent — zaten aktif check-in
    return NextResponse.json({ ok: true, alreadyCheckedIn: true });
  }

  await checkinRef.set({
    uid,
    eventId,
    method: body.method,
    location: body.location ?? null,
    checkedInAt: FieldValue.serverTimestamp(),
    checkedOutAt: null,
  }, { merge: true });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: eventId } = await ctx.params;
  if (!eventId) return NextResponse.json({ errorCode: 'NO_EVENT_ID' }, { status: 400 });

  const auth = await verifyAuthUid(req);
  if ('error' in auth) return auth.error;
  const { uid } = auth;

  const db = getAdminFirestore();
  const checkinRef = db.collection(COLLECTIONS.events).doc(eventId).collection(COLLECTIONS.eventCheckins).doc(uid);
  const snap = await checkinRef.get();
  if (!snap.exists) {
    return NextResponse.json({ ok: true, alreadyCheckedOut: true });
  }

  await checkinRef.update({
    checkedOutAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
