/**
 * GET    /api/ngo-admin/whatsapp-business/templates/[id]
 *   Şablon detayı (Firestore).
 *
 * POST   /api/ngo-admin/whatsapp-business/templates/[id]
 *   Refresh: Meta'dan güncel status çek, Firestore'a yaz.
 *
 * DELETE /api/ngo-admin/whatsapp-business/templates/[id]
 *   Meta'dan + Firestore'dan sil. Meta DELETE: name + (varsa) hsm_id ile.
 *
 * Next.js 15 dynamic param imzası: params Promise olarak gelir.
 * Tüm Meta çağrılarında accessToken numara doc'undan okunur.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getWhatsAppProvider } from '@/lib/whatsapp/index';
import { MetaCloudError } from '@/lib/whatsapp/meta-cloud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GRAPH = 'https://graph.facebook.com/v21.0';

interface CallerContext {
  uid: string;
  ngoId: string;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string } | undefined;
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    const isSuper = d.role === 'super-admin';
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu kurum
    // yöneten kullanıcı için kritik). Caller o kuruma üyeyse (ngo/brand/club) ya da
    // super-admin ise header'daki kurum kullanılır; yoksa yönetilen ilk kuruma düşer.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = (req.headers.get('x-org-id') || '').trim() || undefined;
    let activeOrgId = '';
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isSuper && !isMember) return null;
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

function metaErrorStatus(category: string): number {
  if (category === 'invalid_token') return 401;
  if (category === 'permission_denied') return 403;
  if (category === 'not_found') return 404;
  if (category === 'rate_limit') return 429;
  return 502;
}

function metaStatusToLocal(metaStatus: string): 'approved' | 'pending' | 'rejected' | 'paused' | 'draft' {
  const s = metaStatus.toUpperCase();
  if (s === 'APPROVED') return 'approved';
  if (s === 'PENDING') return 'pending';
  if (s === 'REJECTED') return 'rejected';
  if (s === 'PAUSED' || s === 'DISABLED') return 'paused';
  return 'draft';
}

async function loadTemplate(
  db: FirebaseFirestore.Firestore,
  id: string,
  ngoId: string,
): Promise<
  | { ok: true; ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }
  | { ok: false; status: number; errorCode: string; message: string }
> {
  const ref = db.collection(COLLECTIONS.wabaTemplates).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, status: 404, errorCode: 'NOT_FOUND', message: 'Şablon bulunamadı.' };
  }
  const data = snap.data() as Record<string, unknown>;
  if (data.ngoId !== ngoId) {
    return { ok: false, status: 403, errorCode: 'FORBIDDEN', message: 'Bu şablon başka bir STK\'ya ait.' };
  }
  return { ok: true, ref, data };
}

async function loadNumberAuth(
  db: FirebaseFirestore.Firestore,
  templateData: Record<string, unknown>,
  ngoId: string,
): Promise<
  | { ok: true; accessToken: string; wabaAccountId: string; metaPhoneNumberId: string }
  | { ok: false; status: number; errorCode: string; message: string }
> {
  const wabaPhoneNumberId = typeof templateData.wabaPhoneNumberId === 'string' ? templateData.wabaPhoneNumberId : '';
  if (!wabaPhoneNumberId) {
    return { ok: false, status: 409, errorCode: 'NO_PHONE', message: 'Şablon numara bilgisi yok.' };
  }
  const snap = await db.collection(COLLECTIONS.wabaPhoneNumbers).doc(wabaPhoneNumberId).get();
  if (!snap.exists) {
    return { ok: false, status: 404, errorCode: 'NUMBER_NOT_FOUND', message: 'Şablonun bağlı numarası silinmiş.' };
  }
  const nd = snap.data() as Record<string, unknown>;
  if (nd.ngoId !== ngoId) {
    return { ok: false, status: 403, errorCode: 'FORBIDDEN', message: 'Numara başka STK\'ya ait.' };
  }
  const accessToken = typeof nd.accessToken === 'string' ? nd.accessToken : '';
  const wabaAccountId = typeof nd.wabaAccountId === 'string' ? nd.wabaAccountId : '';
  const metaPhoneNumberId = typeof nd.wabaPhoneNumberId === 'string' ? nd.wabaPhoneNumberId : '';
  if (!accessToken || !wabaAccountId) {
    return { ok: false, status: 409, errorCode: 'NUMBER_NOT_READY', message: 'Numara Meta entegrasyonu eksik.' };
  }
  return { ok: true, accessToken, wabaAccountId, metaPhoneNumberId };
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
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'Şablon id zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const loaded = await loadTemplate(db, id, ctx.ngoId);
  if (!loaded.ok) {
    return NextResponse.json({ errorCode: loaded.errorCode, message: loaded.message }, { status: loaded.status });
  }

  const d = loaded.data;
  const template = {
    id,
    ngoId: typeof d.ngoId === 'string' ? d.ngoId : '',
    wabaPhoneNumberId: typeof d.wabaPhoneNumberId === 'string' ? d.wabaPhoneNumberId : '',
    name: typeof d.name === 'string' ? d.name : '',
    category: typeof d.category === 'string' ? d.category : 'utility',
    language: typeof d.language === 'string' ? d.language : 'tr',
    bodyText: typeof d.bodyText === 'string' ? d.bodyText : '',
    headerText: typeof d.headerText === 'string' ? d.headerText : null,
    footerText: typeof d.footerText === 'string' ? d.footerText : null,
    buttons: Array.isArray(d.buttons) ? d.buttons : [],
    variables: Array.isArray(d.variables) ? (d.variables as string[]) : [],
    wabaTemplateId: typeof d.wabaTemplateId === 'string' ? d.wabaTemplateId : null,
    status: typeof d.status === 'string' ? d.status : 'draft',
    rejectionReason: typeof d.rejectionReason === 'string' ? d.rejectionReason : null,
    createdAt: toIso(d.createdAt),
    submittedAt: toIso(d.submittedAt),
  };

  return NextResponse.json({ template });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'Şablon id zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const loaded = await loadTemplate(db, id, ctx.ngoId);
  if (!loaded.ok) {
    return NextResponse.json({ errorCode: loaded.errorCode, message: loaded.message }, { status: loaded.status });
  }

  const auth = await loadNumberAuth(db, loaded.data, ctx.ngoId);
  if (!auth.ok) {
    return NextResponse.json({ errorCode: auth.errorCode, message: auth.message }, { status: auth.status });
  }

  const name = typeof loaded.data.name === 'string' ? loaded.data.name : '';
  const language = typeof loaded.data.language === 'string' ? loaded.data.language : '';

  const client = getWhatsAppProvider({
    accessToken: auth.accessToken,
    phoneNumberId: auth.metaPhoneNumberId,
    wabaId: auth.wabaAccountId,
  });

  let listed;
  try {
    listed = await client.listTemplates(auth.wabaAccountId);
  } catch (e) {
    if (e instanceof MetaCloudError) {
      return NextResponse.json(
        { errorCode: 'META_ERROR', message: e.message },
        { status: metaErrorStatus(e.category) },
      );
    }
    return NextResponse.json(
      { errorCode: 'META_ERROR', message: e instanceof Error ? e.message : 'Meta sorgusu başarısız.' },
      { status: 502 },
    );
  }

  const match = listed.find((t) => t.name === name && t.language === language);
  if (!match) {
    await loaded.ref.update({
      status: 'rejected',
      rejectionReason: 'Meta tarafında bulunamadı (silinmiş olabilir).',
      refreshedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json(
      { errorCode: 'META_NOT_FOUND', message: 'Şablon Meta tarafında bulunamadı.' },
      { status: 404 },
    );
  }

  const newStatus = metaStatusToLocal(match.status);
  const updates: Record<string, unknown> = {
    status: newStatus,
    wabaTemplateId: match.id || loaded.data.wabaTemplateId || null,
    refreshedAt: FieldValue.serverTimestamp(),
  };
  if (newStatus !== 'rejected') {
    updates.rejectionReason = FieldValue.delete();
  }
  await loaded.ref.update(updates);

  return NextResponse.json({
    ok: true,
    status: newStatus,
    wabaTemplateId: match.id || null,
    metaStatus: match.status,
  });
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
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'Şablon id zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const loaded = await loadTemplate(db, id, ctx.ngoId);
  if (!loaded.ok) {
    return NextResponse.json({ errorCode: loaded.errorCode, message: loaded.message }, { status: loaded.status });
  }

  const auth = await loadNumberAuth(db, loaded.data, ctx.ngoId);
  if (!auth.ok) {
    // Numara silinmişse Firestore'dan sil + uyar.
    await loaded.ref.delete();
    return NextResponse.json({ ok: true, deleted: true, metaSkipped: true, reason: auth.errorCode });
  }

  const name = typeof loaded.data.name === 'string' ? loaded.data.name : '';
  const wabaTemplateId = typeof loaded.data.wabaTemplateId === 'string' ? loaded.data.wabaTemplateId : '';
  const status = typeof loaded.data.status === 'string' ? loaded.data.status : 'draft';

  // Meta DELETE — sadece Meta'ya submit edilmiş (draft değil) şablonlar için.
  if (status !== 'draft' && name) {
    const qs = new URLSearchParams({ name });
    if (wabaTemplateId) qs.set('hsm_id', wabaTemplateId);
    try {
      const res = await fetch(`${GRAPH}/${auth.wabaAccountId}/message_templates?${qs.toString()}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (!res.ok) {
        const raw = await res.json().catch(() => null) as { error?: { message?: string; code?: number } } | null;
        // 404 = zaten silinmiş; tolere et.
        if (res.status !== 404) {
          const message = raw?.error?.message || `Meta HTTP ${res.status}`;
          return NextResponse.json(
            { errorCode: 'META_ERROR', message: `Meta silme başarısız: ${message}` },
            { status: res.status === 401 || res.status === 403 ? res.status : 502 },
          );
        }
      }
    } catch (e) {
      return NextResponse.json(
        { errorCode: 'NETWORK', message: e instanceof Error ? e.message : 'Meta erişilemedi.' },
        { status: 502 },
      );
    }
  }

  await loaded.ref.delete();
  return NextResponse.json({ ok: true, deleted: true });
}
