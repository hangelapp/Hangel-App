/**
 * GET /api/super-admin/call-sessions/list
 *
 * hangel iç ekibi (super-admin) için çağrı oturumu listesi.
 *
 * Query params:
 *   - from: ISO date string (startedAt >= from)
 *   - to: ISO date string (startedAt <= to)
 *   - ngoId: STK filtresi
 *   - agentUid: Agent (kullanıcı) filtresi
 *   - status: 'ringing' | 'in-progress' | 'completed' | 'failed' | 'cancelled'
 *   - limit: max 200, default 50
 *
 * KVKK KRİTİK:
 *   recordingStorageUrl response'a EKLENMEZ. Sadece recordingExists boolean
 *   gönderilir. Recording byte/path super-admin gözlerine girmez.
 *
 * Audit:
 *   Her başarılı liste sorgusunda callAuditLog'a 'call-sessions:list' kaydı
 *   atılır (actorUid + filtreler).
 *
 * Response:
 *   {
 *     sessions: CallSessionRow[],
 *     totalCount: number  // dönen sayfa boyutu
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const CALL_SESSIONS = 'callSessions';
const CALL_AUDIT_LOG = 'callAuditLog';

const VALID_STATUSES = ['ringing', 'in-progress', 'completed', 'failed', 'cancelled'] as const;
type CallStatus = typeof VALID_STATUSES[number];

interface CallSessionRow {
  id: string;
  agentUid?: string;
  ngoId?: string;
  contactId?: string;
  calledNumber?: string;     // maskeli (last4)
  callerNumber?: string;     // maskeli (last4)
  startedAt?: string;        // ISO
  endedAt?: string;          // ISO
  duration?: number;         // saniye
  outcome?: string;
  status?: CallStatus | string;
  direction?: 'inbound' | 'outbound' | string;
  notes?: string;
  recordingExists: boolean;  // recordingStorageUrl dolu mu? URL DEĞİL.
}

async function isSuperAdmin(req: NextRequest): Promise<{ ok: boolean; uid?: string }> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return { ok: false };
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) {
      return { ok: true, uid: decoded.uid };
    }
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    const ok = d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
    return { ok, uid: ok ? decoded.uid : undefined };
  } catch { return { ok: false }; }
}

/**
 * Telefon numarasını sadece son 4 hane görünür halde maskeler.
 * "+905551234567" -> "+90*******4567"
 */
function maskPhone(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length <= 4) return trimmed;
  const last4 = trimmed.slice(-4);
  const prefixLen = trimmed.length - 4;
  // İlk 3 karakteri (ülke kodu) koru, ortayı maskele.
  const head = trimmed.startsWith('+') ? trimmed.slice(0, 3) : '';
  const maskedLen = Math.max(0, prefixLen - head.length);
  return `${head}${'*'.repeat(maskedLen)}${last4}`;
}

function toIso(v: unknown): string | undefined {
  if (!v) return undefined;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'object' && v !== null && '_seconds' in (v as Record<string, unknown>)) {
    const seconds = (v as { _seconds: number })._seconds;
    return new Date(seconds * 1000).toISOString();
  }
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  return undefined;
}

function normalize(doc: FirebaseFirestore.QueryDocumentSnapshot): CallSessionRow {
  const data = doc.data();
  return {
    id: doc.id,
    agentUid: typeof data.agentUid === 'string' ? data.agentUid : undefined,
    ngoId: typeof data.ngoId === 'string' ? data.ngoId : undefined,
    contactId: typeof data.contactId === 'string' ? data.contactId : undefined,
    calledNumber: maskPhone(data.calledNumber),
    callerNumber: maskPhone(data.callerNumber),
    startedAt: toIso(data.startedAt),
    endedAt: toIso(data.endedAt),
    duration: typeof data.duration === 'number' ? data.duration : undefined,
    outcome: typeof data.outcome === 'string' ? data.outcome : undefined,
    status: typeof data.status === 'string' ? data.status : undefined,
    direction: typeof data.direction === 'string' ? data.direction : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    // KVKK: URL'i ASLA response'a koyma — sadece varlığını söyle.
    recordingExists: typeof data.recordingStorageUrl === 'string' && data.recordingStorageUrl.length > 0,
  };
}

export async function GET(req: NextRequest) {
  const auth = await isSuperAdmin(req);
  if (!auth.ok || !auth.uid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const ngoId = searchParams.get('ngoId');
  const agentUid = searchParams.get('agentUid');
  const statusParam = searchParams.get('status');
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));

  let status: CallStatus | null = null;
  if (statusParam) {
    if (!VALID_STATUSES.includes(statusParam as CallStatus)) {
      return NextResponse.json({ errorCode: 'BAD_STATUS', message: 'status geçersiz' }, { status: 400 });
    }
    status = statusParam as CallStatus;
  }

  const db = getAdminFirestore();
  let q: FirebaseFirestore.Query = db.collection(CALL_SESSIONS);

  // En seçici filtre önce gelecek — equality'ler.
  if (ngoId) q = q.where('ngoId', '==', ngoId);
  if (agentUid) q = q.where('agentUid', '==', agentUid);
  if (status) q = q.where('status', '==', status);

  // Range filter — Firestore tek field'da range izin verir.
  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      q = q.where('startedAt', '>=', Timestamp.fromDate(fromDate));
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      q = q.where('startedAt', '<=', Timestamp.fromDate(toDate));
    }
  }

  q = q.orderBy('startedAt', 'desc').limit(limitNum);

  let sessions: CallSessionRow[];
  try {
    const snap = await q.get();
    sessions = snap.docs.map(normalize);
  } catch (e) {
    // Composite index missing veya başka Firestore hatası
    return NextResponse.json(
      { errorCode: 'QUERY_FAILED', message: e instanceof Error ? e.message : 'Sorgu hatası' },
      { status: 500 },
    );
  }

  // Audit log — her metadata erişimi loglanır (KVKK gereği).
  try {
    await db.collection(CALL_AUDIT_LOG).add({
      actorUid: auth.uid,
      action: 'call-sessions:list',
      resourceType: 'callSessions',
      resourceId: null,
      timestamp: FieldValue.serverTimestamp(),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      details: {
        filters: { from, to, ngoId, agentUid, status },
        returnedCount: sessions.length,
        userAgent: req.headers.get('user-agent') || null,
      },
    });
  } catch {
    // Audit log hatası listeyi engellemez ama sessiz geçeriz; üretim için
    // burada bir Sentry breadcrumb eklenebilir.
  }

  return NextResponse.json({
    sessions,
    totalCount: sessions.length,
  });
}
