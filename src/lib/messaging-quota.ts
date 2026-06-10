/**
 * SMS/Mail ADET-bazlı kota sistemi — paylaşılan tipler + varsayılan paketler + helper.
 *
 * Model (yeni koleksiyon/deploy gerektirmez, mevcut kurallı koleksiyonları kullanır):
 *  - Toplu havuz: siteSettings/messagingBulkPool  → süper-admin'in satın aldığı bayilik
 *    SMS/mail adetleri. { smsTotal, smsUsed, mailTotal, mailUsed }. (public read, super-admin write)
 *  - NGO kotası: ngoMessagingWallets/{ngoId}      → { smsQuota, smsUsed, mailQuota, mailUsed }
 *    (owner + super-admin read, Admin SDK write). Kalan = quota - used.
 *  - Paketler: messagingPackages (kind:'unit')    → { name, iconKey, smsUnits, mailUnits, priceTRY, active, order }
 *    (signed-in read, Admin SDK write). STK paketi seçip N-Kolay POS'tan öder; ödeme
 *    onayında kota havuzdan düşülerek NGO'ya işlenir.
 *
 * Saf TS — hem client hem Admin SDK route'ları import eder.
 */

export interface MessagingPool {
  smsTotal: number;
  smsUsed: number;
  mailTotal: number;
  mailUsed: number;
}

export interface NgoQuota {
  smsQuota: number;
  smsUsed: number;
  mailQuota: number;
  mailUsed: number;
}

export interface UnitPackage {
  id: string;
  name: string;
  iconKey: 'starter' | 'community' | 'active' | 'corporate';
  smsUnits: number;
  mailUnits: number;
  priceTRY: number;
  active: boolean;
  order: number;
}

/** 4 varsayılan paket — en yaygın kullanım alışkanlıklarına göre. Fiyatlar süper-admin'den düzenlenir. */
export const DEFAULT_UNIT_PACKAGES: UnitPackage[] = [
  { id: 'pkg-starter',   name: 'Başlangıç', iconKey: 'starter',   smsUnits: 500,  mailUnits: 500,  priceTRY: 250,  active: true, order: 1 },
  { id: 'pkg-community', name: 'Topluluk',  iconKey: 'community', smsUnits: 1000, mailUnits: 1000, priceTRY: 450,  active: true, order: 2 },
  { id: 'pkg-active',    name: 'Etkin',     iconKey: 'active',    smsUnits: 1000, mailUnits: 5000, priceTRY: 750,  active: true, order: 3 },
  { id: 'pkg-corporate', name: 'Kurumsal',  iconKey: 'corporate', smsUnits: 5000, mailUnits: 5000, priceTRY: 1500, active: true, order: 4 },
];

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export function normalizePool(raw?: Partial<MessagingPool> | null): MessagingPool {
  return {
    smsTotal: num(raw?.smsTotal), smsUsed: num(raw?.smsUsed),
    mailTotal: num(raw?.mailTotal), mailUsed: num(raw?.mailUsed),
  };
}

export function normalizeQuota(raw?: Partial<NgoQuota> | null): NgoQuota {
  return {
    smsQuota: num(raw?.smsQuota), smsUsed: num(raw?.smsUsed),
    mailQuota: num(raw?.mailQuota), mailUsed: num(raw?.mailUsed),
  };
}

export const poolRemaining = (p: MessagingPool) => ({
  sms: Math.max(0, p.smsTotal - p.smsUsed),
  mail: Math.max(0, p.mailTotal - p.mailUsed),
});

export const quotaRemaining = (q: NgoQuota) => ({
  sms: Math.max(0, q.smsQuota - q.smsUsed),
  mail: Math.max(0, q.mailQuota - q.mailUsed),
});

export function normalizePackage(id: string, raw: Record<string, unknown>): UnitPackage {
  const validIcon = ['starter', 'community', 'active', 'corporate'];
  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : id,
    iconKey: validIcon.includes(raw.iconKey as string) ? (raw.iconKey as UnitPackage['iconKey']) : 'community',
    smsUnits: num(raw.smsUnits),
    mailUnits: num(raw.mailUnits),
    priceTRY: num(raw.priceTRY),
    active: raw.active !== false,
    order: num(raw.order),
  };
}
