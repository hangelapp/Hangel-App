/**
 * POST /api/ngo-admin/whatsapp-business/templates/sync
 *   Body: { wabaPhoneNumberId }
 *   Meta'dan ilgili WABA hesabının tüm şablonlarını çeker ve Firestore'a
 *   idempotent şekilde yansıtır:
 *     - Aynı (ngoId, wabaPhoneNumberId, name, language) için doc varsa
 *       status + wabaTemplateId güncellenir (added=false, updated=true).
 *     - Yoksa yeni doc create edilir (added=true). bodyText/headerText vb.
 *       Meta listesi component detaylarını döndürmüyor (fields=id,name,status,
 *       category,language); bilinmeyen alanlar boş bırakılır ve UI sonradan
 *       detay refresh ile doldurabilir.
 *
 *   Yanıt: { synced, added, updated }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getWhatsAppProvider } from '@/lib/whatsapp/index';
import { MetaCloudError } from '@/lib/whatsapp/meta-cloud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const d = snap.data() as {
      role?: string;
      managedNgoId?: string;
      managedBrandId?: string;
      managedClubId?: string;
    } | undefined;
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    const isSuperAdmin = d.role === 'super-admin';
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu
    // kurum yöneten kullanıcı için kritik). Caller o kuruma üyeyse ya da
    // super-admin ise header'daki kurum kullanılır; yoksa yönettiği ilk
    // (ngo → brand → club) kuruma düşer. Çözülen değer ngoId alanına yazılır
    // (imza korunuyor; ngoId artık brand/club id'si de olabilir).
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = req.headers.get('x-org-id') || undefined;

    let activeOrgId = '';
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isMember && !isSuperAdmin) return null;
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

function metaCategoryToLocal(metaCategory: string): 'utility' | 'marketing' | 'authentication' {
  const c = metaCategory.toUpperCase();
  if (c === 'MARKETING') return 'marketing';
  if (c === 'AUTHENTICATION') return 'authentication';
  return 'utility';
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövde.' }, { status: 400 });
  }

  const wabaPhoneNumberId = typeof body.wabaPhoneNumberId === 'string' ? body.wabaPhoneNumberId.trim() : '';
  if (!wabaPhoneNumberId) {
    return NextResponse.json(
      { errorCode: 'MISSING_PHONE_ID', message: 'wabaPhoneNumberId zorunlu.' },
      { status: 400 },
    );
  }

  const db = getAdminFirestore();

  const numberSnap = await db.collection(COLLECTIONS.wabaPhoneNumbers).doc(wabaPhoneNumberId).get();
  if (!numberSnap.exists) {
    return NextResponse.json(
      { errorCode: 'NUMBER_NOT_FOUND', message: 'Numara bulunamadı.' },
      { status: 404 },
    );
  }
  const numberData = numberSnap.data() as Record<string, unknown>;
  if (numberData.ngoId !== ctx.ngoId) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Bu numara başka bir STK\'ya ait.' },
      { status: 403 },
    );
  }

  const accessToken = typeof numberData.accessToken === 'string' ? numberData.accessToken : '';
  const wabaAccountId = typeof numberData.wabaAccountId === 'string' ? numberData.wabaAccountId : '';
  const metaPhoneNumberId = typeof numberData.wabaPhoneNumberId === 'string' ? numberData.wabaPhoneNumberId : '';
  if (!accessToken || !wabaAccountId) {
    return NextResponse.json(
      { errorCode: 'NUMBER_NOT_READY', message: 'Numara Meta entegrasyonu eksik.' },
      { status: 409 },
    );
  }

  const client = getWhatsAppProvider({ accessToken, phoneNumberId: metaPhoneNumberId, wabaId: wabaAccountId });
  let listed;
  try {
    listed = await client.listTemplates(wabaAccountId);
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

  // Tek seferlik Firestore sorgusu — STK'nın bu numaraya bağlı tüm şablonları.
  const existingSnap = await db
    .collection(COLLECTIONS.wabaTemplates)
    .where('ngoId', '==', ctx.ngoId)
    .where('wabaPhoneNumberId', '==', wabaPhoneNumberId)
    .get();
  const existingMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  for (const doc of existingSnap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const n = typeof d.name === 'string' ? d.name : '';
    const l = typeof d.language === 'string' ? d.language : '';
    if (n && l) existingMap.set(`${n}__${l}`, doc);
  }

  let added = 0;
  let updated = 0;

  for (const t of listed) {
    if (!t.name || !t.language) continue;
    const key = `${t.name}__${t.language}`;
    const localStatus = metaStatusToLocal(t.status);
    const localCategory = metaCategoryToLocal(t.category);
    const existing = existingMap.get(key);

    if (existing) {
      const ed = existing.data() as Record<string, unknown>;
      const updates: Record<string, unknown> = {
        status: localStatus,
        syncedAt: FieldValue.serverTimestamp(),
      };
      if (t.id && ed.wabaTemplateId !== t.id) updates.wabaTemplateId = t.id;
      if (ed.category !== localCategory) updates.category = localCategory;
      if (localStatus !== 'rejected' && typeof ed.rejectionReason === 'string') {
        updates.rejectionReason = FieldValue.delete();
      }
      await existing.ref.update(updates);
      updated += 1;
    } else {
      const ref = db.collection(COLLECTIONS.wabaTemplates).doc();
      await ref.set({
        ngoId: ctx.ngoId,
        wabaPhoneNumberId,
        wabaAccountId,
        name: t.name,
        category: localCategory,
        language: t.language,
        bodyText: '',
        headerText: null,
        footerText: null,
        buttons: [],
        variables: [],
        wabaTemplateId: t.id || null,
        status: localStatus,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: ctx.uid,
        syncedAt: FieldValue.serverTimestamp(),
        sourceImport: 'meta-sync',
      });
      added += 1;
    }
  }

  return NextResponse.json({ synced: listed.length, added, updated });
}
