/**
 * /api/ngo-admin/call-center/sessions/[id]/notes
 *
 * Agent'ın çağrı sırasında / sonrasında girdiği serbest metin notları.
 * KVKK: not metni STK tenant'ına aittir, super-admin erişmez; recording
 * byte burada tutulmaz.
 *
 * POST { text }            → callSessions/{id}/notes/{auto-id} ekler
 * GET                      → notes alt koleksiyonunu timestamp DESC döner
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const NOTES_SUBCOLLECTION = 'notes';
const MAX_NOTE_LEN = 4000;

interface AgentContext {
  uid: string;
  ngoId: string;
  displayName: string;
}

async function authorize(req: NextRequest): Promise<AgentContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; displayName?: string; name?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return {
      uid: decoded.uid,
      ngoId: d.managedNgoId,
      displayName: d.displayName ?? d.name ?? '',
    };
  } catch {
    return null;
  }
}

async function loadSessionTenant(sessionId: string): Promise<{ ngoId: string } | null> {
  const snap = await getAdminFirestore().collection(CALL_SESSIONS).doc(sessionId).get();
  if (!snap.exists) return null;
  const d = snap.data() as { ngoId?: string };
  if (!d?.ngoId) return null;
  return { ngoId: d.ngoId };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Oturum kimliği eksik.' }, { status: 400 });
  }

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Not metni boş olamaz.' }, { status: 400 });
  }
  if (text.length > MAX_NOTE_LEN) {
    return NextResponse.json(
      { errorCode: 'TOO_LONG', message: `Not en fazla ${MAX_NOTE_LEN} karakter olabilir.` },
      { status: 400 },
    );
  }

  const session = await loadSessionTenant(id);
  if (!session) {
    return NextResponse.json({ errorCode: 'SESSION_NOT_FOUND', message: 'Çağrı oturumu bulunamadı.' }, { status: 404 });
  }
  if (session.ngoId !== ctx.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu çağrı oturumuna erişim yetkiniz yok.' }, { status: 403 });
  }

  const db = getAdminFirestore();
  const noteRef = db.collection(CALL_SESSIONS).doc(id).collection(NOTES_SUBCOLLECTION).doc();
  await noteRef.set({
    agentUid: ctx.uid,
    agentName: ctx.displayName,
    text,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: noteRef.id });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Oturum kimliği eksik.' }, { status: 400 });
  }

  const session = await loadSessionTenant(id);
  if (!session) {
    return NextResponse.json({ errorCode: 'SESSION_NOT_FOUND', message: 'Çağrı oturumu bulunamadı.' }, { status: 404 });
  }
  if (session.ngoId !== ctx.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu çağrı oturumuna erişim yetkiniz yok.' }, { status: 403 });
  }

  const db = getAdminFirestore();
  const snap = await db
    .collection(CALL_SESSIONS)
    .doc(id)
    .collection(NOTES_SUBCOLLECTION)
    .orderBy('timestamp', 'desc')
    .get();

  const notes = snap.docs.map((doc) => {
    const data = doc.data() as {
      agentUid?: string;
      agentName?: string;
      text?: string;
      timestamp?: { toMillis?: () => number };
    };
    return {
      id: doc.id,
      agentUid: data.agentUid ?? null,
      agentName: data.agentName ?? null,
      text: data.text ?? '',
      timestamp: data.timestamp?.toMillis?.() ?? null,
    };
  });

  return NextResponse.json({ notes });
}
