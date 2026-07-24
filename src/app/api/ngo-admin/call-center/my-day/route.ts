/**
 * GET /api/ngo-admin/call-center/my-day
 *
 * "Bugünkü işim" — temsilcinin bugün yapması gerekenleri tek yerde toplar
 * (mevcut verilerden türetilir, yeni yazma yok):
 *   - callbacks : bugün/geçmiş zamanı gelmiş, bekleyen geri aramalar
 *   - missed    : cevapsız gelen çağrılar (henüz görülmemiş)
 *   - fresh     : hiç aranmamış (lastDisposition yok) yeni kişiler (en yeni 20)
 *
 * Yanıt: { callbacks:[...], missed:[...], fresh:[...], counts:{...} }
 * KVKK: yalnız caller'ın kendi tenant'ı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const MISSED_DISPOSITIONS = new Set(['no-answer', 'busy', 'voicemail', 'callback-requested']);
const FRESH_LIMIT = 20;

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
    const isSuperAdmin = d.role === 'super-admin';
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu kurum
    // yöneten kullanıcı için kritik). Caller o kuruma üyeyse (managedNgoId/
    // managedBrandId/managedClubId==header) ya da super-admin ise header'daki kurum
    // kullanılır; yoksa managedNgoId → managedBrandId → managedClubId ilk dolu olana düşer.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = req.headers.get('x-org-id') || undefined;
    let activeOrgId: string;
    if (hdrOrgId && hdrKind) {
      const isMember = isSuperAdmin
        || (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId)
        || (hdrKind === 'brand' && d.managedBrandId === hdrOrgId)
        || (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isMember) return null;
      activeOrgId = hdrOrgId;
    } else {
      activeOrgId = d.managedNgoId || d.managedBrandId || d.managedClubId || '';
    }
    if (!activeOrgId) return null;
    return { uid: decoded.uid, ngoId: activeOrgId };
  } catch {
    return null;
  }
}

function tsToIso(v: unknown): string | null {
  const d = (v as { toDate?: () => Date } | undefined)?.toDate?.();
  return d ? d.toISOString() : null;
}
function tsToMs(v: unknown): number | null {
  const d = (v as { toDate?: () => Date } | undefined)?.toDate?.();
  return d ? d.getTime() : null;
}

interface Task {
  contactId: string | null;
  contactName: string | null;
  number: string | null;
  at: string | null;
  reason?: string | null;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const db = getAdminFirestore();
  const nowMs = Date.now();

  const [cbSnap, csSnap, freshSnap] = await Promise.all([
    // Geri aramalar — bekleyen, zamanı gelmiş.
    db.collection(COLLECTIONS.santralScheduledCallbacks)
      .where('ngoId', '==', ctx.ngoId).where('status', '==', 'pending')
      .orderBy('scheduledAt', 'asc').limit(100).get().catch(() => null),
    // Cevapsız gelen çağrılar — son 150.
    db.collection(CALL_SESSIONS)
      .where('ngoId', '==', ctx.ngoId)
      .orderBy('createdAt', 'desc').limit(150).get().catch(() => null),
    // Yeni kişiler — hiç aranmamış (lastDisposition alanı hiç yazılmamış).
    db.collection(COLLECTIONS.santralContacts)
      .where('ngoId', '==', ctx.ngoId)
      .orderBy('createdAt', 'desc').limit(200).get().catch(() => null),
  ]);

  const callbacks: Task[] = [];
  if (cbSnap) for (const doc of cbSnap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const ms = tsToMs(d.scheduledAt);
    if (ms === null || ms > nowMs) continue;
    callbacks.push({
      contactId: typeof d.contactId === 'string' ? d.contactId : null,
      contactName: typeof d.contactName === 'string' ? d.contactName : null,
      number: null,
      at: tsToIso(d.scheduledAt),
      reason: typeof d.reason === 'string' ? d.reason : null,
    });
  }

  const missed: Task[] = [];
  if (csSnap) for (const doc of csSnap.docs) {
    const d = doc.data() as Record<string, unknown>;
    if (d.direction !== 'inbound' || d.missedSeenAt) continue;
    const disp = typeof d.disposition === 'string' ? d.disposition : null;
    const missedByDisp = disp !== null && MISSED_DISPOSITIONS.has(disp);
    const missedByStatus = d.status === 'failed' && !disp;
    if (!missedByDisp && !missedByStatus) continue;
    missed.push({
      contactId: typeof d.contactId === 'string' ? d.contactId : null,
      contactName: typeof d.contactName === 'string' ? d.contactName : null,
      number: typeof d.callerNumber === 'string' ? d.callerNumber : null,
      at: tsToIso(d.startedAt) ?? tsToIso(d.createdAt),
    });
  }

  const fresh: Task[] = [];
  if (freshSnap) for (const doc of freshSnap.docs) {
    if (fresh.length >= FRESH_LIMIT) break;
    const d = doc.data() as Record<string, unknown>;
    if (d.lastDisposition) continue; // en az bir kez aranmış → yeni değil
    fresh.push({
      contactId: doc.id,
      contactName: typeof d.name === 'string' ? d.name : null,
      number: typeof d.phone === 'string' ? d.phone : null,
      at: tsToIso(d.createdAt),
    });
  }

  return NextResponse.json({
    callbacks, missed, fresh,
    counts: { callbacks: callbacks.length, missed: missed.length, fresh: fresh.length },
  });
}
