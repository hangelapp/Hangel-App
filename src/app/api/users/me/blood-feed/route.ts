/**
 * GET /api/users/me/blood-feed
 *
 * Kullanıcı için yakındaki kan/trombosit/kök hücre ilanlarını döndürür.
 *
 * Filtreleme:
 *  - Kullanıcının personalInfo.bloodType matches OR universal (Compatible)
 *  - Kullanıcının current location (query param) → radius km içinde
 *  - status === 'active' (sona ermemiş)
 *
 * Query params:
 *  - lat, lng (zorunlu)
 *  - radiusKm (default 50)
 *  - urgentOnly (default false) — sadece urgency='critical'
 *
 * Auth: Bearer
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

// Haversine — iki nokta arasındaki km mesafe
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface BloodCall {
  id: string;
  title?: string;
  bloodTypes?: string[];
  donationType?: 'blood' | 'platelet' | 'stem-cell';
  urgency?: 'critical' | 'high' | 'normal';
  location?: string;
  coordinates?: { lat: number; lng: number };
  hospitalName?: string;
  contactPhone?: string;
  status?: string;
  createdAt?: { toDate: () => Date };
  expiresAt?: { toDate: () => Date };
  distanceKm?: number;
}

// Kan grubu uyumluluk matrisi (alıcı → bağışlayabilecek tipler)
const COMPATIBILITY: Record<string, string[]> = {
  'A Rh+': ['A Rh+', 'A Rh-', '0 Rh+', '0 Rh-'],
  'A Rh-': ['A Rh-', '0 Rh-'],
  'B Rh+': ['B Rh+', 'B Rh-', '0 Rh+', '0 Rh-'],
  'B Rh-': ['B Rh-', '0 Rh-'],
  'AB Rh+': ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'],
  'AB Rh-': ['A Rh-', 'B Rh-', 'AB Rh-', '0 Rh-'],
  '0 Rh+': ['0 Rh+', '0 Rh-'],
  '0 Rh-': ['0 Rh-'],
};

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
  const radiusKm = Math.min(parseFloat(searchParams.get('radiusKm') ?? '50'), 200);
  const urgentOnly = searchParams.get('urgentOnly') === '1';

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ errorCode: 'MISSING_LOCATION', message: 'lat ve lng zorunlu.' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const userSnap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const userData = userSnap.data() as { personalInfo?: { bloodType?: string; canDonateBlood?: boolean } } | undefined;
    const userBloodType = userData?.personalInfo?.bloodType;
    const canDonate = userData?.personalInfo?.canDonateBlood === true;

    if (!canDonate) {
      return NextResponse.json({ ok: true, calls: [], message: 'Kan bağışı uygunluğu kapalı.' });
    }

    // Kan ilanları TEK kaynaktan: emergencyRequests (type:'blood', status:'approved').
    // Böylece "Bağışa geleceğim" (respond) + ilan sahibi bağışçı listesi aynı doc'a oturur.
    const snap = await db.collection(COLLECTIONS.emergencyRequests)
      .where('type', '==', 'blood')
      .where('status', '==', 'approved')
      .get();

    const compat = userBloodType ? COMPATIBILITY[userBloodType] ?? [] : null;
    const calls: BloodCall[] = [];

    snap.docs.forEach((d) => {
      const data = d.data() as {
        bloodType?: string; coordinates?: { lat: number; lng: number } | null;
        hospitalName?: string; contactPhone?: string; hospitalCity?: string; city?: string;
      };
      const coords = data.coordinates;
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
      const dist = distanceKm(lat, lng, coords.lat, coords.lng);
      if (dist > radiusKm) return;
      const bloodTypes = data.bloodType ? [data.bloodType] : [];
      if (compat && bloodTypes.length > 0) {
        const matches = bloodTypes.some((bt) => compat.includes(bt) || bt === 'Bilinmiyor');
        if (!matches) return;
      }
      if (urgentOnly) return; // emergencyRequests'te kritiklik ayrımı yok → urgentOnly hepsini eler
      calls.push({
        id: d.id,
        bloodTypes,
        donationType: 'blood',
        urgency: 'high',
        hospitalName: data.hospitalName,
        contactPhone: data.contactPhone,
        coordinates: coords,
        location: data.hospitalCity || data.city || '',
        status: 'active',
        distanceKm: Math.round(dist * 10) / 10,
      });
    });

    // Distance + urgency'ye göre sırala
    calls.sort((a, b) => {
      const urgencyRank = { critical: 0, high: 1, normal: 2 };
      const ua = urgencyRank[a.urgency ?? 'normal'];
      const ub = urgencyRank[b.urgency ?? 'normal'];
      if (ua !== ub) return ua - ub;
      return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
    });

    return NextResponse.json({ ok: true, calls });
  } catch (e) {
    console.error('[blood-feed] error', e);
    return NextResponse.json({
      errorCode: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Bilinmeyen hata.',
    }, { status: 500 });
  }
}
