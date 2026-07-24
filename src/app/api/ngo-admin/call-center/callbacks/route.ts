/**
 * /api/ngo-admin/call-center/callbacks
 *
 * STK agent'ı bir kişiyle görüştükten sonra "daha sonra ara" planı kaydedebilir.
 * POST: yeni callback yarat (santralScheduledCallbacks + santralContacts.scheduledCallbackId).
 * GET: kendi STK'sının bekleyen/tamamlanmış callback'lerini listele.
 * DELETE: soft delete (status='cancelled').
 *
 * KVKK: yalnızca metadata (telefon zaten contact doc'unda). Cron worker bu
 * koleksiyonu dakikalık polling ile due olanları queue'ya alır.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_REASON_LEN = 500;
const LIST_LIMIT = 100;

interface CallerContext {
  uid: string;
  ngoId: string;
  role?: string;
}

interface PostBody {
  contactId?: unknown;
  scheduledAt?: unknown;
  reason?: unknown;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;

  const hdrKindRaw = req.headers.get('x-org-kind');
  const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
  const hdrOrgId = req.headers.get('x-org-id') || undefined;

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as {
      role?: string;
      managedNgoId?: string;
      managedBrandId?: string;
      managedClubId?: string;
    };
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;

    const isSuperAdmin = d.role === 'super-admin';

    let resolvedOrgId: string | undefined;
    if (hdrOrgId && hdrKind) {
      // Aktif kurum header'dan geldi: caller'ın üyeliğini doğrula (super-admin hariç).
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isMember && !isSuperAdmin) return null;
      resolvedOrgId = hdrOrgId;
    } else {
      // Eski davranış: ilk dolu olan managed id.
      resolvedOrgId = d.managedNgoId || d.managedBrandId || d.managedClubId;
    }

    if (!resolvedOrgId) return null;
    return { uid: decoded.uid, ngoId: resolvedOrgId, role: d.role };
  } catch {
    return null;
  }
}

function parseIsoDate(value: string): Date | null {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' }, { status: 400 });
  }

  const contactId = typeof body.contactId === 'string' ? body.contactId.trim() : '';
  const scheduledAtRaw = typeof body.scheduledAt === 'string' ? body.scheduledAt.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, MAX_REASON_LEN).trim() : '';

  if (!contactId) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'contactId zorunlu.' }, { status: 400 });
  }
  if (!scheduledAtRaw) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'scheduledAt zorunlu.' }, { status: 400 });
  }
  const scheduledDate = parseIsoDate(scheduledAtRaw);
  if (!scheduledDate) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'scheduledAt geçerli bir ISO 8601 tarihi olmalı.' },
      { status: 400 },
    );
  }

  const db = getAdminFirestore();
  const contactRef = db.collection(COLLECTIONS.santralContacts).doc(contactId);
  const contactSnap = await contactRef.get();
  if (!contactSnap.exists) {
    return NextResponse.json({ errorCode: 'CONTACT_NOT_FOUND', message: 'Kişi bulunamadı.' }, { status: 404 });
  }
  const contactData = contactSnap.data() as { ngoId?: string; name?: string };
  if (contactData.ngoId !== ctx.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu kişi başka bir STK\'ya ait.' },
      { status: 403 },
    );
  }

  const callbackRef = db.collection(COLLECTIONS.santralScheduledCallbacks).doc();
  const batch = db.batch();
  batch.set(callbackRef, {
    ngoId: ctx.ngoId,
    contactId,
    contactName: contactData.name ?? null,
    scheduledAt: Timestamp.fromDate(scheduledDate),
    reason: reason || null,
    createdBy: ctx.uid,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(contactRef, { scheduledCallbackId: callbackRef.id });
  await batch.commit();

  return NextResponse.json({ id: callbackRef.id });
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const url = new URL(req.url);
  const statusFilter = (url.searchParams.get('status') || '').trim();
  const fromRaw = (url.searchParams.get('from') || '').trim();
  const toRaw = (url.searchParams.get('to') || '').trim();

  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.santralScheduledCallbacks)
    .where('ngoId', '==', ctx.ngoId);

  if (statusFilter) {
    query = query.where('status', '==', statusFilter);
  }
  if (fromRaw) {
    const fromDate = parseIsoDate(fromRaw);
    if (!fromDate) {
      return NextResponse.json(
        { errorCode: 'BAD_INPUT', message: 'from geçerli bir ISO 8601 tarihi olmalı.' },
        { status: 400 },
      );
    }
    query = query.where('scheduledAt', '>=', Timestamp.fromDate(fromDate));
  }
  if (toRaw) {
    const toDate = parseIsoDate(toRaw);
    if (!toDate) {
      return NextResponse.json(
        { errorCode: 'BAD_INPUT', message: 'to geçerli bir ISO 8601 tarihi olmalı.' },
        { status: 400 },
      );
    }
    query = query.where('scheduledAt', '<=', Timestamp.fromDate(toDate));
  }

  const snap = await query.orderBy('scheduledAt', 'asc').limit(LIST_LIMIT).get();
  const callbacks = snap.docs.map((doc) => {
    const d = doc.data() as {
      contactId?: string;
      contactName?: string | null;
      scheduledAt?: Timestamp;
      reason?: string | null;
      status?: string;
      createdAt?: Timestamp;
    };
    return {
      id: doc.id,
      contactId: d.contactId ?? null,
      contactName: d.contactName ?? null,
      scheduledAt: d.scheduledAt ? d.scheduledAt.toDate().toISOString() : null,
      reason: d.reason ?? null,
      status: d.status ?? 'pending',
      createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
    };
  });

  return NextResponse.json({ callbacks });
}

export async function DELETE(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = (url.searchParams.get('id') || '').trim();
  if (!id) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'id zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.santralScheduledCallbacks).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Callback bulunamadı.' }, { status: 404 });
  }
  const d = snap.data() as { ngoId?: string };
  if (d.ngoId !== ctx.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu callback başka bir STK\'ya ait.' },
      { status: 403 },
    );
  }

  await ref.update({ status: 'cancelled', cancelledAt: FieldValue.serverTimestamp(), cancelledBy: ctx.uid });
  return NextResponse.json({ ok: true });
}
