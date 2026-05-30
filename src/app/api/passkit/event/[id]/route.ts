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
  title?: string;
  ngoName?: string;
  location?: string;
  startDate?: { toDate?: () => Date };
  endDate?: { toDate?: () => Date };
  coordinates?: { lat: number; lng: number };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: eventId } = await ctx.params;
  const authHeader = req.headers.get('authorization');

  // Auth: cookie veya bearer
  let uid: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
      uid = decoded.uid;
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
  const startDate = e.startDate?.toDate?.() ?? new Date();
  const endDate = e.endDate?.toDate?.();

  // Authentication token üret (Apple update web service için) ve passkit
  // kaydı oluştur (event update'inde tüm pass'lere push edilir).
  const authenticationToken = randomBytes(16).toString('hex');
  const serialNumber = `${eventId}_${uid}`;

  try {
    const buffer = await generateEventPass({
      serialNumber,
      eventTitle: e.title ?? 'Hangel Etkinliği',
      ngoName: e.ngoName ?? '',
      location: e.location ?? '',
      startDate,
      endDate,
      coordinates: e.coordinates,
      ticketId: serialNumber,
      authenticationToken,
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
