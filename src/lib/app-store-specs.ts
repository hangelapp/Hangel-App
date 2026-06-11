/**
 * src/lib/app-store-specs.ts
 *
 * Tüm app store platformları için ekran görüntüsü boyut spec'leri, brand
 * brief'i ve özellik (feature) prompt template'leri. Süper-admin'in
 * /super-admin/app-stores panelinde AI ile mağaza görseli üretirken kullanılır.
 *
 * Boyutlar her mağazanın resmi kriterlerine göre. Apple Marketing Guidelines
 * + Google Play Asset Guidelines + Huawei AppGallery + Microsoft Store +
 * Chrome Web Store dökümanlarından derlendi (2026).
 */

export type PlatformKey =
  | 'app-store'
  | 'google-play'
  | 'app-gallery'
  | 'apple-watch'
  | 'mac-app'
  | 'apple-vision'
  | 'microsoft-store'
  | 'chrome-web-store';

export interface DeviceSpec {
  /** Kullanıcıya gösterilen cihaz adı (örn. '6.7" iPhone'). */
  device: string;
  /** Pixel cinsinden genişlik (portrait için kısa kenar). */
  w: number;
  /** Pixel cinsinden yükseklik. */
  h: number;
  /** Store tarafından zorunlu mu (en az 1 görsel istiyor). */
  required?: boolean;
  /** Açıklama / kısa not. */
  note?: string;
}

export interface PlatformMeta {
  key: PlatformKey;
  label: string;
  /** Marka tonu — AI prompt'una eklenir. */
  vibe: string;
  /** Cihaz boyut listesi. */
  devices: DeviceSpec[];
  /** Maks. kaç ekran görüntüsü kabul edilir (genel). */
  maxScreenshots: number;
}

export const PLATFORMS: readonly PlatformMeta[] = [
  {
    key: 'app-store',
    label: 'App Store (iOS)',
    vibe: 'Apple Marketing Guidelines: clean, premium, San Francisco font, beyaz/açık gri arka plan, çok az gölge, single CTA odaklı, soyut çevresel illüstrasyonlar + UI mockup karışımı.',
    maxScreenshots: 10,
    devices: [
      { device: '6.7" iPhone (Pro Max)', w: 1290, h: 2796, required: true, note: 'iPhone 14/15/16 Pro Max — zorunlu' },
      { device: '6.5" iPhone',           w: 1242, h: 2688, note: 'iPhone XS Max / 11 Pro Max' },
      { device: '5.5" iPhone',           w: 1242, h: 2208, note: 'iPhone 6+/7+/8+' },
      { device: '12.9" iPad Pro (6th)',  w: 2048, h: 2732, required: true },
      { device: '12.9" iPad Pro (M4)',   w: 2064, h: 2752 },
      { device: '11" iPad Pro',          w: 1668, h: 2388 },
    ],
  },
  {
    key: 'google-play',
    label: 'Google Play (Android)',
    vibe: 'Material You / Material 3: dynamic color, soft rounded corners, expressive typography, light + dark mode mockup karışımı.',
    maxScreenshots: 8,
    devices: [
      { device: 'Telefon',          w: 1080, h: 1920, required: true, note: '16:9 portrait önerilir' },
      { device: '7-inch tablet',    w: 1080, h: 1920 },
      { device: '10-inch tablet',   w: 2160, h: 3840 },
      { device: 'Feature graphic',  w: 1024, h: 500, required: true, note: 'Play Store listing üst banner' },
    ],
  },
  {
    key: 'app-gallery',
    label: 'AppGallery (Huawei)',
    vibe: 'Huawei EMUI tone: bold mavi-mor gradient, geometric shapes, glossy device frames.',
    maxScreenshots: 5,
    devices: [
      { device: 'Telefon',  w: 1080, h: 1920, required: true },
      { device: 'Tablet',   w: 1200, h: 1920 },
    ],
  },
  {
    key: 'apple-watch',
    label: 'Apple Watch',
    vibe: 'watchOS tone: koyu siyah arka plan, neon canlı renkler, complications mockup, kavisli ekran frame.',
    maxScreenshots: 10,
    devices: [
      { device: 'Watch Ultra (49mm)',   w: 410, h: 502, required: true },
      { device: 'Watch Series 9 (45mm)', w: 396, h: 484 },
      { device: 'Watch SE (40mm)',       w: 368, h: 448 },
    ],
  },
  {
    key: 'mac-app',
    label: 'Mac App Store',
    vibe: 'macOS Sonoma/Sequoia tone: window chrome, sidebar layout, Catalyst veya AppKit görünümü, geniş workspace mockup.',
    maxScreenshots: 10,
    devices: [
      { device: 'MacBook 13" (Retina)',  w: 2880, h: 1800, required: true },
      { device: 'MacBook 16"',           w: 1280, h: 800 },
      { device: 'iMac 5K',               w: 2560, h: 1600 },
    ],
  },
  {
    key: 'apple-vision',
    label: 'Apple Vision Pro',
    vibe: 'visionOS uzamsal tone: glass material, floating windows, depth + parallax, immersive 3D çevre.',
    maxScreenshots: 10,
    devices: [
      { device: 'Vision Pro',  w: 3840, h: 2160, required: true, note: 'visionOS 4K' },
    ],
  },
  {
    key: 'microsoft-store',
    label: 'Microsoft Store (Windows)',
    vibe: 'Fluent Design: mica material, acrylic blur, light + dark mode, geometric accent shapes.',
    maxScreenshots: 9,
    devices: [
      { device: 'Portrait',   w: 1080, h: 1920, required: true },
      { device: 'Landscape',  w: 1920, h: 1080 },
      { device: 'Square',     w: 2400, h: 2400 },
      { device: 'Promo 4K',   w: 3840, h: 2160 },
    ],
  },
  {
    key: 'chrome-web-store',
    label: 'Chrome Web Store (Eklenti)',
    vibe: 'Material 3 + Google brand: white space, accent #f34723, çoklu STK logosu carousel, bağış banner mockup.',
    maxScreenshots: 5,
    devices: [
      { device: 'Small tile',      w: 440, h: 280, required: true },
      { device: 'Large tile',      w: 920, h: 680 },
      { device: 'Marquee',         w: 1400, h: 560 },
      { device: 'Screenshot',      w: 1280, h: 800 },
    ],
  },
] as const;

export type FeatureKey = 'bagis' | 'imece' | 'kan-bagisi' | 'ngo-admin' | 'kasa' | 'genel';

export interface FeatureMeta {
  key: FeatureKey;
  label: string;
  /** Default prompt — AI üretiminde başlangıç noktası. */
  defaultPrompt: string;
}

export const FEATURES: readonly FeatureMeta[] = [
  {
    key: 'bagis',
    label: 'Bağış (Market)',
    defaultPrompt:
      'hangel uygulamasında bağış akışını gösteren phone mockup. Ekranda markalar carousel (Migros, Trendyol, n11 yan yana), her birinin altında "%5 bağış" rozeti. Üstte büyük başlık "Alışverişi iyiliğe dönüştür". CTA: "Markayı seç" turuncu button. Arka plan: çok soft turuncu gradient (#fff4f0). Hangel turuncu (#f34723) accent renk.',
  },
  {
    key: 'imece',
    label: 'İmece (Gönüllülük)',
    defaultPrompt:
      'hangel imece (gönüllülük) ekranı mockup. Türkiye haritasında 3-5 turuncu pin, her birinde "Saatini bağışla" overlay. Alt kısımda kart: "Eğitim — Yarın 14:00 — Kadıköy STK". CTA: "Başvuru yap". Pozitif community vibe, gerçek insanlar değil — abstract figür silüetleri.',
  },
  {
    key: 'kan-bagisi',
    label: 'Kan Bağışı',
    defaultPrompt:
      'hangel kan bağışı ekranı mockup. Kırmızı kan damlası emoji + "En yakın hastane" başlığı. Liste: 3 hastane (Acıbadem, Memorial, vs.) — her birinde "ACİL" red badge ve mesafe (1.2 km). Harita preview küçük. CTA: "Randevu al". Renk paleti: hangel turuncu + acil kırmızı + beyaz.',
  },
  {
    key: 'ngo-admin',
    label: 'STK Yönetim Paneli',
    defaultPrompt:
      'hangel STK admin dashboard mockup. Üstte 3 KPI kart: "Bu ay bağış: ₺12.450" (turuncu), "Gönüllü: 23" (mavi), "Etkinlik: 4" (yeşil). Altta line chart (bağış trendi) + son hareketler listesi. Sidebar: Anasayfa, Bağışlar, Gönüllüler, Etkinlikler, Kasa. Sade ve professional.',
  },
  {
    key: 'kasa',
    label: 'STK Kasa / Finansal Şeffaflık',
    defaultPrompt:
      'hangel STK kasa (treasury) ekranı mockup. Üstte büyük "Toplam bakiye: ₺156.230" + giriş/çıkış. Aşağıda son işlemler tablosu: "Ahmet → ₺250 bağış", "Etkinlik gideri → -₺850". Şeffaflık vurgusu: "Tüm kayıtlar blockchain-anchored" mini rozet. Renk: hangel turuncu + güven yeşili.',
  },
  {
    key: 'genel',
    label: 'Genel (Tanıtım)',
    defaultPrompt:
      'hangel uygulaması genel tanıtım poster. Merkezde büyük "hangel" logosu (turuncu), etrafında 4 özellik ikonu: kalp (bağış), eller (imece), kan damlası (kan bağışı), STK çatısı (yönetim). Slogan: "Tek uygulama, dört iyilik". Modern abstract grafik, %30 white space.',
  },
] as const;

export const BRAND_BRIEF = `
hangel — Türkiye merkezli sosyal etki platformu. Kullanıcılar alışverişlerini
bağışa, zamanlarını gönüllülüğe (imece), kanlarını ihtiyaca dönüştürür; STK'lar
şeffaf yönetim aracı kullanır.

MARKA KİMLİĞİ:
- Primary renk: #f34723 (hangel turuncu — sıcak, enerjik, güvenilir)
- Secondary: beyaz #ffffff, açık gri #f5f5f7
- Aksan: #042654 (lacivert, kurumsal başlıklar)
- Tipografi: SF Pro Display (Apple), Roboto Flex (Android), Inter (web)
- Tone: modern, premium, optimist, sade. Tipik Türk STK görseli (kırmızı +
  Atatürk büstü vb.) DEĞİL. Apple/Stripe/Linear estetiği tercih edilir.

ZORUNLU KURALLAR (prompt'lara her zaman eklenecek):
- Görsel TAMAMEN Türkçe metin içerebilir; İngilizce text yok.
- Stock photo görünümlü insan yüzleri yok — abstract figür/silüet kullan.
- Resim içinde gerçek STK adı yazmayalım (jenerik "Eğitim STK", "Sağlık STK").
- "#wearehangel" hashtag'i çok küçük olarak alt köşede olabilir, opsiyonel.
- Apple Marketing Guidelines / Material Design ihlali olmasın
  (yanlış logolar, taklit ikonlar, yanlış sistem font kullanımı yok).
`.trim();

/**
 * Storage path helper — `appStoreAssets/{platform}/{slug}-{device}.png` formatında.
 */
export function buildStoragePath(platform: PlatformKey, slug: string): string {
  return `appStoreAssets/${platform}/${slug}.png`;
}
