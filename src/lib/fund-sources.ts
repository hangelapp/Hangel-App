/**
 * Fon & hibe tarama kaynakları (super-admin/funds → "Fon & Hibe Tara" → ayar).
 *
 * Bu liste, AI taramasının hangi kurum/portalları "kapsam" alacağını belirler.
 * Super-admin ayar (dişli) ikonundan düzenleyebilir; kalıcı liste Firestore'da
 * siteSettings/fundScanSources içinde { sources: FundSource[] } olarak tutulur.
 * Doc yoksa aşağıdaki 21 örnek varsayılan kullanılır.
 */

export interface FundSource {
  name: string;
  url: string;
  category: 'TR-Kamu' | 'TR-Vakıf' | 'AB/Uluslararası';
  enabled: boolean;
}

export const DEFAULT_FUND_SOURCES: FundSource[] = [
  // Türkiye — Kamu / resmi hibe kaynakları
  { name: 'TÜBİTAK', url: 'https://www.tubitak.gov.tr', category: 'TR-Kamu', enabled: true },
  { name: 'KOSGEB', url: 'https://www.kosgeb.gov.tr', category: 'TR-Kamu', enabled: true },
  { name: 'Sanayi ve Teknoloji Bakanlığı', url: 'https://www.sanayi.gov.tr', category: 'TR-Kamu', enabled: true },
  { name: 'Ticaret Bakanlığı', url: 'https://www.ticaret.gov.tr', category: 'TR-Kamu', enabled: true },
  { name: 'Tarım ve Kırsal Kalkınmayı Destekleme Kurumu (TKDK)', url: 'https://www.tkdk.gov.tr', category: 'TR-Kamu', enabled: true },
  { name: 'İŞKUR', url: 'https://www.iskur.gov.tr', category: 'TR-Kamu', enabled: true },
  { name: 'AB Başkanlığı', url: 'https://www.ab.gov.tr', category: 'TR-Kamu', enabled: true },
  { name: 'Merkezi Finans ve İhale Birimi (CFCU)', url: 'https://www.cfcu.gov.tr', category: 'TR-Kamu', enabled: true },
  { name: 'Türkiye Ulusal Ajansı (Erasmus+)', url: 'https://www.ua.gov.tr', category: 'TR-Kamu', enabled: true },

  // Türkiye — Vakıf / STK destek programları
  { name: 'Sivil Toplum için Destek Vakfı', url: 'https://www.siviltoplumdestek.org', category: 'TR-Vakıf', enabled: true },
  { name: 'Türkiye Üçüncü Sektör Vakfı (TÜSEV)', url: 'https://www.tusev.org.tr', category: 'TR-Vakıf', enabled: true },
  { name: 'Sabancı Vakfı', url: 'https://www.sabancivakfi.org', category: 'TR-Vakıf', enabled: true },
  { name: 'Vehbi Koç Vakfı', url: 'https://www.vkv.org.tr', category: 'TR-Vakıf', enabled: true },
  { name: 'Sivil Toplum Geliştirme Merkezi (STGM)', url: 'https://www.stgm.org.tr', category: 'TR-Vakıf', enabled: true },
  { name: 'Turkey Mozaik Foundation', url: 'https://www.turkeymozaik.org.uk', category: 'TR-Vakıf', enabled: true },
  { name: 'Açık Toplum Vakfı', url: 'https://www.aciktoplumvakfi.org.tr', category: 'TR-Vakıf', enabled: true },

  // AB / Uluslararası
  { name: 'AB Funding & Tenders Portal', url: 'https://ec.europa.eu/info/funding-tenders', category: 'AB/Uluslararası', enabled: true },
  { name: 'Ufuk Avrupa (Horizon Europe)', url: 'https://ufukavrupa.org.tr', category: 'AB/Uluslararası', enabled: true },
  { name: 'UNDP Türkiye', url: 'https://www.undp.org/turkiye', category: 'AB/Uluslararası', enabled: true },
  { name: 'GlobalGiving', url: 'https://www.globalgiving.org', category: 'AB/Uluslararası', enabled: true },
  { name: 'Avrupa Konseyi (Council of Europe)', url: 'https://www.coe.int', category: 'AB/Uluslararası', enabled: true },
];
