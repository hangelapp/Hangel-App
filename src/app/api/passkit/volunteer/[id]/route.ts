/**
 * Gönüllülük için Apple Wallet pkpass üret — Faz 1.2.
 *
 * Kullanıcı /volunteering/[id] sayfasında "Apple Wallet'a Ekle" butonuna
 * tıklayınca bu endpoint çağrılır. Cevap olarak .pkpass dosyası iner; iPhone
 * Safari / Wallet bunu otomatik tanır ve "Add to Wallet" dialog'u açar.
 *
 * Etkinlik muadili: src/app/api/passkit/event/[id]/route.ts (birebir aynı
 * response biçimi + auth yaklaşımı). Tek fark: RSVP yerine kullanıcının bu
 * gönüllülüğe BAŞVURDUĞU `applications` koleksiyonundan doğrulanır.
 *
 * Auth: Bearer ID token doğrula + kullanıcının başvurusu var mı kontrol (yoksa 403).
 */

import { NextRequest, NextResponse } from 'next/server';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { generateEventPass } from '@/lib/passkit/generator';
import { randomBytes } from 'crypto';

interface VolunteeringDoc {
  title?: string;
  organization?: string;
  location?: {
    city?: string;
    district?: string;
    type?: string;
    coordinates?: { lat: number; lon: number };
  };
  dates?: {
    eventStart?: string;
    eventEnd?: string;
  };
}

/** `yyyy-MM-dd` string'i Date'e çevir; geçersizse undefined. */
function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: volunteeringId } = await ctx.params;
  const authHeader = req.headers.get('authorization');
  // Capacitor WebView blob URL Wallet'ı tetiklemediğinden pkpass sistem tarayıcısında
  // açılır → token header yoksa ?token= query ile de kabul edilir.
  const queryToken = req.nextUrl.searchParams.get('token');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : (queryToken || '');

  // Auth: bearer header veya ?token= query (event route ile aynı).
  let uid: string | null = null;
  let userName = 'Gönüllü';
  if (rawToken) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(rawToken);
      uid = decoded.uid;
      userName = decoded.name ?? decoded.email?.split('@')[0] ?? 'Gönüllü';
    } catch {
      return NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 });
    }
  }
  if (!uid) {
    return NextResponse.json({ errorCode: 'NO_AUTH', message: 'Giriş gerekli.' }, { status: 401 });
  }

  const db = getAdminFirestore();
  const volunteeringRef = db.collection(COLLECTIONS.volunteering).doc(volunteeringId);

  // handleApply (src/app/volunteering/[id]/page.tsx) başvuruyu top-level
  // `applications` koleksiyonuna { userId, entityId, type: 'Gönüllülük', ... }
  // şemasıyla yazar. Başvuruyu bu koleksiyondan doğrula.
  const [volunteeringSnap, applicationQuery] = await Promise.all([
    volunteeringRef.get(),
    db.collection(COLLECTIONS.applications)
      .where('userId', '==', uid)
      .where('entityId', '==', volunteeringId)
      .where('type', '==', 'Gönüllülük')
      .limit(1)
      .get(),
  ]);

  if (!volunteeringSnap.exists) {
    return NextResponse.json({ errorCode: 'VOLUNTEERING_NOT_FOUND' }, { status: 404 });
  }
  if (applicationQuery.empty) {
    return NextResponse.json({ errorCode: 'NOT_APPLIED', message: 'Önce bu gönüllülüğe başvur.' }, { status: 403 });
  }

  const v = volunteeringSnap.data() as VolunteeringDoc;
  const startDate = parseDate(v.dates?.eventStart) ?? new Date();
  const endDate = parseDate(v.dates?.eventEnd);
  const locationLabel = [v.location?.city, v.location?.district].filter(Boolean).join(', ');
  // Volunteering şemasında koordinat `{ lat, lon }`; generator `{ lat, lng }` ister.
  const coords = v.location?.coordinates;
  const coordinates = coords ? { lat: coords.lat, lng: coords.lon } : undefined;

  // Apple update web service için authentication token + passkit serial.
  const authenticationToken = randomBytes(16).toString('hex');
  const serialNumber = `${volunteeringId}_${uid}`;

  try {
    // Generator gönüllülüğe özel bir input/fonksiyon sunmuyor; etkinlik route
    // ile birebir tutarlılık için generateEventPass'i gönüllülük verisiyle
    // (başlık=gönüllülük title, STK=organization, "GÖNÜLLÜ" rolü) doldurarak çağır.
    const buffer = await generateEventPass({
      serialNumber,
      eventTitle: v.title ?? 'hangel Gönüllülük',
      ngoName: v.organization ?? '',
      location: locationLabel,
      startDate,
      endDate,
      coordinates,
      ticketId: serialNumber,
      authenticationToken,
      qrPayload: `${userName} — GÖNÜLLÜ — ${serialNumber}`,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.apple.pkpass',
        'content-disposition': `attachment; filename="hangel-${volunteeringId}.pkpass"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    // PASSKIT_* env eksikse generator throw eder; istemciye temiz hata dön.
    const message = e instanceof Error ? e.message : 'Pass üretilemedi. Sertifika yapılandırması eksik olabilir.';
    const isConfigError = /PASSKIT_/.test(message);
    return NextResponse.json({
      errorCode: 'PKPASS_GENERATION_FAILED',
      message: isConfigError
        ? 'Apple Wallet yapılandırması eksik. Lütfen daha sonra tekrar deneyin.'
        : message,
    }, { status: isConfigError ? 503 : 500 });
  }
}
