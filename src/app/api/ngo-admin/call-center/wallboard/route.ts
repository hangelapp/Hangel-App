/**
 * GET /api/ngo-admin/call-center/wallboard
 *
 * Süpervizör panosu (wallboard) — yöneticiye BUGÜNÜN canlı özeti. Mevcut
 * verilerden türetilir (yeni yazma yok); UI 15-20 sn'de bir yeniler.
 *   - todayTotal    : bugün sonuç girilen çağrı
 *   - todayAnswered : bugün görüşülen
 *   - answerRate    : oran
 *   - pendingCallbacks : zamanı gelmiş bekleyen geri arama
 *   - openMissed    : görülmemiş cevapsız gelen çağrı
 *   - activeAgents  : bugün en az bir çağrı işlemiş temsilci sayısı
 *   - byAgent       : bugün temsilci başına çağrı (canlı liderlik tablosu)
 *
 * KVKK: yalnız caller'ın kendi tenant'ı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const MISSED_DISPOSITIONS = new Set(['no-answer', 'busy', 'voicemail', 'callback-requested']);

interface Ctx { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<Ctx | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    const isSuper = d.role === 'super-admin';
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu
    // kurum yöneten kullanıcı için kritik). Caller o kuruma üyeyse (ilgili
    // managed*Id==header) ya da super-admin ise header'daki kurum kullanılır;
    // header yoksa eski davranış: managedNgoId → managedBrandId → managedClubId.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = (req.headers.get('x-org-id') || '').trim() || undefined;
    let __activeNgoId = '';
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isMember && !isSuper) return null;
      __activeNgoId = hdrOrgId;
    } else {
      __activeNgoId = d.managedNgoId || d.managedBrandId || d.managedClubId || '';
    }
    if (!__activeNgoId) return null;
    return { uid: decoded.uid, ngoId: __activeNgoId };
  } catch {
    return null;
  }
}

function tsToMs(v: unknown): number | null {
  const d = (v as { toDate?: () => Date } | undefined)?.toDate?.();
  return d ? d.getTime() : null;
}

/** Bugünün (Europe/Istanbul) 00:00 epoch ms değeri. */
function startOfTodayIstanbulMs(): number {
  const now = new Date();
  // TR ofseti +03:00 (DST yok). UTC gününü +3 kaydırıp gün başını al.
  const shifted = new Date(now.getTime() + 3 * 3600 * 1000);
  const y = shifted.getUTCFullYear(), m = shifted.getUTCMonth(), d = shifted.getUTCDate();
  return Date.UTC(y, m, d, 0, 0, 0) - 3 * 3600 * 1000;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const db = getAdminFirestore();
  const todayStart = startOfTodayIstanbulMs();

  const [csSnap, cbSnap] = await Promise.all([
    // Son 500 oturum — bugünü kodda süz (composite index gerekmesin).
    db.collection(CALL_SESSIONS).where('ngoId', '==', ctx.ngoId)
      .orderBy('createdAt', 'desc').limit(500).get().catch(() => null),
    db.collection(COLLECTIONS.santralScheduledCallbacks)
      .where('ngoId', '==', ctx.ngoId).where('status', '==', 'pending')
      .limit(200).get().catch(() => null),
  ]);

  let todayTotal = 0, todayAnswered = 0, openMissed = 0;
  const agentCounts = new Map<string, number>();
  const agentNames = new Map<string, string>();

  if (csSnap) for (const doc of csSnap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const createdMs = tsToMs(d.createdAt);
    const dispMs = tsToMs(d.dispositionAt);
    const disp = typeof d.disposition === 'string' ? d.disposition : null;

    // Bugünkü sonuç girilen çağrılar
    if (dispMs !== null && dispMs >= todayStart) {
      todayTotal += 1;
      if (disp === 'answered') todayAnswered += 1;
      const agent = typeof d.dispositionBy === 'string' ? d.dispositionBy : '';
      if (agent) agentCounts.set(agent, (agentCounts.get(agent) || 0) + 1);
    }
    // Açık cevapsızlar (bugün sınırı yok — bekleyen iş)
    if (d.direction === 'inbound' && !d.missedSeenAt) {
      const missedByDisp = disp !== null && MISSED_DISPOSITIONS.has(disp);
      const missedByStatus = d.status === 'failed' && !disp;
      if ((missedByDisp || missedByStatus) && createdMs !== null) openMissed += 1;
    }
  }

  const nowMs = Date.now();
  let pendingCallbacks = 0;
  if (cbSnap) for (const doc of cbSnap.docs) {
    const ms = tsToMs((doc.data() as { scheduledAt?: unknown }).scheduledAt);
    if (ms !== null && ms <= nowMs) pendingCallbacks += 1;
  }

  // Temsilci isimlerini çöz.
  await Promise.all([...agentCounts.keys()].map(async (uid) => {
    const u = await db.collection(COLLECTIONS.users).doc(uid).get().catch(() => null);
    const dn = u?.data() as { displayName?: string; name?: string; email?: string } | undefined;
    agentNames.set(uid, dn?.displayName || dn?.name || dn?.email || 'Temsilci');
  }));

  const byAgent = [...agentCounts.entries()]
    .map(([uid, count]) => ({ uid, name: agentNames.get(uid) || 'Temsilci', count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    todayTotal,
    todayAnswered,
    answerRate: todayTotal ? todayAnswered / todayTotal : 0,
    pendingCallbacks,
    openMissed,
    activeAgents: agentCounts.size,
    byAgent,
  });
}
