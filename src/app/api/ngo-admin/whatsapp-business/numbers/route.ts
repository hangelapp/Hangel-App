/**
 * GET  /api/ngo-admin/whatsapp-business/numbers
 *   STK'nın bağlı WABA numaralarını döner (status='paused' dahil; UI ayırır).
 *
 * POST /api/ngo-admin/whatsapp-business/numbers
 *   Yeni WABA numarası bağlar. Meta'dan verified_name + quality_rating doğrular,
 *   ardından wabaPhoneNumbers koleksiyonuna yazar.
 *
 *   Body: { phoneNumber (E.164), wabaPhoneNumberId, wabaAccountId, displayName,
 *           accessToken (POC: plain), appSecret? (POC: plain) }
 *   Yanıt: { id, verified, displayName, quality }
 *
 * Güvenlik: POC için accessToken ve appSecret Firestore'a plaintext yazılır;
 * multi-tenant prod'da Secret Manager path'e taşınacak (accessTokenRef + appSecretRef alanları).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { getWhatsAppProvider } from '@/lib/whatsapp/index';
import { MetaCloudError } from '@/lib/whatsapp/meta-cloud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface NumberRow {
  id: string;
  phoneNumber: string;
  wabaPhoneNumberId: string;
  wabaAccountId: string;
  displayName: string;
  displayNameStatus: string;
  qualityRating: string | null;
  monthlyTier: string | null;
  status: string;
  verifiedAt: string | null;
  createdAt: string | null;
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
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'larıyla gelir (çoklu
    // kurum yöneten kullanıcı için kritik). Caller o kuruma üyeyse (ilgili managed*
    // alanı header'la eşleşir) ya da super-admin ise header'daki kurum kullanılır;
    // yoksa managedNgoId → managedBrandId → managedClubId ilk dolu olana düşer.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = (req.headers.get('x-org-id') || '').trim() || undefined;

    let activeOrgId = '';
    if (hdrOrgId && hdrKind) {
      const isSuper = d.role === 'super-admin';
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

function isE164(value: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(value);
}

function metaErrorStatus(category: string): number {
  if (category === 'invalid_token') return 401;
  if (category === 'permission_denied') return 403;
  if (category === 'not_found') return 404;
  if (category === 'rate_limit') return 429;
  return 502;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const db = getAdminFirestore();
  let snap: FirebaseFirestore.QuerySnapshot;
  try {
    snap = await db
      .collection(COLLECTIONS.wabaPhoneNumbers)
      .where('ngoId', '==', ctx.ngoId)
      .orderBy('createdAt', 'desc')
      .get();
  } catch (e) {
    return NextResponse.json(
      { errorCode: 'QUERY_FAILED', message: e instanceof Error ? e.message : 'Numara sorgusu başarısız.' },
      { status: 500 },
    );
  }

  const numbers: NumberRow[] = snap.docs.map((doc) => {
    const d = doc.data() as Record<string, unknown>;
    return {
      id: doc.id,
      phoneNumber: typeof d.phoneNumber === 'string' ? d.phoneNumber : '',
      wabaPhoneNumberId: typeof d.wabaPhoneNumberId === 'string' ? d.wabaPhoneNumberId : '',
      wabaAccountId: typeof d.wabaAccountId === 'string' ? d.wabaAccountId : '',
      displayName: typeof d.displayName === 'string' ? d.displayName : '',
      displayNameStatus: typeof d.displayNameStatus === 'string' ? d.displayNameStatus : 'pending',
      qualityRating: typeof d.qualityRating === 'string' ? d.qualityRating : null,
      monthlyTier: typeof d.monthlyTier === 'string' ? d.monthlyTier : null,
      status: typeof d.status === 'string' ? d.status : 'active',
      verifiedAt: toIso(d.verifiedAt),
      createdAt: toIso(d.createdAt),
    };
  });

  return NextResponse.json({ numbers });
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

  const phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : '';
  const wabaPhoneNumberId = typeof body.wabaPhoneNumberId === 'string' ? body.wabaPhoneNumberId.trim() : '';
  const wabaAccountId = typeof body.wabaAccountId === 'string' ? body.wabaAccountId.trim() : '';
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';
  const appSecret = typeof body.appSecret === 'string' ? body.appSecret.trim() : '';

  if (!isE164(phoneNumber)) {
    return NextResponse.json(
      { errorCode: 'INVALID_PHONE', message: 'Telefon numarası E.164 formatında olmalı (örn. +905551112233).' },
      { status: 400 },
    );
  }
  if (!wabaPhoneNumberId) {
    return NextResponse.json({ errorCode: 'MISSING_PHONE_ID', message: 'wabaPhoneNumberId zorunlu.' }, { status: 400 });
  }
  if (!wabaAccountId) {
    return NextResponse.json({ errorCode: 'MISSING_WABA_ID', message: 'wabaAccountId zorunlu.' }, { status: 400 });
  }
  if (!displayName) {
    return NextResponse.json({ errorCode: 'MISSING_DISPLAY_NAME', message: 'displayName zorunlu.' }, { status: 400 });
  }
  if (!accessToken) {
    return NextResponse.json({ errorCode: 'MISSING_TOKEN', message: 'accessToken zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();

  // Aynı STK için aynı phone_number_id tekrar bağlanamaz.
  const dupSnap = await db
    .collection(COLLECTIONS.wabaPhoneNumbers)
    .where('ngoId', '==', ctx.ngoId)
    .where('wabaPhoneNumberId', '==', wabaPhoneNumberId)
    .limit(1)
    .get();
  if (!dupSnap.empty) {
    return NextResponse.json(
      { errorCode: 'DUPLICATE', message: 'Bu numara zaten bağlı.' },
      { status: 409 },
    );
  }

  // Meta'dan numara doğrula (verified_name + quality_rating).
  const client = getWhatsAppProvider({ accessToken, phoneNumberId: wabaPhoneNumberId, wabaId: wabaAccountId });
  let info;
  try {
    info = await client.getPhoneNumberInfo(wabaPhoneNumberId);
  } catch (e) {
    if (e instanceof MetaCloudError) {
      return NextResponse.json(
        { errorCode: 'META_ERROR', message: `Meta doğrulaması başarısız: ${e.message}` },
        { status: metaErrorStatus(e.category) },
      );
    }
    return NextResponse.json(
      { errorCode: 'META_ERROR', message: e instanceof Error ? e.message : 'Meta doğrulaması başarısız.' },
      { status: 502 },
    );
  }

  const ref = db.collection(COLLECTIONS.wabaPhoneNumbers).doc();
  const docPayload: Record<string, unknown> = {
    ngoId: ctx.ngoId,
    phoneNumber,
    wabaPhoneNumberId,
    wabaAccountId,
    displayName,
    displayNameStatus: 'pending',
    // POC: accessToken plaintext. Prod: Secret Manager path.
    accessToken,
    accessTokenRef: ref.id,
    // POC: appSecret plaintext (webhook X-Hub-Signature-256 doğrulaması için).
    // Prod: Secret Manager path → appSecretRef.
    ...(appSecret ? { appSecret, appSecretRef: ref.id } : {}),
    qualityRating: info.quality_rating,
    status: 'active',
    verifiedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: ctx.uid,
  };
  await ref.set(docPayload);

  return NextResponse.json({
    id: ref.id,
    verified: true,
    displayName,
    quality: info.quality_rating,
  });
}
