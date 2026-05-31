/**
 * GET /api/users/me/disaster-alerts
 *
 * Kullanıcı için yakındaki aktif afet/acil çağrılarını döndürür.
 *
 * Filtre:
 *  - user.preferences.disasterAlerts === true (opt-in)
 *  - Lokasyon → radius km içinde
 *  - status === 'active' VE expiresAt > now
 *
 * Query: lat, lng (zorunlu), radiusKm (default 100)
 * Auth: Bearer
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface DisasterAlert {
  id: string;
  title?: string;
  type?: 'earthquake' | 'flood' | 'fire' | 'storm' | 'other';
  severity?: 'critical' | 'high' | 'normal';
  description?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  affectedRadiusKm?: number;
  status?: string;
  expiresAt?: { toDate: () => Date };
  createdAt?: { toDate: () => Date };
  helpUrl?: string;
  distanceKm?: number;
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

  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const radiusKm = Math.min(parseFloat(searchParams.get('radiusKm') ?? '100'), 500);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ errorCode: 'MISSING_LOCATION', message: 'lat ve lng zorunlu.' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const userSnap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const userData = userSnap.data() as { preferences?: { disasterAlerts?: boolean } } | undefined;
    if (userData?.preferences?.disasterAlerts !== true) {
      return NextResponse.json({ ok: true, alerts: [], message: 'Afet bildirimleri kapalı.' });
    }

    const now = new Date();
    const snap = await db.collection('disasterAlerts').where('status', '==', 'active').get();

    const alerts: DisasterAlert[] = [];
    snap.docs.forEach((d) => {
      const data = d.data() as DisasterAlert;
      // Süresi geçmiş alert'leri filtrele
      const expires = data.expiresAt?.toDate?.();
      if (expires && expires < now) return;
      const coords = data.coordinates;
      if (!coords) return;
      const dist = distanceKm(lat, lng, coords.lat, coords.lng);
      // Etki radius'u dahil et — uzaktan da etki edebilir
      const effectiveRadius = Math.max(radiusKm, data.affectedRadiusKm ?? 0);
      if (dist > effectiveRadius) return;
      alerts.push({ ...data, id: d.id, distanceKm: Math.round(dist * 10) / 10 });
    });

    // Severity + distance order
    alerts.sort((a, b) => {
      const sev = { critical: 0, high: 1, normal: 2 };
      const sa = sev[a.severity ?? 'normal'];
      const sb = sev[b.severity ?? 'normal'];
      if (sa !== sb) return sa - sb;
      return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
    });

    return NextResponse.json({ ok: true, alerts });
  } catch (e) {
    console.error('[disaster-alerts] error', e);
    return NextResponse.json({
      errorCode: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Bilinmeyen hata.',
    }, { status: 500 });
  }
}
