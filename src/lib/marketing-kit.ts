// Tanıtım Araçları (marketing kit) — paylaşılan tipler ve kategori tanımları.
// Üç sayfada kullanılır: super-admin yönetim (/super-admin/marketing-kit),
// org panel indirme (/ngo-admin/marketing-kit — STK/marka/kulüp), ve kimliksiz
// erişilebilen konferans sunum sayfası (/tanitim). Tek kaynak burada tutulur.

export type MarketingCategory =
  | 'sunum'
  | 'sosyal-medya'
  | 'doner-kart'
  | 'magaza-ekipman'
  | 'kasa-a5'
  | 'orumcek-stand'
  | 'diger';

// 'hangel' = hangel'in kendi tanıtım kullanımı (konferans sunumu / kamuya açık tanıtım).
export type MarketingTargetKind = 'hangel' | 'ngo' | 'brand' | 'club';

// 'taslak' = yalnız super-admin görür; 'yayinda' = onaylandı, hedef panellerde görünür.
export type MarketingStatus = 'taslak' | 'yayinda';

export interface MarketingAsset {
  id: string;
  title: string;
  description?: string;
  category: MarketingCategory;
  fileUrl: string;
  storagePath: string;
  fileName: string;
  fileSize?: number;
  contentType?: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  targetKinds: MarketingTargetKind[];
  isPublic: boolean;
  // status === 'yayinda' && isPublic. Yazarken türetilir; Firestore kuralı
  // kimliksiz (konferans) okuma için yalnız buna bakar.
  publicListed: boolean;
  status: MarketingStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // Başlangıç paketinden içe aktarıldıysa — tekrar içe aktarımda mükerrer önlenir.
  seedKey?: string;
}

// hangel başlangıç paketi — public/marketing-kit/ altındaki hazır tasarımlar.
// Süper-admin "Başlangıç Paketi" butonu bunları TASLAK olarak içe aktarır;
// kullanıcı tek tek "Yayınla" ile onaylar. Dosyalar:
// scripts/marketing/generate-marketing-assets.mjs ile üretildi.
export interface MarketingStarterItem {
  seedKey: string;
  title: string;
  description: string;
  category: MarketingCategory;
  fileName: string;        // /marketing-kit/<fileName>
  contentType: string;
  thumbnailFile?: string;  // /marketing-kit/<thumbnailFile> (görsel olmayan dosyalar için)
  targetKinds: MarketingTargetKind[];
  isPublic: boolean;
}

export const MARKETING_ASSET_BASE = '/marketing-kit/';

export const MARKETING_STARTER_PACK: MarketingStarterItem[] = [
  {
    seedKey: 'hangel-kurumsal-sunum',
    title: 'hangel Kurumsal Tanıtım Sunumu',
    description: 'Konferans ve toplantılar için hazır PDF sunum: hangel nedir, nasıl çalışır, kimler için, etki ve çağrı.',
    category: 'sunum',
    fileName: 'hangel-kurumsal-sunum.pdf',
    contentType: 'application/pdf',
    thumbnailFile: 'hangel-kurumsal-sunum-kapak.png',
    targetKinds: ['hangel', 'ngo', 'brand', 'club'],
    isPublic: true,
  },
  {
    seedKey: 'sosyal-medya-takvimi-15gun',
    title: '15 Günlük Sosyal Medya İçerik Takvimi',
    description: 'STK, marka ve kulüpler için 15 günlük hazır gönderi planı (konu + örnek metin + hashtag).',
    category: 'sosyal-medya',
    fileName: 'sosyal-medya-takvimi-15gun.pdf',
    contentType: 'application/pdf',
    thumbnailFile: 'sosyal-medya-takvimi-15gun-kapak.png',
    targetKinds: ['ngo', 'brand', 'club'],
    isPublic: false,
  },
  {
    seedKey: 'sosyal-post-1',
    title: 'Sosyal Medya Postu — “her alışveriş bir iyilik”',
    description: 'Hazır 1080×1080 sosyal medya görseli.',
    category: 'sosyal-medya',
    fileName: 'sosyal-post-1.png',
    contentType: 'image/png',
    targetKinds: ['ngo', 'brand', 'club'],
    isPublic: false,
  },
  {
    seedKey: 'sosyal-post-2',
    title: 'Sosyal Medya Postu — “STK’na sürdürülebilir gelir”',
    description: 'Hazır 1080×1080 sosyal medya görseli.',
    category: 'sosyal-medya',
    fileName: 'sosyal-post-2.png',
    contentType: 'image/png',
    targetKinds: ['ngo', 'brand', 'club'],
    isPublic: false,
  },
  {
    seedKey: 'sosyal-post-3',
    title: 'Sosyal Medya Postu — “gönüllülüğünü hangel’le yönet”',
    description: 'Hazır 1080×1080 sosyal medya görseli.',
    category: 'sosyal-medya',
    fileName: 'sosyal-post-3.png',
    contentType: 'image/png',
    targetKinds: ['ngo', 'brand', 'club'],
    isPublic: false,
  },
  {
    seedKey: 'sosyal-post-4',
    title: 'Sosyal Medya Postu — “iyilik herkesin hakkı”',
    description: 'Hazır 1080×1080 sosyal medya görseli.',
    category: 'sosyal-medya',
    fileName: 'sosyal-post-4.png',
    contentType: 'image/png',
    targetKinds: ['ngo', 'brand', 'club'],
    isPublic: false,
  },
  {
    seedKey: 'doner-kart',
    title: 'Döner Kart / Masa Standı',
    description: 'İşletme masaları için QR’lı akrilik/masa standı görseli (10×15 cm).',
    category: 'doner-kart',
    fileName: 'doner-kart.png',
    contentType: 'image/png',
    targetKinds: ['ngo', 'brand', 'club'],
    isPublic: false,
  },
  {
    seedKey: 'magaza-poster',
    title: 'Mağaza İçi Tanıtım Posteri (A4)',
    description: '“Alışverişin iyiliğe dönüşsün” — mağaza içi QR’lı A4 poster.',
    category: 'magaza-ekipman',
    fileName: 'magaza-poster.png',
    contentType: 'image/png',
    targetKinds: ['ngo', 'brand', 'club'],
    isPublic: false,
  },
  {
    seedKey: 'kasa-a5',
    title: 'Kasa Önü A5 Kart',
    description: '“Kasada iyilik yap” — kasa önü QR’lı A5 bilgilendirme kartı.',
    category: 'kasa-a5',
    fileName: 'kasa-a5.png',
    contentType: 'image/png',
    targetKinds: ['ngo', 'brand', 'club'],
    isPublic: false,
  },
  {
    seedKey: 'orumcek-stand',
    title: 'Örümcek Stand (Roll-up) Görseli',
    description: 'Etkinlik ve fuarlar için 85×200 cm dikey roll-up / örümcek stand görseli.',
    category: 'orumcek-stand',
    fileName: 'orumcek-stand.png',
    contentType: 'image/png',
    targetKinds: ['ngo', 'brand', 'club'],
    isPublic: false,
  },
];

export const MARKETING_CATEGORIES: {
  value: MarketingCategory;
  label: string;
  description: string;
}[] = [
  { value: 'sunum', label: 'Profesyonel Sunum', description: 'Konferans ve toplantılar için hazır kurumsal sunum.' },
  { value: 'sosyal-medya', label: 'Sosyal Medya İçeriği (15 Günlük)', description: '15 günlük hazır sosyal medya gönderi seti.' },
  { value: 'doner-kart', label: 'Döner Kartlar', description: 'Masaüstü döner kart / akrilik stand görselleri.' },
  { value: 'magaza-ekipman', label: 'Mağaza İçi Ekipmanlar', description: 'Mağaza içi tanıtım ekipmanı görselleri.' },
  { value: 'kasa-a5', label: 'Kasa Önü A5 Kartlar', description: 'Kasa önü A5 bilgilendirme kartları.' },
  { value: 'orumcek-stand', label: 'Örümcek Stand Görseli', description: 'Roll-up / örümcek stand baskı görseli.' },
  { value: 'diger', label: 'Diğer Materyaller', description: 'Diğer tanıtım ve pazarlama materyalleri.' },
];

export const MARKETING_TARGET_KINDS: { value: MarketingTargetKind; label: string }[] = [
  { value: 'hangel', label: 'hangel' },
  { value: 'ngo', label: 'STK’lar' },
  { value: 'brand', label: 'Markalar' },
  { value: 'club', label: 'Kulüpler' },
];

export function categoryLabel(value: string): string {
  return MARKETING_CATEGORIES.find((c) => c.value === value)?.label ?? 'Diğer Materyaller';
}

export function targetKindLabel(value: string): string {
  return MARKETING_TARGET_KINDS.find((k) => k.value === value)?.label ?? value;
}

// Yükleme kısıtları (rules size/type doğrulamadığı için client tarafında uygulanır).
export const MARKETING_MAX_FILE_MB = 50;
export const MARKETING_FILE_ACCEPT = '.pdf,.ppt,.pptx,.key,.zip,image/*,video/mp4';
export const MARKETING_THUMB_ACCEPT = 'image/png,image/jpeg,image/webp';
