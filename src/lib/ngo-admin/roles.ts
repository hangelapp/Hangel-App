/**
 * STK / Marka / Kulüp panelinde atanabilir yetkili rolleri.
 * İstemci-güvenli (server-only import yok) — hem sayfa hem Admin SDK route'ları
 * aynı listeyi paylaşır.
 */
export const ORG_ROLE_OPTIONS = [
  'Genel Yönetici',
  'Finans Yöneticisi',
  'Gönüllü Yöneticisi',
  'Mini Blog Yöneticisi',
] as const;

export type OrgRole = (typeof ORG_ROLE_OPTIONS)[number];

/** Marka panelinde atanabilir yetkili rolleri. */
export const BRAND_ROLE_OPTIONS = [
  'Genel Yönetici',
  'Marka Yöneticisi',
  'Pazarlama Yöneticisi',
  'Finans Yöneticisi',
] as const;

export type BrandRole = (typeof BRAND_ROLE_OPTIONS)[number];

/**
 * Kulüp panelinde atanabilir yetkili rolleri.
 * 'Genel Yönetici' geriye uyumluluk için tutulur (eski kayıtlar). 'Kulüp Başkanı'
 * profil sayfasında "Başkan" olarak gösterilir; ikisi de kulüp doc'una adminUserId yazar.
 */
export const CLUB_ROLE_OPTIONS = [
  'Kulüp Başkanı',
  'Genel Yönetici',
  'Etkinlik Yöneticisi',
  'İçerik Yöneticisi',
  'Üye Yöneticisi',
] as const;

export type ClubRole = (typeof CLUB_ROLE_OPTIONS)[number];

/**
 * Kind → atanabilir rol listesi. Kanonik set-role route'u gönderilen rolü İSTEĞİN
 * kind'ine göre bu haritadan doğrular (her zaman NGO'ya göre değil). Süper-admin
 * /super-admin/users "Yetkilendir" + marka/kulüp panellerinin kullandığı roller
 * de bu listede yer alır ki geçerli atamalar BAD_ROLE ile reddedilmesin.
 */
export const ROLE_OPTIONS_BY_KIND = {
  ngo: ORG_ROLE_OPTIONS,
  brand: BRAND_ROLE_OPTIONS,
  club: CLUB_ROLE_OPTIONS,
} as const satisfies Record<'ngo' | 'brand' | 'club', readonly string[]>;

export function isValidOrgRole(role: unknown): role is OrgRole {
  return typeof role === 'string' && (ORG_ROLE_OPTIONS as readonly string[]).includes(role);
}

/** İstenen rolün, verilen kuruluş türü (kind) için geçerli olup olmadığını doğrular. */
export function isValidRoleForKind(kind: 'ngo' | 'brand' | 'club', role: unknown): boolean {
  return typeof role === 'string' && (ROLE_OPTIONS_BY_KIND[kind] as readonly string[]).includes(role);
}
