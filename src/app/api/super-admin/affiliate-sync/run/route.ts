/**
 * POST /api/super-admin/affiliate-sync/run — Affiliate onay senkronunu ELLE tetikle.
 *
 * Super-admin panelindeki "Şimdi Çalıştır" butonu buna bağlanır. Cloud Function'a
 * (affiliateApprovalSync) bağımlı DEĞİLDİR — App Hosting üzerinde runAffiliateSync
 * çalıştırır ve SyncSummary döner. Manuel tetikleme olduğu için super-admin'lere
 * bildirim DÜŞMEZ (notifySuperAdmins: false).
 *
 * Auth: super-admin (token.role === 'super-admin' VEYA users/{uid}.role === 'super-admin'
 * VEYA superAdminPermissions). Başarısız → 403. Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { runAffiliateSync } from '@/lib/affiliate-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 3 ağ taraması uzun sürebilir.

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as {
      uid: string;
      role?: string;
      superAdminPermissions?: unknown;
    };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  try {
    const summary = await runAffiliateSync(getAdminFirestore(), { notifySuperAdmins: false });
    // Panel `body.ok` bekler + son çalışma etiketini runAt'tan okur. runAffiliateSync
    // JSON-serileştirilebilir özet döner (serverTimestamp içermez) → burada
    // istemcinin göstereceği epoch damgayı ekliyoruz.
    return NextResponse.json({ ok: true, runAt: Date.now(), ...summary });
  } catch (e) {
    console.error('[affiliate-sync/run] senkron hatası', e);
    return NextResponse.json(
      { errorCode: 'SYNC_FAILED', message: 'Affiliate senkronu çalıştırılamadı.' },
      { status: 500 }
    );
  }
}
