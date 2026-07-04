/**
 * STORE_BRANDS — market'te görünürlüğü KENDİ affiliate onayına bağlı olan
 * MAĞAZA/marketplace/servis markaları (kendi envanterini satan satıcılar).
 *
 * Günlük otomatik senkron (/api/cron/affiliate-sync) YALNIZ bu listeyi yönetir:
 * onaylı offer'ı olmayan mağazayı market'ten geçici gizler, onay gelince geri açar.
 *
 * ⚠️ ÜRÜN MARKALARI (Samsung, Nike, Penti, Pierre Cardin…) BURAYA EKLENMEZ —
 * onlar onaylı çok-markalı mağazalarda (Teknosa, Boyner, MediaMarkt…) satılır ve
 * bağış üretmeye devam eder; gizlenirse o mağazalardaki ürünleri de kaybederiz.
 *
 * Liste elle düzenlenebilir; yeni bir MAĞAZA gelirse buraya eklenir.
 */
import { normBrandKey } from '@/lib/brand-normalize';

export const STORE_BRANDS: string[] = [
  // Pazaryeri / genel
  'A101', 'CarrefourSA', 'Pazarama', 'Getir', 'Getir Büyük', 'Banggood',
  // Çok-markalı perakende
  'Boyner', 'Boyner Now', 'Teknosa', 'MediaMarkt', 'Mudo', 'Özdilekteyim', 'MarkaStok',
  'Koçtaş', 'D&R', 'idefix', 'Doremusic', 'Intersport', 'FLO', 'Ayakkabı Dünyası',
  'Beymen', 'House of Superstep', 'SuperStep', 'Sporpark', 'Sporthink', 'Sportive',
  'Setur', 'Avansas', 'Toyzz Shop', 'Tonguç Mağaza',
  // Servis / seyahat / yeme-içme
  'Airalo', 'Compensair', 'Natro', 'Turhost', 'Etstur', 'Tatilbudur', 'Bilet.com',
  'Trip.com', 'Ucuzabilet', 'Touristica', 'Little Caesars', 'Kuaförümden', 'Sosyopix',
  'Konyalı Saat', 'Saat ve Saat', 'Hızlısaat', 'Tazeçiçek', 'Bloom and Fresh', 'Miyav', 'HavHav',
  // Kendi markalı mağaza (giyim/elektronik ÜRÜN markaları HARİÇ)
  'IKEA', 'Altınbaş', 'Yalıspor', 'MinyCenter', 'İlaçsız Yaşam', 'Vitaminler', 'Supplementler', 'Recete', 'Vitamin Box',
];

export const STORE_BRAND_KEYS: string[] = Array.from(new Set(STORE_BRANDS.map((s) => normBrandKey(s)).filter(Boolean)));
