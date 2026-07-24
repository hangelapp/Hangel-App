/**
 * Server-only auth helpers for messaging API routes.
 *
 * - checkMessagingKey: env-secret tabanlı (Cloud Scheduler, internal worker trigger)
 * - requireSuperAdmin: UI çağrıları için Firebase ID token verify + super-admin role kontrolü
 */

import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { roleTitleHasScope, type NgoScope } from '@/lib/ngo-admin/role-scopes';

export function checkMessagingKey(req: Request): NextResponse | null {
  const expected = process.env.MESSAGING_WORKER_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: 'MESSAGING_WORKER_KEY env yapılandırılmamış' },
      { status: 500 }
    );
  }
  const provided = req.headers.get('x-messaging-key');
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export interface SuperAdminContext {
  uid: string;
  email: string | null;
}

export async function requireSuperAdmin(
  req: Request
): Promise<{ error: NextResponse; actor?: undefined } | { actor: SuperAdminContext; error?: undefined }> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { error: NextResponse.json({ error: 'Token gerekli' }, { status: 401 }) };
  }

  let decoded: { uid: string; email?: string; role?: string };
  try {
    decoded = (await getAdminAuth().verifyIdToken(token)) as typeof decoded;
  } catch {
    return { error: NextResponse.json({ error: 'Geçersiz token' }, { status: 401 }) };
  }

  const email = decoded.email ?? null;
  // P0-4b: claim-only auth. Firestore role-doc fallback removed; all super-admin
  // UIDs were claim-stamped on 2026-05-18. Tokens auto-refresh hourly so any
  // admin active in the last hour carries the claim.
  if (decoded.role !== 'super-admin') {
    return { error: NextResponse.json({ error: 'Super-admin yetkisi gerekli' }, { status: 403 }) };
  }
  return { actor: { uid: decoded.uid, email } };
}

export interface NgoAdminContext {
  uid: string;
  email: string | null;
  ngoId: string;            // Server tarafında zorlanır — clientten gelenle override edilir
  isSuperAdmin: boolean;
  /** Aktif kurumun türü ('ngo'|'brand'|'club'). Çok-kurumlu destekte doldurulur;
   *  eski çağrılarda (kind gönderilmeyen) varsayılan 'ngo'. */
  kind?: 'ngo' | 'brand' | 'club';
}

/**
 * NGO/Marka/Kulüp admin kontrolü. AKTİF kurum önceliği:
 *   1) targetOrgId+targetKind (client'ın panelde seçili kurumu) — non-super
 *      caller'ın o kuruma ÜYE olduğu (managed{kind}Id eşleşmesi) doğrulanır.
 *   2) Eski targetNgoId (yalnız ngo) — geriye dönük.
 *   3) caller'ın kendi managedNgoId'si (tek-kurum eski davranış).
 * Süper admin her kuruma tam yetkili.
 */
export async function requireNgoAdmin(
  req: Request,
  options?: { allowSuperAdmin?: boolean; targetNgoId?: string; targetOrgId?: string; targetKind?: 'ngo' | 'brand' | 'club'; scope?: NgoScope; requireNgoId?: boolean }
): Promise<
  | { error: NextResponse; actor?: undefined }
  | { actor: NgoAdminContext; error?: undefined }
> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { error: NextResponse.json({ error: 'Token gerekli' }, { status: 401 }) };
  }

  let decoded: { uid: string; email?: string; role?: string };
  try {
    decoded = (await getAdminAuth().verifyIdToken(token)) as typeof decoded;
  } catch {
    return { error: NextResponse.json({ error: 'Geçersiz token' }, { status: 401 }) };
  }

  const email = decoded.email ?? null;
  const allowSuperAdmin = options?.allowSuperAdmin ?? true;

  const userSnap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
  const userData = userSnap.exists ? (userSnap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string; roleTitle?: string | null }) : null;

  // Aktif kurum (client seçili) → id + kind. Öncelik:
  //   1) options.targetOrgId+targetKind (route açıkça geçtiyse)
  //   2) x-org-id + x-org-kind HTTP header'ları (client apiFetch otomatik ekler —
  //      27 route'un gövdesine dokunmadan aktif kurumu taşımanın tek noktalı yolu)
  //   3) eski options.targetNgoId (yalnız ngo)
  const KIND_MANAGED = { ngo: 'managedNgoId', brand: 'managedBrandId', club: 'managedClubId' } as const;
  const hdrKindRaw = req.headers.get('x-org-kind');
  const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
  const hdrOrgId = req.headers.get('x-org-id') || undefined;
  const activeKind: 'ngo' | 'brand' | 'club' | undefined =
    (options?.targetOrgId && options?.targetKind) ? options.targetKind
    : (hdrOrgId && hdrKind) ? hdrKind
    : undefined;
  const activeOrgId: string | undefined =
    (options?.targetOrgId && options?.targetKind) ? options.targetOrgId
    : activeKind ? hdrOrgId
    : options?.targetNgoId;

  // P0-4b: claim-only super-admin check (Firestore role-doc fallback removed).
  // NGO-admin still uses userData.managedNgoId since that's the scoped identity,
  // not a privilege check.
  const isSuperAdmin = decoded.role === 'super-admin';

  if (isSuperAdmin && allowSuperAdmin) {
    // Super-admin, herhangi bir NGO adına işlem yapabilir. ngoId çözüm sırası:
    // targetNgoId (client'ın hedeflediği) → kendi managedNgoId'si → boş string.
    // ÖNEMLİ: super-admin'in managedNgoId'si genelde null'dur; eskiden bu durumda
    // KOŞULSUZ 400 "targetNgoId gerekli" dönüyordu ve targetNgoId GÖNDERMEYEN rotalar
    // (volunteering approve/reject/attendees/checkins/broadcast, event broadcast)
    // super-admin için TAMAMEN kırılıyordu — bu rotalar zaten super-admin'i
    // ownership kontrolünden `!actor.isSuperAdmin && ...` ile muaf tutuyor, yani
    // boş ngoId onlar için sorun değil.
    const ngoId = activeOrgId ?? userData?.managedNgoId ?? '';
    // 400 SADECE ngoId'yi doküman anahtarı olarak kullanan rotalar için (ads/mail).
    // Bu rotalar server-auth.requireNgoAdmin'i DOĞRUDAN çağırır; varsayılan
    // requireNgoId=true olduğundan davranışları hiç değişmez (boş ngoId → 400,
    // .doc('') çağrısı engellenir). Volunteering/events rotaları ise
    // requireNgoAdminForRoute wrapper'ı ÜZERİNDEN requireNgoId=false geçer.
    const requireNgoId = options?.requireNgoId ?? true;
    if (!ngoId && requireNgoId) {
      return {
        error: NextResponse.json({ error: 'targetNgoId gerekli (super-admin için)' }, { status: 400 }),
      };
    }
    return { actor: { uid: decoded.uid, email, ngoId, isSuperAdmin: true, kind: activeKind ?? 'ngo' } };
  }

  // Non-super caller ngo-admin olmalı ve en az bir kurum yönetmeli (ngo/brand/club).
  const anyManaged = userData?.managedNgoId || userData?.managedBrandId || userData?.managedClubId;
  if (userData?.role !== 'ngo-admin' || !anyManaged) {
    return { error: NextResponse.json({ error: 'NGO admin yetkisi yok' }, { status: 403 }) };
  }

  // Rol-bazlı kısıtlama: dar başlıklı yetkili istenen modüle erişemez.
  if (options?.scope && !roleTitleHasScope(userData.roleTitle, options.scope)) {
    return { error: NextResponse.json({ error: 'Bu işlem için yetkiniz yok (rol kısıtlaması)' }, { status: 403 }) };
  }

  // Hedef kurum çözümü: aktif kurum verildiyse (client seçili) ÜYELİĞİ doğrula,
  // yoksa caller'ın ilk yönettiği kurum (ngo→brand→club, eski davranış).
  let resolvedKind: 'ngo' | 'brand' | 'club';
  let resolvedId: string;
  if (activeKind && activeOrgId) {
    const managedField = KIND_MANAGED[activeKind];
    if (userData[managedField] !== activeOrgId) {
      return { error: NextResponse.json({ error: 'Bu kuruluş için yetkiniz yok' }, { status: 403 }) };
    }
    resolvedKind = activeKind;
    resolvedId = activeOrgId;
  } else if (userData.managedNgoId) { resolvedKind = 'ngo'; resolvedId = userData.managedNgoId; }
  else if (userData.managedBrandId) { resolvedKind = 'brand'; resolvedId = userData.managedBrandId; }
  else { resolvedKind = 'club'; resolvedId = userData.managedClubId as string; }

  return { actor: { uid: decoded.uid, email, ngoId: resolvedId, isSuperAdmin: false, kind: resolvedKind } };
}
