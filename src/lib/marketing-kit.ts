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

export type MarketingTargetKind = 'ngo' | 'brand' | 'club';

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
}

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
