/**
 * GET /api/super-admin/call-sessions/[id]
 *
 * Tek bir çağrı oturumunun metadata'sını döner.
 *
 * KVKK KRİTİK:
 *   - recordingStorageUrl response'a EKLENMEZ. Sadece recordingExists boolean.
 *   - PATCH endpoint'i YOKTUR — super-admin sadece okur, oturumu mutate etmez.
 *
 * Audit:
 *   Her okuma callAuditLog'a 'call-sessions:read' olarak kaydedilir.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CALL_SESSIONS = 'callSessions';
const CALL_AUDIT_LOG = 'callAuditLog';

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

function maskPhone(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length <= 4) return trimmed;
  const last4 = trimmed.slice(-4);
  const prefixLen = trimmed.length - 4;
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await isSuperAdmin(req);
  if (!auth.ok || !auth.uid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'id zorunlu' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const snap = await db.collection(CALL_SESSIONS).doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Çağrı oturumu bulunamadı' }, { status: 404 });
  }
  const data = snap.data() || {};

  // KVKK: recordingStorageUrl response'a EKLENMEZ.
  const session = {
    id: snap.id,
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
    recordingExists: typeof data.recordingStorageUrl === 'string' && data.recordingStorageUrl.length > 0,
  };

  // Audit log — KVKK gereği her metadata erişimi loglanır.
  try {
    await db.collection(CALL_AUDIT_LOG).add({
      actorUid: auth.uid,
      action: 'call-sessions:read',
      resourceType: 'callSessions',
      resourceId: id,
      timestamp: FieldValue.serverTimestamp(),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      details: {
        ngoId: session.ngoId || null,
        agentUid: session.agentUid || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    });
  } catch {
    // sessiz geç — audit yazılamadıysa okuma engellemez
  }

  return NextResponse.json({ session });
}
