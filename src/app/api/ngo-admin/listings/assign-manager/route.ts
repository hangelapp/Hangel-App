/**
 * POST /api/ngo-admin/listings/assign-manager
 *
 * Bir ETKİNLİK veya GÖNÜLLÜLÜK ilanına, o ilana ÖZEL yönetici atar/kaldırır.
 * Atanan kişi yalnız O ilanın yöneticisi olur (ilan sahibi STK'nın geneline
 * yetki kazanmaz) — firestore.rules'ta resource.data.managerUids ile o dokümana
 * yazma izni açılır. Atanan kişiye bildirim + mesaj gönderilir.
 *
 * Yetki: ilanın SAHİBİ kuruluşun yöneticisi VEYA super-admin. Caller ilanı
 * gönderir; önce ilan dokümanı (Admin SDK) yüklenip sahibi çözülür
 * (volunteering.ngoId / event.organizerId), sonra resolveOrgAdminCtx ile o
 * kuruluşu yönetip yönetmediği doğrulanır.
 *
 * Body (ata):    { kind: 'event'|'volunteering', listingId: string, phone: string }
 *               (opsiyonel: phone yerine userId doğrudan verilebilir)
 * Body (kaldır): { kind, listingId, action: 'remove', userId: string }
 *
 * Yanıt: { ok: true, userId, name } | { errorCode, error }
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { canonicalPhone, phoneMatchCandidates, toE164 } from '@/lib/phone-normalize';
import { resolveOrgAdminCtx } from '@/lib/ngo-admin/org-admin-auth';
import { notifyUser } from '@/lib/notify-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** users doc'undan görünen adı çöz (lookup-by-phone ile aynı sıra). */
function resolveName(d: Record<string, unknown> | undefined): string {
  if (!d) return '';
  const personal = (d.personalInfo as { fullName?: string; firstName?: string; lastName?: string } | undefined) || {};
  const fullName = typeof d.fullName === 'string' ? d.fullName : '';
  const name = typeof d.name === 'string' ? d.name : '';
  const displayName = typeof d.displayName === 'string' ? d.displayName : '';
  const firstName = typeof d.firstName === 'string' ? d.firstName : (personal.firstName || '');
  const lastName = typeof d.lastName === 'string' ? d.lastName : (personal.lastName || '');
  return (
    (personal.fullName || '').trim() ||
    fullName.trim() ||
    name.trim() ||
    displayName.trim() ||
    `${firstName} ${lastName}`.trim()
  );
}

/** Telefondan hangel üyesini çöz → { uid, name } veya null. */
async function resolveUserByPhone(rawPhone: string): Promise<{ uid: string; name: string } | null> {
  const auth = getAdminAuth();
  const db = getAdminFirestore();

  // 1) Firebase Auth — getUserByPhoneNumber (E.164).
  const e164 = toE164(rawPhone, '+90');
  if (e164) {
    try {
      const user = await auth.getUserByPhoneNumber(e164);
      let name = '';
      try {
        const udoc = await db.collection(COLLECTIONS.users).doc(user.uid).get();
        name = resolveName(udoc.data() as Record<string, unknown> | undefined);
      } catch { /* doc yoksa Auth displayName'e düş */ }
      if (!name) name = user.displayName || '';
      return { uid: user.uid, name };
    } catch {
      // auth/user-not-found — Firestore'a düş.
    }
  }

  // 2) Firestore users — phone alanını olası tüm yazımlarla ara.
  const candidates = phoneMatchCandidates(rawPhone, '+90');
  if (candidates.length > 0) {
    const [byPhone, byPersonal] = await Promise.all([
      db.collection(COLLECTIONS.users).where('phone', 'in', candidates).limit(1).get().catch(() => null),
      db.collection(COLLECTIONS.users).where('personalInfo.phone', 'in', candidates).limit(1).get().catch(() => null),
    ]);
    const doc = (byPhone && !byPhone.empty ? byPhone.docs[0] : null) || (byPersonal && !byPersonal.empty ? byPersonal.docs[0] : null);
    if (doc) {
      return { uid: doc.id, name: resolveName(doc.data() as Record<string, unknown> | undefined) };
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  let body: { kind?: unknown; listingId?: unknown; phone?: unknown; userId?: unknown; action?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ errorCode: 'BAD_BODY', error: 'Geçersiz istek.' }, { status: 400 });
  }

  const kind = body.kind === 'event' ? 'event' : body.kind === 'volunteering' ? 'volunteering' : null;
  const listingId = typeof body.listingId === 'string' ? body.listingId.trim() : '';
  const isRemove = body.action === 'remove';
  if (!kind || !listingId) {
    return NextResponse.json({ errorCode: 'BAD_BODY', error: "kind 'event'|'volunteering' ve listingId zorunlu." }, { status: 400 });
  }

  const db = getAdminFirestore();

  // 1) İlanı yükle → sahibi çöz (event: organizerId, volunteering: ngoId).
  const col = kind === 'event' ? COLLECTIONS.events : COLLECTIONS.volunteering;
  const listingRef = db.collection(col).doc(listingId);
  const listingSnap = await listingRef.get();
  if (!listingSnap.exists) {
    return NextResponse.json({ errorCode: 'LISTING_NOT_FOUND', error: 'İlan bulunamadı.' }, { status: 404 });
  }
  const listing = listingSnap.data() as { organizerId?: string; ngoId?: string; name?: string; title?: string };
  const ownerOrgId = kind === 'event' ? (listing.organizerId || '') : (listing.ngoId || '');
  if (!ownerOrgId) {
    return NextResponse.json({ errorCode: 'NO_OWNER', error: 'İlan sahibi kuruluş bulunamadı.' }, { status: 400 });
  }

  // 2) Yetki: sahibi kuruluşu yöneten admin VEYA super-admin. resolveOrgAdminCtx
  //    non-super caller'ın managed{kind}Id == ownerOrgId olduğunu doğrular.
  //    NOT: etkinlik sahibi bir öğrenci kulübü de olabilir → kind='club' ile de
  //    dene; 'ngo' başarısızsa 'club'a düş (STK sahibi 'ngo' ile geçer).
  let auth = await resolveOrgAdminCtx(req, { orgId: ownerOrgId, kind: 'ngo' });
  if (!auth.ok && kind === 'event') {
    const clubAuth = await resolveOrgAdminCtx(req, { orgId: ownerOrgId, kind: 'club' });
    if (clubAuth.ok) auth = clubAuth;
  }
  if (!auth.ok) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', error: auth.error }, { status: auth.status });
  }

  const listingTitle = (kind === 'event' ? listing.name : listing.title) || 'İlan';

  // ── Yönetici KALDIR ────────────────────────────────────────────────────────
  if (isRemove) {
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    if (!userId) {
      return NextResponse.json({ errorCode: 'BAD_BODY', error: 'userId zorunlu.' }, { status: 400 });
    }
    // Adı da arrayRemove edebilmek için mevcut managerNames'ten karşılığını bul.
    const uids = Array.isArray(listing['managerUids' as keyof typeof listing])
      ? (listing['managerUids' as keyof typeof listing] as unknown as string[]) : [];
    const names = Array.isArray(listing['managerNames' as keyof typeof listing])
      ? (listing['managerNames' as keyof typeof listing] as unknown as string[]) : [];
    const idx = uids.indexOf(userId);
    const nameToRemove = idx >= 0 ? names[idx] : undefined;
    await listingRef.update({
      managerUids: FieldValue.arrayRemove(userId),
      ...(nameToRemove !== undefined ? { managerNames: FieldValue.arrayRemove(nameToRemove) } : {}),
    });
    return NextResponse.json({ ok: true, userId, name: nameToRemove || '' });
  }

  // ── Yönetici ATA ────────────────────────────────────────────────────────────
  let target: { uid: string; name: string } | null;
  const directUserId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (directUserId) {
    const udoc = await db.collection(COLLECTIONS.users).doc(directUserId).get();
    if (!udoc.exists) {
      return NextResponse.json({ errorCode: 'USER_NOT_FOUND', error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }
    target = { uid: directUserId, name: resolveName(udoc.data() as Record<string, unknown> | undefined) };
  } else {
    const rawPhone = typeof body.phone === 'string' ? body.phone : '';
    const canonical = canonicalPhone(rawPhone, '+90');
    if (!canonical || canonical.length < 7) {
      return NextResponse.json({ errorCode: 'INVALID_PHONE', error: 'Geçerli bir telefon girin.' }, { status: 400 });
    }
    target = await resolveUserByPhone(rawPhone);
  }

  if (!target) {
    return NextResponse.json({ errorCode: 'USER_NOT_FOUND', error: 'Bu telefona ait hangel üyesi bulunamadı.' }, { status: 404 });
  }
  const name = target.name || 'Yönetici';

  // İlan dokümanına yaz (Admin SDK rules'ı baypas eder).
  await listingRef.update({
    managerUids: FieldValue.arrayUnion(target.uid),
    managerNames: FieldValue.arrayUnion(name),
  });

  // Atanan kişiyi bilgilendir (best-effort — bildirim hatası atamayı bozmaz).
  try {
    await notifyUser({
      userId: target.uid,
      type: 'ngo_message',
      title: 'Yönetici olarak atandınız',
      body: `"${listingTitle}" için yönetici olarak atandınız.`,
      link: kind === 'event' ? `/events/${listingId}` : `/volunteering/${listingId}`,
      storeAsMessage: true,
      data: { kind, listingId },
    });
  } catch (e) {
    console.warn('[assign-manager] notify failed', e);
  }

  return NextResponse.json({ ok: true, userId: target.uid, name });
}
