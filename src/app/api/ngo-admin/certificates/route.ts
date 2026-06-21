/**
 * GET /api/ngo-admin/certificates?orgId=&kind=ngo|brand|club
 *
 * Aktif kurumun "Sertifikalarımız" sayfasını besler. Kök `certificates`
 * koleksiyonunun client okuma kuralı YOK (firestore.rules'da match bloğu yok →
 * default deny). Bu yüzden Admin SDK ile sunucu tarafından çekilir.
 *
 * İki liste döner:
 *   - earned: kuruma VERİLEN sertifikalar (recipientType == 'org' && orgId == orgId)
 *   - issued: kurumun kişilere VERDİĞİ sertifikalar (ngoId == orgId)
 *
 * Yetki: istek sahibi bu kurumu yönetmeli (managed{Ngo|Brand|Club}Id == orgId)
 * VEYA super-admin olmalı. Aksi halde 403.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

const MANAGED_FIELD: Record<'ngo' | 'brand' | 'club', string> = {
  ngo: 'managedNgoId',
  brand: 'managedBrandId',
  club: 'managedClubId',
};

interface CertRow {
  id: string;
  title?: string;
  eventName?: string;
  code?: string;
  date?: string;
  ngoName?: string;
  orgName?: string;
  type?: string;
  role?: string;
  description?: string;
}

// Sunucudan istemciye yalnız gösterilen alanları çıkar (issuedBy / userId sızdırma).
function pick(id: string, d: FirebaseFirestore.DocumentData): CertRow {
  return {
    id,
    title: typeof d.title === 'string' ? d.title : undefined,
    eventName: typeof d.eventName === 'string' ? d.eventName : undefined,
    code: typeof d.code === 'string' ? d.code : undefined,
    date: typeof d.date === 'string' ? d.date : undefined,
    ngoName: typeof d.ngoName === 'string' ? d.ngoName : undefined,
    orgName: typeof d.orgName === 'string' ? d.orgName : undefined,
    type: typeof d.type === 'string' ? d.type : undefined,
    role: typeof d.role === 'string' ? d.role : undefined,
    description: typeof d.description === 'string' ? d.description : undefined,
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!idToken) return errJson('unauthenticated', 'Token gerekli', 401);

  let uid: string;
  let role: unknown;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
    role = (decoded as { role?: unknown }).role;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }

  const orgId = req.nextUrl.searchParams.get('orgId');
  const kindParam = req.nextUrl.searchParams.get('kind');
  if (!orgId) return errJson('invalid_input', 'orgId gerekli', 400);
  if (kindParam !== 'ngo' && kindParam !== 'brand' && kindParam !== 'club') {
    return errJson('invalid_input', 'kind ngo|brand|club olmalı', 400);
  }
  const kind = kindParam;

  const db = getAdminFirestore();

  // Yetki — super-admin ya da bu kurumu yöneten kullanıcı.
  let authorized = role === 'super-admin';
  if (!authorized) {
    const snap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const u = snap.data() as Record<string, unknown> | undefined;
    if (u?.role === 'super-admin' || u?.[MANAGED_FIELD[kind]] === orgId) authorized = true;
  }
  if (!authorized) return errJson('forbidden', 'Bu kurumun sertifikalarını görme yetkin yok.', 403);

  try {
    const [earnedSnap, issuedSnap] = await Promise.all([
      db.collection(COLLECTIONS.certificates)
        .where('recipientType', '==', 'org')
        .where('orgId', '==', orgId)
        .get(),
      db.collection(COLLECTIONS.certificates)
        .where('ngoId', '==', orgId)
        .get(),
    ]);

    const byDateDesc = (a: CertRow, b: CertRow) => (b.date ?? '').localeCompare(a.date ?? '');
    const earned = earnedSnap.docs.map((d) => pick(d.id, d.data())).sort(byDateDesc);
    const issued = issuedSnap.docs.map((d) => pick(d.id, d.data())).sort(byDateDesc);

    return NextResponse.json({ ok: true, earned, issued });
  } catch (err) {
    console.error('[ngo-admin/certificates] query failed', err);
    return errJson('query_failed', 'Sertifikalar okunamadı.', 500);
  }
}
