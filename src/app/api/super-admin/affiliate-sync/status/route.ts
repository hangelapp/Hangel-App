/**
 * GET /api/super-admin/affiliate-sync/status — Son senkron raporu + geçmiş.
 *
 * Super-admin panelinde "son çalışma" özetini ve son 10 çalışmanın listesini
 * gösterir. system/affiliateSyncReport (son durum) + affiliateSyncRuns (geçmiş,
 * tarih id'li) okunur. Cloud Function VEYA App Hosting cron/manuel çalışma —
 * ikisi de aynı doc'lara yazdığı için kaynağı fark etmez.
 *
 * Auth: super-admin (token.role VEYA users doc VEYA superAdminPermissions).
 * Başarısız → 403. Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Panel (src/app/super-admin/affiliate-sync/page.tsx) StatusResp'i ile birebir aynı
// sözleşme — istemci düz alanlar (runAt/totals/recentRuns) okur.
interface StatusResp {
  runAt: number | null;
  totals: {
    scanned: number;
    listable: number;
    excluded: number;
    byNetwork: Array<{ network: string; agency: string; scanned: number; listable: number }>;
  } | null;
  recentRuns: Array<{
    id: string;
    runAt: number | null;
    listable: number;
    newlyListed: number;
    removed: number;
  }>;
}

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

// Firestore Timestamp | number | undefined → epoch ms | null.
function toMillis(v: unknown): number | null {
  if (v && typeof v === 'object' && typeof (v as { toMillis?: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis();
  }
  return typeof v === 'number' ? v : null;
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  try {
    const db = getAdminFirestore();

    const [reportSnap, runsSnap] = await Promise.all([
      db.doc('system/affiliateSyncReport').get(),
      // Doc id'leri tarih (YYYY-MM-DD) → __name__ desc en yeni 10 çalışmayı verir.
      db.collection('affiliateSyncRuns').orderBy('__name__', 'desc').limit(10).get(),
    ]);

    // Panel StatusResp'i DÜZ bekler: { runAt, totals, recentRuns[] }. Son rapor
    // (system/affiliateSyncReport) alanlarını üst seviyeye açıyoruz; recentRuns
    // her satır { id, runAt, listable, newlyListed, removed } şeklinde.
    const report = reportSnap.exists
      ? (reportSnap.data() as {
          runAt?: unknown;
          totals?: StatusResp['totals'];
        })
      : null;

    const recentRuns = runsSnap.docs.map((d) => {
      const data = d.data() as {
        runAt?: unknown;
        totals?: { listable?: number };
        newlyListed?: unknown[];
        removedFromList?: unknown[];
      };
      return {
        id: d.id,
        runAt: toMillis(data.runAt),
        listable: data.totals?.listable ?? 0,
        newlyListed: Array.isArray(data.newlyListed) ? data.newlyListed.length : 0,
        removed: Array.isArray(data.removedFromList) ? data.removedFromList.length : 0,
      };
    });

    const body: StatusResp = {
      runAt: report ? toMillis(report.runAt) : null,
      totals: report?.totals ?? null,
      recentRuns,
    };

    return NextResponse.json(body);
  } catch (e) {
    console.error('[affiliate-sync/status] okuma hatası', e);
    return NextResponse.json(
      { errorCode: 'STATUS_FAILED', message: 'Senkron durumu okunamadı.' },
      { status: 500 }
    );
  }
}
