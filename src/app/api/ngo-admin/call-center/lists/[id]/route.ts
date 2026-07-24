/**
 * GET    /api/ngo-admin/call-center/lists/[id]
 *   Liste detay + ilk 100 kişi önizleme. Yalnızca caller'ın tenant'ı (ctx.ngoId).
 *
 * DELETE /api/ngo-admin/call-center/lists/[id]
 *   Soft delete: liste status='archived', listIds[] içinden bu liste id'si
 *   çıkarılır. Kişi (santralContacts) dokümanları silinmez — başka listede
 *   olabilir veya geçmiş çağrı kayıtları için referans tutulur.
 *
 * Next.js 15 dynamic param imzası: params Promise olarak gelir ve await edilir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { logAuditEvent, clientIpFromRequest } from '@/lib/santral/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PREVIEW_LIMIT = 100;
const ARCHIVE_BATCH_SIZE = 400;

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface ContactPreview {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  attempts: number;
  lastDisposition: string | null;
  lastAttemptAt: string | null;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as {
      role?: string;
      managedNgoId?: string;
      managedBrandId?: string;
      managedClubId?: string;
    } | undefined;
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu
    // kurum yöneten kullanıcı için kritik). Caller o kuruma üyeyse (managed*Id ==
    // header) ya da super-admin ise header'daki kurum kullanılır; yoksa
    // managedNgoId → managedBrandId → managedClubId ilk dolu olana düşer.
    const hdrOrgId = req.headers.get('x-org-id') || undefined;
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind =
      hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club'
        ? hdrKindRaw
        : undefined;
    const isSuperAdmin = d.role === 'super-admin';

    let activeOrgId = '';
    if (hdrOrgId && hdrKind) {
      const memberOf =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isSuperAdmin && !memberOf) return null;
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

function toIso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'object' && v !== null && '_seconds' in (v as Record<string, unknown>)) {
    const seconds = (v as { _seconds: number })._seconds;
    return new Date(seconds * 1000).toISOString();
  }
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return null;
}

async function loadList(
  db: FirebaseFirestore.Firestore,
  listId: string,
  ngoId: string,
): Promise<
  | { ok: true; ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }
  | { ok: false; status: number; errorCode: string; message: string }
> {
  const ref = db.collection(COLLECTIONS.santralContactLists).doc(listId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, status: 404, errorCode: 'NOT_FOUND', message: 'Liste bulunamadı.' };
  }
  const data = snap.data() as Record<string, unknown>;
  if (data.ngoId !== ngoId) {
    return { ok: false, status: 403, errorCode: 'FORBIDDEN', message: 'Bu liste başka bir STK\'ya ait.' };
  }
  return { ok: true, ref, data };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'Liste id zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const loaded = await loadList(db, id, ctx.ngoId);
  if (!loaded.ok) {
    return NextResponse.json({ errorCode: loaded.errorCode, message: loaded.message }, { status: loaded.status });
  }

  const d = loaded.data;
  const list = {
    id,
    name: typeof d.name === 'string' ? d.name : '',
    description: typeof d.description === 'string' ? d.description : '',
    sourceFileName: typeof d.sourceFileName === 'string' ? d.sourceFileName : null,
    totalContacts: typeof d.totalContacts === 'number' ? d.totalContacts : 0,
    importedAt: toIso(d.importedAt),
    importedBy: typeof d.importedBy === 'string' ? d.importedBy : null,
    status: typeof d.status === 'string' ? d.status : 'active',
  };

  let contactsSnap: FirebaseFirestore.QuerySnapshot;
  try {
    contactsSnap = await db
      .collection(COLLECTIONS.santralContacts)
      .where('ngoId', '==', ctx.ngoId)
      .where('listIds', 'array-contains', id)
      .limit(PREVIEW_LIMIT)
      .get();
  } catch (e) {
    return NextResponse.json(
      { errorCode: 'QUERY_FAILED', message: e instanceof Error ? e.message : 'Kişi sorgusu başarısız.' },
      { status: 500 },
    );
  }

  const contacts: ContactPreview[] = contactsSnap.docs.map((doc) => {
    const c = doc.data() as Record<string, unknown>;
    return {
      id: doc.id,
      name: typeof c.name === 'string' ? c.name : '',
      phone: typeof c.phone === 'string' ? c.phone : '',
      email: typeof c.email === 'string' ? c.email : null,
      attempts: typeof c.attempts === 'number' ? c.attempts : 0,
      lastDisposition: typeof c.lastDisposition === 'string' ? c.lastDisposition : null,
      lastAttemptAt: toIso(c.lastAttemptAt),
    };
  });

  return NextResponse.json({ list, contacts, previewLimit: PREVIEW_LIMIT });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'Liste id zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const loaded = await loadList(db, id, ctx.ngoId);
  if (!loaded.ok) {
    return NextResponse.json({ errorCode: loaded.errorCode, message: loaded.message }, { status: loaded.status });
  }

  if (loaded.data.status === 'archived') {
    return NextResponse.json({ ok: true, alreadyArchived: true });
  }

  // Listeyi archived'a çek + bu listId'yi içeren tüm kişilerden çıkar.
  // arrayRemove kişi başka listede ise dokümanı korur; tek listesiyse
  // listIds boş kalır ama kişi silinmez (geçmiş çağrı/istatistik referansı).
  let updatedContacts = 0;
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  for (;;) {
    let q = db
      .collection(COLLECTIONS.santralContacts)
      .where('ngoId', '==', ctx.ngoId)
      .where('listIds', 'array-contains', id)
      .orderBy('__name__')
      .limit(ARCHIVE_BATCH_SIZE);
    if (cursor) q = q.startAfter(cursor);

    let pageSnap: FirebaseFirestore.QuerySnapshot;
    try {
      pageSnap = await q.get();
    } catch (e) {
      return NextResponse.json(
        { errorCode: 'QUERY_FAILED', message: e instanceof Error ? e.message : 'Kişi güncellemesi başarısız.' },
        { status: 500 },
      );
    }
    if (pageSnap.empty) break;

    const batch = db.batch();
    for (const doc of pageSnap.docs) {
      batch.update(doc.ref, { listIds: FieldValue.arrayRemove(id) });
    }
    await batch.commit();
    updatedContacts += pageSnap.size;
    if (pageSnap.size < ARCHIVE_BATCH_SIZE) break;
    cursor = pageSnap.docs[pageSnap.docs.length - 1];
  }

  await loaded.ref.update({
    status: 'archived',
    archivedAt: FieldValue.serverTimestamp(),
    archivedBy: ctx.uid,
  });

  await logAuditEvent({
    actorUid: ctx.uid,
    action: 'call_center.list.archive',
    resourceType: 'santralContactLists',
    resourceId: id,
    ipAddress: clientIpFromRequest(req),
    details: {
      ngoId: ctx.ngoId,
      updatedContacts,
      previousStatus: typeof loaded.data.status === 'string' ? loaded.data.status : 'active',
    },
  });

  return NextResponse.json({ ok: true, archived: true, updatedContacts });
}
