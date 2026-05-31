/**
 * GET /api/users/me/profile-bundle
 *
 * Profile sayfası için tek seferde tüm bağımlı data'yı döndürür:
 *  - user doc (personalInfo, stats, supportedNgos, volunteerNgos, followedBrands, joinedClubs)
 *  - supported NGOs (ilk 10) → name, avatarUrl, logoUrl
 *  - volunteer NGOs (ilk 10)
 *  - followed brands (ilk 10) → name, logoUrl, slug
 *  - joined clubs (ilk 10) → name, avatarUrl, logoUrl
 *  - badges sub-collection
 *  - certificates sub-collection
 *  - pastVolunteering sub-collection
 *  - approved applications (Gönüllülük, Onaylandı)
 *
 * Önceki yapı: client-side 7-8 ayrı useCollection paralel listener.
 * Yeni: server-side Promise.all → tek HTTP request. Real-time kayıp ama
 * profil sayfası gerçek zamanlı update gerektirmez (manual refresh OK).
 *
 * Auth: Firebase ID token Bearer.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import type { Firestore } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

interface BundleResponse {
  user: Record<string, unknown> | null;
  supportedNgos: Array<{ id: string; name?: string; avatarUrl?: string; logoUrl?: string }>;
  volunteerNgos: Array<{ id: string; name?: string; avatarUrl?: string; logoUrl?: string }>;
  followedBrands: Array<{ id: string; name?: string; logoUrl?: string; slug?: string }>;
  joinedClubs: Array<{ id: string; name?: string; avatarUrl?: string; logoUrl?: string }>;
  badges: Array<Record<string, unknown>>;
  certificates: Array<Record<string, unknown>>;
  pastVolunteering: Array<Record<string, unknown>>;
  approvedApplications: Array<Record<string, unknown>>;
}

async function fetchByIds(db: Firestore, collectionName: string, ids: string[]) {
  if (!ids.length) return [];
  // Firestore 'in' query limit 10 — ids.slice(0, 10) front-end pattern
  const slice = ids.slice(0, 10);
  const snap = await db.collection(collectionName)
    .where('__name__', 'in', slice)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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

  try {
    const db = getAdminFirestore();
    const userRef = db.collection(COLLECTIONS.users).doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ errorCode: 'USER_NOT_FOUND' }, { status: 404 });
    }
    const userData = userSnap.data() as {
      supportedNgos?: string[];
      volunteerNgos?: string[];
      followedBrands?: string[];
      joinedClubs?: string[];
    };

    const supportedIds = userData.supportedNgos ?? [];
    const volunteerIds = userData.volunteerNgos ?? [];
    const brandIds = userData.followedBrands ?? [];
    const clubIds = userData.joinedClubs ?? [];

    const [
      supportedNgos,
      volunteerNgos,
      followedBrands,
      joinedClubs,
      badgesSnap,
      certsSnap,
      pastVolSnap,
      appsSnap,
    ] = await Promise.all([
      fetchByIds(db, COLLECTIONS.ngos, supportedIds),
      fetchByIds(db, COLLECTIONS.ngos, volunteerIds),
      fetchByIds(db, COLLECTIONS.brands, brandIds),
      fetchByIds(db, COLLECTIONS.clubs, clubIds),
      userRef.collection(COLLECTIONS.badges).get(),
      userRef.collection(COLLECTIONS.certificates).get(),
      userRef.collection(COLLECTIONS.pastVolunteering).get(),
      db.collection(COLLECTIONS.applications)
        .where('userId', '==', uid)
        .where('type', '==', 'Gönüllülük')
        .where('status', '==', 'Onaylandı')
        .get(),
    ]);

    const body: BundleResponse = {
      user: { id: uid, ...userData },
      supportedNgos: supportedNgos as BundleResponse['supportedNgos'],
      volunteerNgos: volunteerNgos as BundleResponse['volunteerNgos'],
      followedBrands: followedBrands as BundleResponse['followedBrands'],
      joinedClubs: joinedClubs as BundleResponse['joinedClubs'],
      badges: badgesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      certificates: certsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      pastVolunteering: pastVolSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      approvedApplications: appsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };

    return NextResponse.json({ ok: true, bundle: body });
  } catch (e) {
    console.error('[profile-bundle] error', e);
    return NextResponse.json({
      errorCode: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Bilinmeyen hata.',
    }, { status: 500 });
  }
}
