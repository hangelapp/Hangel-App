/**
 * GET  /api/ngo-admin/call-center/notifications
 * POST /api/ngo-admin/call-center/notifications  { id, kind } → görüldü/tamam işaretle
 *
 * Panel bildirimleri — santral açık olmasa bile yöneticinin görmesi gereken
 * iki durumu MEVCUT verilerden türetir (ekstra cron/koleksiyon yok):
 *   1) callback → santralScheduledCallbacks: status='pending' ve scheduledAt<=now.
 *   2) missed   → callSessions: cevapsız GELEN çağrı (inbound + no-answer/busy/
 *                 voicemail/callback-requested ya da status='failed'),
 *                 henüz missedSeenAt yok.
 *
 * POST:
 *   { id, kind:'callback'} → santralScheduledCallbacks/{id}.status='completed'
 *   { id, kind:'missed'  } → callSessions/{id}.missedSeenAt=now
 *
 * KVKK: yalnız caller'ın kendi tenant'ı (managedNgoId).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
// Cevapsız sayılan gelen-çağrı sonuçları.
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
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId };
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

interface NotificationItem {
  id: string;
  kind: 'missed' | 'callback';
  contactId: string | null;
  contactName: string | null;
  number: string | null;
  at: string | null;      // missed: çağrı zamanı, callback: planlanan geri arama zamanı
  disposition: string | null;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const db = getAdminFirestore();
  const nowMs = Date.now();
  const items: NotificationItem[] = [];

  // 1) Geri arama zamanı gelmiş planlar (santralScheduledCallbacks).
  const cbSnap = await db.collection(COLLECTIONS.santralScheduledCallbacks)
    .where('ngoId', '==', ctx.ngoId)
    .where('status', '==', 'pending')
    .orderBy('scheduledAt', 'asc')
    .limit(100)
    .get()
    .catch(() => null);
  if (cbSnap) {
    for (const doc of cbSnap.docs) {
      const d = doc.data() as Record<string, unknown>;
      const ms = tsToMs(d.scheduledAt);
      if (ms === null || ms > nowMs) continue; // henüz zamanı gelmemiş
      items.push({
        id: doc.id, kind: 'callback',
        contactId: typeof d.contactId === 'string' ? d.contactId : null,
        contactName: typeof d.contactName === 'string' ? d.contactName : null,
        number: null,
        at: tsToIso(d.scheduledAt),
        disposition: typeof d.reason === 'string' ? d.reason : null,
      });
    }
  }

  // 2) Cevapsız gelen çağrılar (callSessions) — son 200'ü tara, kodda ayıkla.
  const csSnap = await db.collection(CALL_SESSIONS)
    .where('ngoId', '==', ctx.ngoId)
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get()
    .catch(() => null);
  if (csSnap) {
    for (const doc of csSnap.docs) {
      const d = doc.data() as Record<string, unknown>;
      if (d.direction !== 'inbound' || d.missedSeenAt) continue;
      const disposition = typeof d.disposition === 'string' ? d.disposition : null;
      const missedByDisp = disposition !== null && MISSED_DISPOSITIONS.has(disposition);
      const missedByStatus = d.status === 'failed' && !disposition;
      if (!missedByDisp && !missedByStatus) continue;
      items.push({
        id: doc.id, kind: 'missed',
        contactId: typeof d.contactId === 'string' ? d.contactId : null,
        contactName: typeof d.contactName === 'string' ? d.contactName : null,
        number: typeof d.callerNumber === 'string' ? d.callerNumber : null,
        at: tsToIso(d.startedAt) ?? tsToIso(d.createdAt),
        disposition,
      });
    }
  }

  // callback'ler önce (aciliyet), sonra en yeni cevapsızlar.
  items.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'callback' ? -1 : 1;
    return (b.at || '').localeCompare(a.at || '');
  });

  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  let body: { id?: unknown; kind?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const id = typeof body.id === 'string' ? body.id : '';
  const kind = body.kind === 'missed' || body.kind === 'callback' ? body.kind : '';
  if (!id || !kind) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'id ve kind gerekli.' }, { status: 400 });

  const db = getAdminFirestore();
  if (kind === 'callback') {
    const ref = db.collection(COLLECTIONS.santralScheduledCallbacks).doc(id);
    const snap = await ref.get();
    if (!snap.exists || (snap.data() as { ngoId?: string }).ngoId !== ctx.ngoId) {
      return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kayıt bulunamadı.' }, { status: 404 });
    }
    await ref.update({ status: 'completed', completedAt: FieldValue.serverTimestamp(), completedBy: ctx.uid });
  } else {
    const ref = db.collection(CALL_SESSIONS).doc(id);
    const snap = await ref.get();
    if (!snap.exists || (snap.data() as { ngoId?: string }).ngoId !== ctx.ngoId) {
      return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kayıt bulunamadı.' }, { status: 404 });
    }
    await ref.set({ missedSeenAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  return NextResponse.json({ ok: true });
}
