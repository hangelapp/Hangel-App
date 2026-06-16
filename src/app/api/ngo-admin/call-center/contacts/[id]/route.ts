/**
 * GET / PATCH /api/ngo-admin/call-center/contacts/[id]
 *
 * GET: santralContacts doc detayı + geçmiş callSessions (ngoId+contactId).
 * PATCH: name, phone (E.164 normalize), email, customFields güncellenir.
 *
 * Auth: ngo-admin (veya super-admin) — yalnızca kendi `managedNgoId`'sine ait
 * doc'a erişim. Cross-tenant erişim 403.
 *
 * KVKK: salt metadata; recording byte / URL bu route'ta dönmez.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const SESSIONS_HISTORY_LIMIT = 50;

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface PatchBody {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  customFields?: unknown;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
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

function normalizePhone(raw: string): string | null {
  // E.164 normalize: TR varsayılan +90; başında 0 varsa kırp, +90 ekle.
  const stripped = raw.replace(/[\s\-()]/g, '');
  if (!stripped) return null;
  if (stripped.startsWith('+')) {
    return /^\+[0-9]{10,15}$/.test(stripped) ? stripped : null;
  }
  // 0XXXXXXXXXX → +90XXXXXXXXXX
  if (stripped.startsWith('0') && /^0[0-9]{10}$/.test(stripped)) {
    return `+90${stripped.slice(1)}`;
  }
  // 5XXXXXXXXX (10 hane) → +90 ekle
  if (/^[1-9][0-9]{9}$/.test(stripped)) {
    return `+90${stripped}`;
  }
  // 90XXXXXXXXXX → +90...
  if (/^90[0-9]{10}$/.test(stripped)) {
    return `+${stripped}`;
  }
  if (/^[0-9]{10,15}$/.test(stripped)) {
    return `+${stripped}`;
  }
  return null;
}

function tsToIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await authorize(req);
  if (!auth) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Kişi id zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const contactRef = db.collection(COLLECTIONS.santralContacts).doc(id);
  const contactSnap = await contactRef.get();
  if (!contactSnap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kişi bulunamadı.' }, { status: 404 });
  }
  const data = contactSnap.data() as Record<string, unknown>;
  if (data.ngoId !== auth.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu kişiye erişim yetkiniz yok.' }, { status: 403 });
  }

  // Geçmiş aramalar — ngoId+contactId, en yeni 50 oturum.
  const sessionsSnap = await db
    .collection(CALL_SESSIONS)
    .where('ngoId', '==', auth.ngoId)
    .where('contactId', '==', id)
    .orderBy('startedAt', 'desc')
    .limit(SESSIONS_HISTORY_LIMIT)
    .get();

  const sessions = sessionsSnap.docs.map((d) => {
    const s = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      agentUid: typeof s.agentUid === 'string' ? s.agentUid : null,
      calledNumber: typeof s.calledNumber === 'string' ? s.calledNumber : null,
      callerNumber: typeof s.callerNumber === 'string' ? s.callerNumber : null,
      direction: typeof s.direction === 'string' ? s.direction : 'outbound',
      status: typeof s.status === 'string' ? s.status : null,
      outcome: typeof s.outcome === 'string' ? s.outcome : null,
      duration: typeof s.duration === 'number' ? s.duration : 0,
      startedAt: tsToIso(s.startedAt),
      endedAt: tsToIso(s.endedAt),
    };
  });

  const customFields =
    data.customFields && typeof data.customFields === 'object' && !Array.isArray(data.customFields)
      ? (data.customFields as Record<string, unknown>)
      : {};

  return NextResponse.json({
    contact: {
      id: contactSnap.id,
      name: typeof data.name === 'string' ? data.name : '',
      phone: typeof data.phone === 'string' ? data.phone : '',
      email: typeof data.email === 'string' ? data.email : null,
      listIds: Array.isArray(data.listIds) ? (data.listIds as unknown[]).filter((s): s is string => typeof s === 'string') : [],
      attempts: typeof data.attempts === 'number' ? data.attempts : 0,
      lastAttemptAt: tsToIso(data.lastAttemptAt),
      lastDisposition: typeof data.lastDisposition === 'string' ? data.lastDisposition : null,
      customFields,
      createdAt: tsToIso(data.createdAt),
    },
    sessions,
  });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await authorize(req);
  if (!auth) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Kişi id zorunlu.' }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.santralContacts).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kişi bulunamadı.' }, { status: 404 });
  }
  const existing = snap.data() as Record<string, unknown>;
  if (existing.ngoId !== auth.ngoId) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu kişiye erişim yetkiniz yok.' }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.name === 'string') {
    const name = body.name.trim().slice(0, 200);
    if (!name) {
      return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Ad boş olamaz.' }, { status: 400 });
    }
    updates.name = name;
  }

  if (typeof body.phone === 'string') {
    const normalized = normalizePhone(body.phone);
    if (!normalized) {
      return NextResponse.json({ errorCode: 'BAD_PHONE', message: 'Telefon numarası geçersiz (E.164 bekleniyor, ör. +905XXXXXXXXX).' }, { status: 400 });
    }
    updates.phone = normalized;
  }

  if (body.email !== undefined) {
    if (body.email === null || (typeof body.email === 'string' && body.email.trim() === '')) {
      updates.email = null;
    } else if (typeof body.email === 'string') {
      const email = body.email.trim().slice(0, 320);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ errorCode: 'BAD_EMAIL', message: 'E-posta geçersiz.' }, { status: 400 });
      }
      updates.email = email;
    }
  }

  if (body.customFields !== undefined) {
    if (
      body.customFields === null ||
      (typeof body.customFields === 'object' && !Array.isArray(body.customFields))
    ) {
      updates.customFields = body.customFields ?? {};
    } else {
      return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'customFields obje olmalı.' }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ errorCode: 'NO_CHANGES', message: 'Güncellenecek alan yok.' }, { status: 400 });
  }

  updates.updatedAt = FieldValue.serverTimestamp();
  updates.updatedBy = auth.uid;

  await ref.update(updates);

  return NextResponse.json({ ok: true });
}
