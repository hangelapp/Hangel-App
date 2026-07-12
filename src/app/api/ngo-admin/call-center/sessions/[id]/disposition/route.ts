/**
 * POST /api/ngo-admin/call-center/sessions/[id]/disposition
 *
 * Agent çağrı sonucunu sınıflar (answered/no-answer/busy/...) ve opsiyonel
 * outcome notu girer. callSessions/{id} doc'u merge edilir ve ilgili
 * santralContacts/{contactId} doc'unda denemesayısı + son durum güncellenir.
 *
 * KVKK: yalnızca STK tenant'ı kendi callSession'ına disposition girebilir;
 * super-admin bile bu metaveri yazımına buradan erişmez.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const SANTRAL_CONTACTS = 'santralContacts';

const ALLOWED_DISPOSITIONS = [
  'answered',
  'no-answer',
  'busy',
  'rejected',
  'voicemail',
  'wrong-number',
  'callback-requested',
] as const;
type Disposition = (typeof ALLOWED_DISPOSITIONS)[number];

interface AgentContext {
  uid: string;
  ngoId: string;
}

async function authorize(req: NextRequest): Promise<AgentContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string };
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

function isDisposition(value: unknown): value is Disposition {
  return typeof value === 'string' && (ALLOWED_DISPOSITIONS as readonly string[]).includes(value);
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

  let body: { disposition?: unknown; outcomeNotes?: unknown; tags?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' }, { status: 400 });
  }

  if (!isDisposition(body.disposition)) {
    return NextResponse.json(
      { errorCode: 'BAD_DISPOSITION', message: 'Geçersiz çağrı sonucu.' },
      { status: 400 },
    );
  }
  const disposition: Disposition = body.disposition;
  const outcomeNotes = typeof body.outcomeNotes === 'string' ? body.outcomeNotes.slice(0, 4000) : null;
  // Çağrı etiketleri (bağış sözü / şikayet / bilgi …) — serbest ama sınırlı.
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim().slice(0, 40)).slice(0, 10)
    : [];

  const db = getAdminFirestore();
  const sessionRef = db.collection(CALL_SESSIONS).doc(id);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    return NextResponse.json({ errorCode: 'SESSION_NOT_FOUND', message: 'Çağrı oturumu bulunamadı.' }, { status: 404 });
  }
  const sessionData = sessionSnap.data() as { ngoId?: string; contactId?: string };
  if (sessionData.ngoId !== ctx.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu çağrı oturumuna erişim yetkiniz yok.' },
      { status: 403 },
    );
  }

  const batch = db.batch();
  batch.set(
    sessionRef,
    {
      disposition,
      outcomeNotes,
      tags,
      dispositionAt: FieldValue.serverTimestamp(),
      dispositionBy: ctx.uid,
    },
    { merge: true },
  );

  if (sessionData.contactId) {
    const contactRef = db.collection(SANTRAL_CONTACTS).doc(sessionData.contactId);
    batch.set(
      contactRef,
      {
        lastDisposition: disposition,
        lastAttemptAt: FieldValue.serverTimestamp(),
        attempts: FieldValue.increment(1),
      },
      { merge: true },
    );
  }

  await batch.commit();

  return NextResponse.json({ ok: true });
}
