/**
 * GET /api/ngo-admin/call-sessions
 *
 * STK admin'i kendi tenant'ı (ngoId) altındaki çağrı oturumlarını listeler.
 * Recording URL bu yanıta DAHİL — STK kendi kayıtlarını dinleyebilir.
 *
 * KVKK: STK = Veri Sorumlusu olduğu için kendi kayıtlarına erişim hakkı vardır.
 * Super-admin bu URL'i göremez; super-admin yalnızca metadata-only endpoint
 * üzerinden listeler (recording byte log'lanmaz, sadece metadata).
 *
 * Query:
 *   - cursor: son okunan callSession doc id (opsiyonel)
 *   - limit:  1-200 (default 50)
 *   - status: 'ringing' | 'in-progress' | 'completed' | 'failed' (opsiyonel)
 *
 * Yanıt: { rows, nextCursor }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

interface CallSessionRow {
  id: string;
  agentUid?: string;
  ngoId?: string;
  contactId?: string;
  calledNumber?: string;
  callerNumber?: string;
  startedAt?: FirebaseFirestore.Timestamp | null;
  endedAt?: FirebaseFirestore.Timestamp | null;
  duration?: number;
  outcome?: string;
  recordingStorageUrl?: string | null;
  status?: string;
  direction?: 'inbound' | 'outbound';
  notes?: string;
}

interface NgoCaller {
  uid: string;
  ngoId: string;
  role?: string;
}

async function authorize(req: NextRequest): Promise<NgoCaller | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    // Aktif kurum: üst switcher x-org-id header'ıyla gelir (çoklu kurum yöneten
    // kullanıcı için kritik). Caller onu yönetiyorsa (managedNgoId==header) ya da
    // super-admin ise header'daki STK kullanılır; yoksa managedNgoId'ye düşer.
    const __hdrId = (req.headers.get('x-org-id') || '').trim();
    const __hdrKind = (req.headers.get('x-org-kind') || '').trim().toLowerCase();
    const __activeNgoId = (__hdrId && __hdrKind === 'ngo' && (d.role === 'super-admin' || d.managedNgoId === __hdrId))
      ? __hdrId
      : (d.managedNgoId || '');
    if (!__activeNgoId) return null;
    return { uid: decoded.uid, ngoId: __activeNgoId, role: d.role };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limitNum = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)),
  );
  const cursor = searchParams.get('cursor') || null;
  const status = searchParams.get('status') || null;

  const db = getAdminFirestore();
  let q: FirebaseFirestore.Query = db
    .collection(CALL_SESSIONS)
    .where('ngoId', '==', ctx.ngoId)
    .orderBy('startedAt', 'desc');

  if (status) q = q.where('status', '==', status);

  if (cursor) {
    const cursorDoc = await db.collection(CALL_SESSIONS).doc(cursor).get();
    if (!cursorDoc.exists) {
      return NextResponse.json(
        { errorCode: 'CURSOR_INVALID', message: 'Pagination süresi doldu, baştan başla' },
        { status: 410 },
      );
    }
    q = q.startAfter(cursorDoc);
  }

  q = q.limit(limitNum);
  const snap = await q.get();

  const rows: CallSessionRow[] = snap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      id: doc.id,
      agentUid: data.agentUid as string | undefined,
      ngoId: data.ngoId as string | undefined,
      contactId: data.contactId as string | undefined,
      calledNumber: data.calledNumber as string | undefined,
      callerNumber: data.callerNumber as string | undefined,
      startedAt: (data.startedAt as FirebaseFirestore.Timestamp | null | undefined) ?? null,
      endedAt: (data.endedAt as FirebaseFirestore.Timestamp | null | undefined) ?? null,
      duration: typeof data.duration === 'number' ? data.duration : undefined,
      outcome: data.outcome as string | undefined,
      // STK kendi tenant'ı için recording URL'i alır.
      recordingStorageUrl: (data.recordingStorageUrl as string | null | undefined) ?? null,
      status: data.status as string | undefined,
      direction: (data.direction as 'inbound' | 'outbound' | undefined) ?? undefined,
      notes: data.notes as string | undefined,
    };
  });

  const nextCursor = rows.length === limitNum ? rows[rows.length - 1].id : null;

  return NextResponse.json({ rows, nextCursor });
}
