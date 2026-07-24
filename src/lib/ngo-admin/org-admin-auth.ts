/**
 * STK / Marka / Kulüp panel yetkili yönetimi için ortak Admin SDK yetki çözümleyici.
 * SUNUCU tarafı (firebase-admin import eder) — yalnız /api/ngo-admin/users/* route'larında.
 *
 * Çağıranın token'ından yönettiği kuruluşu (kind + id) ve "Genel Yönetici" olup
 * olmadığını çözer. Genel Yönetici = kuruluş sahibi (adminUserId) VEYA
 * {kind}RoleTitle == 'Genel Yönetici' VEYA super-admin.
 */
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

// Kurucu (founder) — rol claim'i oynak olsa bile her zaman super-admin sayılır
// (storage.rules + use-super-admin-permissions ile aynı e-posta).
export const FOUNDER_EMAIL = 'ismailhilmi@hangel.org';

export type OrgKind = 'ngo' | 'brand' | 'club';

export const KIND_TO_COL: Record<OrgKind, string> = {
  ngo: COLLECTIONS.ngos, brand: COLLECTIONS.brands, club: COLLECTIONS.clubs,
};
export const KIND_TO_MANAGED: Record<OrgKind, 'managedNgoId' | 'managedBrandId' | 'managedClubId'> = {
  ngo: 'managedNgoId', brand: 'managedBrandId', club: 'managedClubId',
};
export const KIND_TO_ROLE_TITLE: Record<OrgKind, 'ngoRoleTitle' | 'brandRoleTitle' | 'clubRoleTitle'> = {
  ngo: 'ngoRoleTitle', brand: 'brandRoleTitle', club: 'clubRoleTitle',
};
export const KIND_TO_INVITE_ID: Record<OrgKind, 'ngoId' | 'brandId' | 'clubId'> = {
  ngo: 'ngoId', brand: 'brandId', club: 'clubId',
};
export const KIND_TO_ACCUSATIVE: Record<OrgKind, string> = {
  ngo: "STK'yı", brand: 'markayı', club: 'öğrenci kulübünü',
};

export interface OrgAdminCtx {
  uid: string;
  isSuperAdmin: boolean;
  kind: OrgKind;
  orgId: string;
  orgName: string;
  ownerUserId: string | null;
  isGeneral: boolean; // ekleme / çıkarma / rol değiştirme yetkisi
}

export type OrgAdminResult = { ok: true; ctx: OrgAdminCtx } | { ok: false; error: string; status: number };

/**
 * @param override Aktif kuruluş seçicisinden gelen hedef (orgId + kind). Verilirse
 *   bu kuruluş bağlamı kullanılır (çoklu kurum yöneten kullanıcılar için kritik —
 *   yoksa hep caller'ın managed*Id'si dönerdi). Yetkilendirme: super-admin her
 *   kuruluş; aksi halde caller o kuruluşu yönetmeli (managed{kind}Id == orgId)
 *   veya sahibi olmalı.
 */
export async function resolveOrgAdminCtx(
  req: Request,
  override?: { orgId?: string | null; kind?: OrgKind | null },
): Promise<OrgAdminResult> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { ok: false, error: 'Token gerekli', status: 401 };

  let decoded: { uid: string; role?: string; email?: string };
  try {
    decoded = (await getAdminAuth().verifyIdToken(token)) as typeof decoded;
  } catch {
    return { ok: false, error: 'Geçersiz token', status: 401 };
  }

  const db = getAdminFirestore();
  const callerSnap = await db.collection(COLLECTIONS.users).doc(decoded.uid).get();
  if (!callerSnap.exists) return { ok: false, error: 'Kullanıcı bulunamadı', status: 404 };
  const c = callerSnap.data() as Record<string, unknown>;
  const isFounder = (decoded.email || '').toLowerCase() === FOUNDER_EMAIL;
  const isSuperAdmin = decoded.role === 'super-admin' || c.role === 'super-admin' || isFounder;

  // Aktif kuruluş çözümleme önceliği:
  //  1) Açık override (route'un body/query'den geçtiği orgId+kind)
  //  2) x-org-id / x-org-kind header'ları (client withEntityHeaders ile yollar —
  //     ÜST SWITCHER'daki aktif kurum; çoklu kurum yöneten kullanıcı için KRİTİK)
  //  3) caller'ın tek managed*Id'si (fallback — tek kurum yönetenler)
  const hdrId = (req.headers.get('x-org-id') || '').trim() || null;
  const hdrKindRaw = (req.headers.get('x-org-kind') || '').trim().toLowerCase();
  const hdrKind = (['ngo', 'brand', 'club'] as const).includes(hdrKindRaw as OrgKind) ? (hdrKindRaw as OrgKind) : null;

  let kind: OrgKind | null = null;
  let orgId: string | null = null;
  const validKind = override?.kind && (['ngo', 'brand', 'club'] as const).includes(override.kind);
  // Açık override VEYA header ile hedef gelmişse "explicit" sayılır → yetki doğrulaması yapılır.
  const explicitTarget = Boolean((override?.orgId && validKind) || (hdrId && hdrKind));
  if (override?.orgId && validKind) {
    kind = override.kind as OrgKind;
    orgId = override.orgId;
  } else if (hdrId && hdrKind) {
    kind = hdrKind;
    orgId = hdrId;
  } else {
    // Hiçbir hedef yoksa caller'ın tek yönettiği kuruluş.
    if (c.managedNgoId) { kind = 'ngo'; orgId = c.managedNgoId as string; }
    else if (c.managedBrandId) { kind = 'brand'; orgId = c.managedBrandId as string; }
    else if (c.managedClubId) { kind = 'club'; orgId = c.managedClubId as string; }
  }

  if (!kind || !orgId) return { ok: false, error: 'Yönetilen kuruluş bulunamadı', status: 403 };

  const orgSnap = await db.collection(KIND_TO_COL[kind]).doc(orgId).get();
  if (!orgSnap.exists) return { ok: false, error: 'Kuruluş bulunamadı', status: 404 };
  const o = orgSnap.data() as { name?: string; adminUserId?: string };
  const ownerUserId = o.adminUserId ?? null;
  const managedThisOrg = c[KIND_TO_MANAGED[kind]] === orgId;

  // Açık hedef (override VEYA header) verildiyse non-super caller'ın o kuruluşu
  // gerçekten yönetebildiğini doğrula (managed{kind}Id == orgId ya da sahibi).
  // Böylece başka kurumun id'sini header'a koyup yetkisiz erişim yapılamaz.
  if (explicitTarget && !isSuperAdmin && !managedThisOrg && ownerUserId !== decoded.uid) {
    return { ok: false, error: 'Bu kuruluş için yetkiniz yok', status: 403 };
  }

  const roleTitle = c[KIND_TO_ROLE_TITLE[kind]] as string | undefined;
  const isGeneral = isSuperAdmin || (ownerUserId !== null && ownerUserId === decoded.uid) || roleTitle === 'Genel Yönetici';

  return {
    ok: true,
    ctx: { uid: decoded.uid, isSuperAdmin, kind, orgId, orgName: o.name || 'Kuruluş', ownerUserId, isGeneral },
  };
}
