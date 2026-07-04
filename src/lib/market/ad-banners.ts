/**
 * Market Reklam Alanı sistemi — veri modeli + yerleşim mantığı + tohum (seed)
 * kreatifleri.
 *
 * hangel Market'te ürün şeritleri/grid'i arasına "her 5 satırda bir" reklam
 * banner'ı girer. Reklamlar Firestore'daki `marketAdBanners` koleksiyonundan
 * yönetilir (süper-admin → "Reklam Alanı Yönetimi"). Her reklam:
 *   - hangi SAYFA türlerinde görünür (placements: home/category/brand/store)
 *   - kaçıncı SATIR slotunda görünür (rowSlot: 5/10/15/20/25 …)
 *   - tarih aralığı (startAt/endAt) + aktif/pasif
 *   - kendi KURUMSAL KİMLİĞİ (design) — kod dışı görsel gerektirmeden CSS ile
 *   - tıklama/gösterim sayacı (clickCount/impressionCount) — ölçülebilir gelir
 *
 * Firestore doc alanları TOHUM kreatiflerdeki alanlarla birebir aynıdır; seed
 * script (scripts/seed-market-ads.ts) bu diziyi doğrudan yazabilir.
 */

export type AdPlacement = 'home' | 'category' | 'brand' | 'store';

export const AD_PLACEMENTS: { key: AdPlacement; label: string }[] = [
  { key: 'home', label: 'Market Ana Sayfa' },
  { key: 'category', label: 'Kategori Sayfaları' },
  { key: 'brand', label: 'Marka Sayfaları' },
  { key: 'store', label: 'Mağaza Sayfaları' },
];

/** Reklam banner'ının kurumsal-kimlik görsel yapılandırması (kod dışı görsel gerektirmez). */
export interface AdDesign {
  /** Arka plan — CSS `background` değeri (gradient/renk). Kurumsal kimliğe uygun. */
  bg: string;
  /** Ön plan metin rengi. */
  fg: string;
  /** Vurgu rengi (eyebrow/aksan). */
  accent: string;
  /** CTA buton arka planı. */
  ctaBg: string;
  /** CTA buton metin rengi. */
  ctaFg: string;
  /** Sağ tarafta gösterilecek büyük wordmark/emoji (opsiyonel görsel yerine). */
  logoText?: string;
  /** Opsiyonel arka plan görseli (varsa gradient üstüne biner). */
  imageUrl?: string;
}

export interface MarketAdBanner {
  id: string;
  /** İç yönetim adı (süper-admin listesinde görünür). */
  name: string;
  /** Küçük üst etiket (kicker). */
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaText: string;
  /** Tıklanınca gidilecek hedef (dahili `/...` yol ya da harici `https://`). */
  linkUrl: string;
  design: AdDesign;
  /** Hangi sayfa türlerinde görünür. */
  placements: AdPlacement[];
  /** Kaçıncı "satır"dan sonra girer (5, 10, 15, 20, 25 …). */
  rowSlot: number;
  /** Aynı slotta birden fazla varsa sıralama. */
  order: number;
  active: boolean;
  /** epoch ms — null/undefined ise sınırsız. */
  startAt?: number | null;
  endAt?: number | null;
  clickCount?: number;
  impressionCount?: number;
  createdAt?: number;
  updatedAt?: number;
  /** Yalnız bu kürasyon kategorilerinde göster (boş/undefined = tüm kategoriler). Kategori-hedefli. */
  targetCategories?: string[];
  /** Yalnız bu marka anahtarlarında göster (boş/undefined = tüm markalar). Marka-hedefli. */
  targetBrands?: string[];
}

/** Reklamın verilen bağlama (kategori/marka) uyup uymadığı. Hedef listesi boşsa herkese uyar. */
export function bannerMatchesContext(
  b: MarketAdBanner,
  ctx?: { category?: string | null; brand?: string | null },
): boolean {
  const cat = (ctx?.category || '').trim();
  const brand = (ctx?.brand || '').trim().toLowerCase();
  if (b.targetCategories && b.targetCategories.length > 0) {
    if (!cat || !b.targetCategories.some((c) => c.trim().toLowerCase() === cat.toLowerCase())) return false;
  }
  if (b.targetBrands && b.targetBrands.length > 0) {
    if (!brand || !b.targetBrands.some((x) => x.trim().toLowerCase() === brand)) return false;
  }
  return true;
}

/** Şeritler/grid arası: kaç satırda bir reklam girer. */
export const AD_ROW_INTERVAL = 5;

/** Bir banner şu an (now) yayında mı? aktif + tarih aralığı içinde. */
export function isBannerLive(b: MarketAdBanner, now: number): boolean {
  if (!b.active) return false;
  if (b.startAt && now < b.startAt) return false;
  if (b.endAt && now > b.endAt) return false;
  return true;
}

/**
 * Bir sayfa türü için yayındaki banner'ları slot sırasına göre döndürür.
 * Aynı rowSlot'ta birden fazla varsa `order` ile ayrışır; her slota tek banner
 * düşer (ilk uygun), döngüsel değil — 5 slot varsa 5 reklam.
 */
export function bannersForPlacement(
  banners: MarketAdBanner[],
  placement: AdPlacement,
  now: number,
): MarketAdBanner[] {
  return banners
    .filter((b) => isBannerLive(b, now) && b.placements.includes(placement))
    .sort((a, b) => a.rowSlot - b.rowSlot || a.order - b.order);
}

/**
 * Bir düğüm (row) dizisine banner'ları "her AD_ROW_INTERVAL satırda bir" serpiştirmek
 * için yerleşim planı üretir. Dönen dizi: her banner'ın hangi indeksten SONRA
 * girmesi gerektiği (rowSlot bazlı). Render tarafı bu plana göre araya sokar.
 */
export function planAdInsertions(
  banners: MarketAdBanner[],
  rowCount: number,
): { afterIndex: number; banner: MarketAdBanner }[] {
  const out: { afterIndex: number; banner: MarketAdBanner }[] = [];
  for (const b of banners) {
    // rowSlot 5 → 5. satırdan sonra (index 4'ten sonra). rowCount'u aşarsa sona ekle.
    const afterIndex = Math.min(b.rowSlot, rowCount) - 1;
    if (afterIndex < 0) continue;
    out.push({ afterIndex, banner: b });
  }
  return out.sort((a, b) => a.afterIndex - b.afterIndex);
}

// ────────────────────────────────────────────────────────────────────────────
// TOHUM KREATİFLER — her biri kendi kurumsal kimliğinde. Seed script bunları
// `marketAdBanners`'a yazar; süper-admin sonradan düzenler/yeni ekler.
// ────────────────────────────────────────────────────────────────────────────

export const SEED_MARKET_ADS: MarketAdBanner[] = [
  {
    id: 'hangel-gelir-modeli-konferans',
    name: 'Gelir Modeli Konferansları (hangel)',
    eyebrow: 'hangel ile büyü',
    title: 'Gelir Modeli Oluşturma Konferansları',
    subtitle: 'STK’ler için sürdürülebilir gelir modelleri — ücretsiz katıl, kaydını yaptır.',
    ctaText: 'Yerini ayır',
    linkUrl: '/events',
    design: {
      bg: 'linear-gradient(120deg, #ff4d6d 0%, #ff6b4a 55%, #ff8a3d 100%)',
      fg: '#ffffff',
      accent: '#ffe4e9',
      ctaBg: '#ffffff',
      ctaFg: '#e11d48',
      logoText: 'hangel',
    },
    placements: ['home', 'category', 'brand', 'store'],
    rowSlot: 5,
    order: 0,
    active: true,
    clickCount: 0,
    impressionCount: 0,
  },
  {
    id: 'iphone-17',
    name: 'iPhone 17 (Apple kimliği)',
    eyebrow: 'Yeni',
    title: 'iPhone 17',
    subtitle: 'Titanyum tasarım, A19 çip. Al, iyiliğe dönüştür.',
    ctaText: 'Keşfet',
    linkUrl: '/market/apple',
    design: {
      bg: 'linear-gradient(135deg, #1d1d1f 0%, #2b2b2f 60%, #3a3a3f 100%)',
      fg: '#f5f5f7',
      accent: '#a1a1a6',
      ctaBg: '#f5f5f7',
      ctaFg: '#1d1d1f',
      logoText: '',
    },
    placements: ['home', 'category', 'brand', 'store'],
    rowSlot: 10,
    order: 0,
    active: true,
    clickCount: 0,
    impressionCount: 0,
  },
  {
    id: 'ucuza-bilet',
    name: 'Ucuza Bilet (seyahat kimliği)',
    eyebrow: 'Uçak Bileti',
    title: 'Ucuza Bilet',
    subtitle: 'Yüzlerce rotada en uygun uçuşlar — ara, karşılaştır, iyiliğe uç.',
    ctaText: 'Bilet bul',
    linkUrl: '/market',
    design: {
      bg: 'linear-gradient(120deg, #0ea5e9 0%, #2563eb 60%, #1e40af 100%)',
      fg: '#ffffff',
      accent: '#bae6fd',
      ctaBg: '#ffffff',
      ctaFg: '#1d4ed8',
      logoText: '✈️',
    },
    placements: ['home', 'category', 'brand', 'store'],
    rowSlot: 15,
    order: 0,
    active: true,
    clickCount: 0,
    impressionCount: 0,
  },
  {
    id: 'an-otel',
    name: 'An Otel (otel kimliği)',
    eyebrow: 'Konaklama',
    title: 'An Otel',
    subtitle: 'Deniz manzaralı odalar, erken rezervasyon fırsatları — tatilin iyiliğe dönüşsün.',
    ctaText: 'Rezervasyon yap',
    linkUrl: '/market/kategori/Otel',
    design: {
      bg: 'linear-gradient(120deg, #0f766e 0%, #115e59 50%, #134e4a 100%)',
      fg: '#fffbeb',
      accent: '#fcd34d',
      ctaBg: '#fcd34d',
      ctaFg: '#134e4a',
      logoText: '🏨',
    },
    placements: ['home', 'category', 'brand', 'store'],
    rowSlot: 20,
    order: 0,
    active: true,
    clickCount: 0,
    impressionCount: 0,
  },
  {
    id: 'egaranti',
    name: 'egaranti (egaranti.com kimliği)',
    eyebrow: 'Dijital garanti',
    title: 'egaranti',
    subtitle: 'Tüm cihazlarının garantisi tek uygulamada. Kaydet, takip et, uzat.',
    ctaText: 'egaranti’yi keşfet',
    linkUrl: 'https://egaranti.com',
    design: {
      bg: 'linear-gradient(125deg, #4f46e5 0%, #6d28d9 55%, #7c3aed 100%)',
      fg: '#ffffff',
      accent: '#ddd6fe',
      ctaBg: '#ffffff',
      ctaFg: '#5b21b6',
      logoText: 'egaranti',
    },
    placements: ['home', 'category', 'brand', 'store'],
    rowSlot: 25,
    order: 0,
    active: true,
    clickCount: 0,
    impressionCount: 0,
  },
];
