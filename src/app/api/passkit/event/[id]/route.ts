/**
 * Etkinlik için Apple Wallet pkpass üret — Faz 1.2.
 *
 * Kullanıcı /event/[id] sayfasında "Apple Wallet'a Ekle" butonuna tıklayınca
 * bu endpoint çağrılır. Cevap olarak .pkpass dosyası iner; iPhone Safari /
 * Wallet bunu otomatik tanır ve "Add to Wallet" dialog'u açar.
 *
 * Auth: kullanıcının etkinliğe RSVP'si var mı kontrol (yoksa 403).
 */

import { NextRequest, NextResponse } from 'next/server';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { generateEventPass } from '@/lib/passkit/generator';
import { randomBytes } from 'crypto';

interface EventDoc {
  name?: string;
  title?: string;
  organizer?: string;
  ngoName?: string;
  // Etkinlikte tarih STRING ("YYYY-MM-DD HH:mm"), konum OBJE — gönüllülükle aynı kalıp.
  startDate?: string;
  endDate?: string;
  location?: { type?: string; address?: string; city?: string; district?: string; coordinates?: { lat?: number; lon?: number; lng?: number } };
  organizerLogoUrl?: string;
  contributors?: Array<{ userId?: string; role?: string }>;
}

/** "YYYY-MM-DD HH:mm" (yerel) → Date. Geçersizse null. */
function parseLocalDate(s?: string): Date | null {
  if (!s || typeof s !== 'string') return null;
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
  const [, y, mo, d, hh, mm] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(hh || '0'), Number(mm || '0'), 0, 0);
}

/** Date → "HH:mm" (Europe/Istanbul). Geçersizse boş. */
function hm(d?: Date): string {
  if (!d || isNaN(d.getTime())) return '';
  try {
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
  } catch {
    return '';
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: eventId } = await ctx.params;
  const authHeader = req.headers.get('authorization');
  // Capacitor WebView'da blob URL Wallet'ı tetiklemediği için pkpass sistem
  // tarayıcısında (Safari) AÇILIR; o yüzden token header yoksa ?token= ile de kabul edilir.
  const queryToken = req.nextUrl.searchParams.get('token');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : (queryToken || '');

  // Auth: bearer header veya ?token= query
  let uid: string | null = null;
  let userName = 'Katılımcı';
  if (rawToken) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(rawToken);
      uid = decoded.uid;
      userName = decoded.name ?? decoded.email?.split('@')[0] ?? 'Katılımcı';
    } catch {
      return NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 });
    }
  }
  if (!uid) {
    return NextResponse.json({ errorCode: 'NO_AUTH', message: 'Giriş gerekli.' }, { status: 401 });
  }

  const db = getAdminFirestore();
  const eventRef = db.collection(COLLECTIONS.events).doc(eventId);
  const [eventSnap, rsvpSnap] = await Promise.all([
    eventRef.get(),
    eventRef.collection(COLLECTIONS.eventRsvps).doc(uid).get(),
  ]);

  if (!eventSnap.exists) {
    return NextResponse.json({ errorCode: 'EVENT_NOT_FOUND' }, { status: 404 });
  }
  if (!rsvpSnap.exists || rsvpSnap.data()?.status !== 'going') {
    return NextResponse.json({ errorCode: 'NOT_RSVPED', message: 'Önce etkinliğe kayıt ol.' }, { status: 403 });
  }

  const e = eventSnap.data() as EventDoc;
  const startDate = parseLocalDate(e.startDate) ?? new Date();
  const endDate = parseLocalDate(e.endDate) ?? undefined;
  // Konum: OBJE → string etiket (gönüllülükle aynı). PassKit field value string olmalı.
  const loc = e.location;
  const locationLabel = loc?.type === 'Online'
    ? 'Online'
    : [loc?.city, loc?.district].filter(Boolean).join(', ');
  const fullAddress = [loc?.address, loc?.district, loc?.city].filter(Boolean).join(', ') || locationLabel;
  const coords = loc?.coordinates;
  const coordinates = coords && typeof coords.lat === 'number'
    ? { lat: coords.lat, lng: (coords.lng ?? coords.lon) as number }
    : undefined;
  // Başlangıç–bitiş saati etiketi.
  const startHm = hm(startDate);
  const endHm = hm(endDate);
  const timeLabel = startHm ? (endHm ? `${startHm} – ${endHm}` : startHm) : '';
  // Rol: kullanıcı etkinlik ekibinde (konuşmacı/katkı) ise rolünü kullan; değilse Katılımcı.
  const contributor = (e.contributors ?? []).find((c) => c.userId === uid);
  const role = contributor?.role?.trim() || 'Katılımcı';

  // Authentication token üret (Apple update web service için) ve passkit
  // kaydı oluştur (event update'inde tüm pass'lere push edilir).
  const authenticationToken = randomBytes(16).toString('hex');
  const serialNumber = `${eventId}_${uid}`;

  try {
    const buffer = await generateEventPass({
      serialNumber,
      eventTitle: e.name ?? e.title ?? 'hangel Etkinliği',
      ngoName: e.organizer ?? e.ngoName ?? '',
      location: locationLabel,
      startDate,
      endDate,
      coordinates,
      ticketId: serialNumber,
      authenticationToken,
      kind: 'event',
      role,
      userName,
      address: fullAddress,
      timeLabel,
      ngoLogoUrl: e.organizerLogoUrl,
      qrPayload: `https://hangel.org/events/${eventId}`,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.apple.pkpass',
        'content-disposition': `attachment; filename="hangel-${eventId}.pkpass"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({
      errorCode: 'PKPASS_GENERATION_FAILED',
      message: e instanceof Error ? e.message : 'Pass üretilemedi. Sertifika yapılandırması eksik olabilir.',
    }, { status: 500 });
  }
}
