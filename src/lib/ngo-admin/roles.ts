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

export function isValidOrgRole(role: unknown): role is OrgRole {
  return typeof role === 'string' && (ORG_ROLE_OPTIONS as readonly string[]).includes(role);
}
