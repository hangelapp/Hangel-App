/**
 * Kanonik ürün kütüphanesi (PIM) — tüm kaynaklardan (GelirOrtakları Go Feed,
 * ileride ikas/ideasoft/tsoft, direkt XML/CSV) gelen ürünler bu tek şemaya
 * normalize edilir. Hem hangel Market'te ürün listeleme, hem ileride başka
 * platformlara (Google Merchant/Cimri/Akakçe) export bu şema üzerinden yapılır.
 */

// Bir markanın hangel'da nasıl listeleneceği:
//  - 'brand'   : sadece marka kartı (mevcut/varsayılan davranış)
//  - 'product' : sadece ürün bazlı (feed'inden ürünler)
//  - 'both'    : hem marka kartı hem ürünleri
export type ListingMode = 'brand' | 'product' | 'both';

export const DEFAULT_LISTING_MODE: ListingMode = 'brand';

export const LISTING_MODE_LABELS: Record<ListingMode, string> = {
  brand: 'Sadece marka',
  product: 'Sadece ürün',
  both: 'Marka + ürün',
};

// Bir kaynaktan gelen ürün feed'i (marka düzeyi metadata).
export interface ProductFeed {
  source: string;   // 'gelirortaklari' | 'ikas' | ...
  feedId: string;
  offerId: string;
  name: string;     // marka adı (feed adı)
  type: string;     // 'google' | 'akakce' | ...
}

// Normalize edilmiş tek ürün.
export interface CanonicalProduct {
  id: string;             // global benzersiz: `${source}-${feedId}-${externalId}`
  source: string;         // hangi ağ/platform
  feedId: string;
  offerId: string;
  brandId?: string | null;// hangel brands koleksiyonundaki id (bağlandıysa)
  brandName: string;      // MAĞAZA (satıcı) adı — feed/offer adı (Media Markt, Sportive...)
  // Ürünün MARKASI (Nike/Apple/Ülker) — başlıktan/mağaza adından çıkarılır
  // (src/lib/market/brand-extract). Mağazadan bağımsız; /market/brand/<key> profili.
  productBrand?: string | null;
  productBrandKey?: string | null; // normalize anahtar (marka sorgusu/route için)
  externalId: string;     // feed içindeki ürün id
  title: string;
  description?: string;
  price: number;          // sayısal (ana fiyat)
  salePrice?: number | null;
  currency: string;       // 'TRY'
  imageLink?: string;
  additionalImages?: string[];
  productUrl: string;     // affiliate-tracked link (komisyon dahil)
  category?: string;
  availability?: string;  // 'in stock'
  gtin?: string;
  mpn?: string;
  donationRate?: number;  // bağışa giden %
  random?: number;        // 0..1 — market'te rastgele sıralama (orderBy random + startAt)
  searchTokens?: string[];// arama token'ları (başlık+marka+kategori) — array-contains-any
  sellerCount?: number;   // aynı ürünü (GTIN/MPN) satan farklı MAĞAZA sayısı — toplu iş stamp'ler
  sellerBestRate?: number;// bu ürünü satan mağazalar arasındaki EN YÜKSEK bağış oranı (%)
  priceHistory?: { p: number; t: number }[]; // son ~30 fiyat noktası (ingest'te eklenir) — {p: fiyat, t: epoch ms}
  lowest30d?: number;     // son 30 gündeki EN DÜŞÜK fiyat (ingest hesaplar) — "30 günün en düşüğü" rozeti
  updatedAt: number;      // epoch ms (ingest zamanı)
}
