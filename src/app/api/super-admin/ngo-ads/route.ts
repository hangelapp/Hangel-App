/**
 * GET /api/super-admin/ngo-ads — STK reklam planları (ajans paneli).
 *
 * Tüm STK'ların kaydettiği reklam planlarını + durum sayılarını döndürür.
 * hangel ekibi buradan görüp (Faz 1'e kadar MCC'den manuel) yayınlar.
 *
 * Auth: super-admin. Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.adPlans).limit(500).get().catch(() => null);
  const plans = snap
    ? snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const ts = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: d.id,
          ngoId: data.ngoId ?? '',
          ngoName: data.ngoName ?? '',
          platform: data.platform ?? 'google',
          kind: data.kind ?? '',
          title: data.title ?? '',
          landing: data.landing ?? '',
          status: data.status ?? 'submitted',
          createdAt: ts?.toMillis?.() ?? null,
        };
      })
    : [];

  // Durum sayıları (pipeline)
  const counts: Record<string, number> = { submitted: 0, approved: 0, linked: 0, active: 0 };
  for (const p of plans) {
    const s = String(p.status);
    if (s in counts) counts[s] += 1;
  }
  // En yeni önce
  plans.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return NextResponse.json({ plans, counts, total: plans.length });
}
