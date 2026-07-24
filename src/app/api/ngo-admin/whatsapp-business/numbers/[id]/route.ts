/**
 * GET    /api/ngo-admin/whatsapp-business/numbers/[id]
 *   Numara detayı + Meta'dan güncel quality_rating + code_verification_status.
 *
 * DELETE /api/ngo-admin/whatsapp-business/numbers/[id]
 *   Soft delete: status='paused'. Doc + accessToken korunur (yeniden açılabilir).
 *
 * PATCH  /api/ngo-admin/whatsapp-business/numbers/[id]
 *   Body: { displayName? } — yeni görünür isim. Meta'ya display_name güncelleme
 *   isteği gönderir (yeniden onay süreci başlar) + Firestore'da displayNameStatus
 *   'pending' olarak işaretler.
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
    // kurum yöneten kullanıcı için kritik). Header'daki kurum ngo/brand/club
    // olabilir; caller o kuruma üyeyse (ilgili managed*Id eşleşir) ya da
    // super-admin ise header'daki kurum kullanılır; yoksa yetkisiz.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = (req.headers.get('x-org-id') || '').trim() || undefined;

    let __activeNgoId = '';
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isSuperAdmin && !isMember) return null;
      __activeNgoId = hdrOrgId;
    } else {
      __activeNgoId = d.managedNgoId || d.managedBrandId || d.managedClubId || '';
    }
    if (!__activeNgoId) return null;
    return { uid: decoded.uid, ngoId: __activeNgoId };
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

async function loadNumber(
  db: FirebaseFirestore.Firestore,
  id: string,
  ngoId: string,
): Promise<
  | { ok: true; ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }
  | { ok: false; status: number; errorCode: string; message: string }
> {
  const ref = db.collection(COLLECTIONS.wabaPhoneNumbers).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, status: 404, errorCode: 'NOT_FOUND', message: 'Numara bulunamadı.' };
  }
  const data = snap.data() as Record<string, unknown>;
  if (data.ngoId !== ngoId) {
    return { ok: false, status: 403, errorCode: 'FORBIDDEN', message: 'Bu numara başka bir STK\'ya ait.' };
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
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'Numara id zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const loaded = await loadNumber(db, id, ctx.ngoId);
  if (!loaded.ok) {
    return NextResponse.json({ errorCode: loaded.errorCode, message: loaded.message }, { status: loaded.status });
  }

  const d = loaded.data;
  const accessToken = typeof d.accessToken === 'string' ? d.accessToken : '';
  const wabaPhoneNumberId = typeof d.wabaPhoneNumberId === 'string' ? d.wabaPhoneNumberId : '';
  const wabaAccountId = typeof d.wabaAccountId === 'string' ? d.wabaAccountId : '';

  let liveQuality: string | null = null;
  let liveVerification: string | null = null;
  let liveDisplayPhone: string | null = null;
  let liveVerifiedName: string | null = null;
  if (accessToken && wabaPhoneNumberId) {
    try {
      const client = getWhatsAppProvider({ accessToken, phoneNumberId: wabaPhoneNumberId, wabaId: wabaAccountId });
      const info = await client.getPhoneNumberInfo(wabaPhoneNumberId);
      liveQuality = info.quality_rating || null;
      liveVerification = info.code_verification_status || null;
      liveDisplayPhone = info.display_phone_number || null;
      liveVerifiedName = info.verified_name || null;

      const updates: Record<string, unknown> = {};
      if (liveQuality && liveQuality !== d.qualityRating) updates.qualityRating = liveQuality;
      if (Object.keys(updates).length > 0) {
        await loaded.ref.update(updates);
      }
    } catch {
      // Meta sorgulanamadıysa cache'den döneriz; hata yutulur (offline tolerans).
    }
  }

  const number = {
    id,
    ngoId: typeof d.ngoId === 'string' ? d.ngoId : '',
    phoneNumber: typeof d.phoneNumber === 'string' ? d.phoneNumber : '',
    wabaPhoneNumberId,
    wabaAccountId,
    displayName: typeof d.displayName === 'string' ? d.displayName : '',
    displayNameStatus: typeof d.displayNameStatus === 'string' ? d.displayNameStatus : 'pending',
    qualityRating: liveQuality ?? (typeof d.qualityRating === 'string' ? d.qualityRating : null),
    monthlyTier: typeof d.monthlyTier === 'string' ? d.monthlyTier : null,
    status: typeof d.status === 'string' ? d.status : 'active',
    verifiedAt: toIso(d.verifiedAt),
    createdAt: toIso(d.createdAt),
    live: {
      codeVerificationStatus: liveVerification,
      displayPhoneNumber: liveDisplayPhone,
      verifiedName: liveVerifiedName,
    },
  };

  return NextResponse.json({ number });
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
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'Numara id zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const loaded = await loadNumber(db, id, ctx.ngoId);
  if (!loaded.ok) {
    return NextResponse.json({ errorCode: loaded.errorCode, message: loaded.message }, { status: loaded.status });
  }

  if (loaded.data.status === 'paused') {
    return NextResponse.json({ ok: true, alreadyPaused: true });
  }

  await loaded.ref.update({
    status: 'paused',
    pausedAt: FieldValue.serverTimestamp(),
    pausedBy: ctx.uid,
  });

  return NextResponse.json({ ok: true, paused: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'Numara id zorunlu.' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövde.' }, { status: 400 });
  }

  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  if (!displayName) {
    return NextResponse.json(
      { errorCode: 'MISSING_DISPLAY_NAME', message: 'displayName zorunlu.' },
      { status: 400 },
    );
  }

  const db = getAdminFirestore();
  const loaded = await loadNumber(db, id, ctx.ngoId);
  if (!loaded.ok) {
    return NextResponse.json({ errorCode: loaded.errorCode, message: loaded.message }, { status: loaded.status });
  }

  const d = loaded.data;
  const accessToken = typeof d.accessToken === 'string' ? d.accessToken : '';
  const wabaPhoneNumberId = typeof d.wabaPhoneNumberId === 'string' ? d.wabaPhoneNumberId : '';
  if (!accessToken || !wabaPhoneNumberId) {
    return NextResponse.json(
      { errorCode: 'NUMBER_NOT_READY', message: 'Numara Meta entegrasyonu eksik.' },
      { status: 409 },
    );
  }

  // Meta: display_name güncelleme. Onay süreci baştan başlar.
  try {
    const res = await fetch(`${GRAPH}/${wabaPhoneNumberId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verified_name: displayName }),
    });
    if (!res.ok) {
      const raw = await res.json().catch(() => null) as { error?: { message?: string; code?: number } } | null;
      const message = raw?.error?.message || `Meta HTTP ${res.status}`;
      return NextResponse.json(
        { errorCode: 'META_ERROR', message: `Meta isim güncellemesi başarısız: ${message}` },
        { status: res.status === 401 || res.status === 403 ? res.status : 502 },
      );
    }
  } catch (e) {
    if (e instanceof MetaCloudError) {
      return NextResponse.json(
        { errorCode: 'META_ERROR', message: e.message },
        { status: metaErrorStatus(e.category) },
      );
    }
    return NextResponse.json(
      { errorCode: 'NETWORK', message: e instanceof Error ? e.message : 'Meta erişilemedi.' },
      { status: 502 },
    );
  }

  await loaded.ref.update({
    displayName,
    displayNameStatus: 'pending',
    displayNameUpdatedAt: FieldValue.serverTimestamp(),
    displayNameUpdatedBy: ctx.uid,
  });

  return NextResponse.json({ ok: true, displayName, displayNameStatus: 'pending' });
}
