/**
 * Kullanıcı oturum (giriş/çıkış) listesi — super-admin Aktiviteler sayfası "Giriş/Çıkış" tabı.
 *
 * GET → super-admin doğrula → collectionGroup('sessions') son aktiviteye göre →
 *   her oturumun kullanıcısını (ad + rol) çöz → { userId, userName, role, roleLabel,
 *   loginAt, lastActiveAt, device } listesi döndür.
 *
 * Admin SDK: client'a collectionGroup açmak rule+index gerektirir; burada bypass edilir.
 * Hata formatı: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

async function verifySuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch {
    return false;
  }
}

function roleCategory(role: string, managed: boolean): 'super-admin' | 'admin' | 'user' {
  if (role === 'super-admin') return 'super-admin';
  if (managed || ['ngo-admin', 'brand-admin', 'club-admin', 'admin'].includes(role)) return 'admin';
  return 'user';
}
const ROLE_LABEL: Record<string, string> = { 'super-admin': 'Süper Admin', admin: 'Yönetici', user: 'Kullanıcı' };

function toIso(v: unknown): string | null {
  if (!v) return null;
  const o = v as { toDate?: () => Date };
  try { return typeof o.toDate === 'function' ? o.toDate().toISOString() : null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  if (!(await verifySuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const fs = getAdminFirestore();
  try {
    // Son aktiviteye göre sırala; index yoksa sırasız çekip bellek-içinde sırala.
    let docs;
    try {
      const snap = await fs.collectionGroup('sessions').orderBy('lastActiveAt', 'desc').limit(300).get();
      docs = snap.docs;
    } catch {
      const snap = await fs.collectionGroup('sessions').limit(500).get();
      docs = snap.docs.sort((a, b) => {
        const am = (a.data().lastActiveAt as { toMillis?: () => number })?.toMillis?.() ?? 0;
        const bm = (b.data().lastActiveAt as { toMillis?: () => number })?.toMillis?.() ?? 0;
        return bm - am;
      }).slice(0, 300);
    }

    // Oturum başına kullanıcı id'si (parent users/{uid}/sessions/{id} → uid).
    const rows = docs.map(d => {
      const uid = d.ref.parent.parent?.id || '';
      const data = d.data();
      return {
        sessionId: d.id,
        userId: uid,
        loginAt: toIso(data.createdAt),
        lastActiveAt: toIso(data.lastActiveAt),
        deviceName: (data.deviceName as string) || '',
        browserName: (data.browserName as string) || '',
        deviceType: (data.deviceType as string) || '',
      };
    }).filter(r => r.userId);

    // Kullanıcı ad + rolünü topluca çöz.
    const uniqueUids = Array.from(new Set(rows.map(r => r.userId)));
    const userMap = new Map<string, { name: string; role: 'super-admin' | 'admin' | 'user' }>();
    if (uniqueUids.length > 0) {
      const refs = uniqueUids.map(uid => fs.collection(COLLECTIONS.users).doc(uid));
      const snaps = await fs.getAll(...refs);
      for (const s of snaps) {
        const u = s.data() || {};
        const managed = !!(u.managedNgoId || u.managedBrandId || u.managedClubId);
        userMap.set(s.id, {
          name: (u.name as string) || (u.displayName as string) || (u.email as string) || 'Kullanıcı',
          role: roleCategory((u.role as string) || '', managed),
        });
      }
    }

    const items = rows.map(r => {
      const u = userMap.get(r.userId);
      const role = u?.role || 'user';
      return { ...r, userName: u?.name || 'Kullanıcı', role, roleLabel: ROLE_LABEL[role] };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error('admin/sessions error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Oturumlar okunamadı.' }, { status: 500 });
  }
}
