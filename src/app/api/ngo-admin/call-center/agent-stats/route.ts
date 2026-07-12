/**
 * GET /api/ngo-admin/call-center/agent-stats?days=7
 *
 * Temsilci performans özeti. callSessions'tan (son N gün) temsilci
 * (dispositionBy) başına toplar:
 *   - total       : sonuç girilen çağrı sayısı
 *   - answered    : 'answered' sonuçlu
 *   - callbacks   : 'callback-requested'
 *   - avgDuration : cevaplanan çağrıların ort. süresi (sn)
 *   - answerRate  : answered / total (0..1)
 * Ayrıca STK geneli özet (totals) döner.
 *
 * İsimler users/{uid}.displayName'den çözülür.
 * KVKK: yalnız caller'ın kendi tenant'ı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';

interface Ctx { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<Ctx | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId };
  } catch {
    return null;
  }
}

interface Acc {
  total: number;
  answered: number;
  callbacks: number;
  durationSum: number; // cevaplanan çağrıların süre toplamı
  durationCount: number;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const daysRaw = parseInt(new URL(req.url).searchParams.get('days') || '7', 10);
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 90) : 7;
  const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;

  const db = getAdminFirestore();
  // Sonuç girilmiş oturumlar (dispositionAt) — en yeni 1000, kodda tarih süz.
  const snap = await db.collection(CALL_SESSIONS)
    .where('ngoId', '==', ctx.ngoId)
    .orderBy('dispositionAt', 'desc')
    .limit(1000)
    .get()
    .catch(() => null);

  const byAgent = new Map<string, Acc>();
  const totals: Acc = { total: 0, answered: 0, callbacks: 0, durationSum: 0, durationCount: 0 };

  if (snap) {
    for (const doc of snap.docs) {
      const d = doc.data() as Record<string, unknown>;
      const at = (d.dispositionAt as { toDate?: () => Date } | undefined)?.toDate?.();
      if (at && at.getTime() < sinceMs) continue;
      const agent = typeof d.dispositionBy === 'string' ? d.dispositionBy : '';
      if (!agent) continue;
      const disp = typeof d.disposition === 'string' ? d.disposition : '';
      const dur = typeof d.duration === 'number' && d.duration >= 0 ? d.duration : 0;

      const acc = byAgent.get(agent) ?? { total: 0, answered: 0, callbacks: 0, durationSum: 0, durationCount: 0 };
      acc.total += 1; totals.total += 1;
      if (disp === 'answered') {
        acc.answered += 1; totals.answered += 1;
        if (dur > 0) { acc.durationSum += dur; acc.durationCount += 1; totals.durationSum += dur; totals.durationCount += 1; }
      }
      if (disp === 'callback-requested') { acc.callbacks += 1; totals.callbacks += 1; }
      byAgent.set(agent, acc);
    }
  }

  // Temsilci isimlerini çöz.
  const uids = [...byAgent.keys()];
  const names = new Map<string, string>();
  await Promise.all(uids.map(async (uid) => {
    const u = await db.collection(COLLECTIONS.users).doc(uid).get().catch(() => null);
    const dn = u?.data() as { displayName?: string; email?: string } | undefined;
    names.set(uid, dn?.displayName || dn?.email || 'Temsilci');
  }));

  const agents = uids.map((uid) => {
    const a = byAgent.get(uid)!;
    return {
      uid,
      name: names.get(uid) || 'Temsilci',
      total: a.total,
      answered: a.answered,
      callbacks: a.callbacks,
      avgDuration: a.durationCount ? Math.round(a.durationSum / a.durationCount) : 0,
      answerRate: a.total ? a.answered / a.total : 0,
    };
  }).sort((x, y) => y.total - x.total);

  return NextResponse.json({
    days,
    agents,
    totals: {
      total: totals.total,
      answered: totals.answered,
      callbacks: totals.callbacks,
      avgDuration: totals.durationCount ? Math.round(totals.durationSum / totals.durationCount) : 0,
      answerRate: totals.total ? totals.answered / totals.total : 0,
    },
  });
}
