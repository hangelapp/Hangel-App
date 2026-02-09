
import type { Brand } from './types';

/**
 * Domain Headers: API'lerin domain doğrulaması için gerekli başlıklar.
 */
const DOMAIN_HEADERS = {
  'Origin': 'https://hangel.org',
  'Referer': 'https://hangel.org',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

/**
 * Marka isimlerini teknik ibarelerden ([CPS], Mobil vb.) temizler.
 */
const cleanBrandName = (name: string): string => {
  if (!name) return "Bilinmeyen Marka";
  return name
    .replace(/\[.*?\]/g, '') 
    .replace(/\(.*?\)/g, '') 
    .replace(/CPS|CPL|CPA|Mobil|Influencer|Offer|Kampanyası|Sale|Indirim|Online/gi, '') 
    .replace(/\s+/g, ' ') 
    .trim();
};

/**
 * Komisyon oranlarını güvenli bir şekilde sayıya dönüştürür.
 */
const parseRate = (rate: any): number => {
    if (!rate) return 0;
    if (typeof rate === 'number') return rate;
    const cleaned = String(rate).replace('%', '').replace(',', '.').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Üç ajansın verilerini sunucu tarafında çeker, birleştirir ve loglar.
 */
export async function fetchAllAgencyOffers(): Promise<Brand[]> {
  const agencies = [
    {
      name: 'Gelir Ortakları',
      url: 'https://feed.gelirortaklari.com/api/v1/search',
      key: '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3',
      method: 'POST',
      body: JSON.stringify({ "value": "" }),
      authHeader: 'x-api-key'
    },
    {
      name: 'Affocean',
      url: 'https://affocean.com/api/v1/offers',
      key: '9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48',
      method: 'GET',
      authHeader: 'Authorization'
    },
    {
      name: 'ReklamAction',
      url: 'https://api.reklamaction.com/v1/offer?network=reklamaction',
      key: '2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54',
      method: 'GET',
      authHeader: 'Authorization'
    }
  ];

  const results = await Promise.allSettled(
    agencies.map(async (agency) => {
      try {
        const headers: any = { ...DOMAIN_HEADERS };
        
        if (agency.authHeader === 'x-api-key') {
            headers['x-api-key'] = agency.key;
        } else {
            headers['Authorization'] = `Bearer ${agency.key}`;
        }

        const response = await fetch(agency.url, {
          method: agency.method,
          headers: headers,
          body: agency.body,
          cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`[Server] ${agency.name} Hata: ${response.status}`);
            return [];
        }

        const resData = await response.json();
        
        // Hiyerarşik veri taraması (Deep Scan)
        const rawList = resData.results || resData.data || resData.offers || (Array.isArray(resData) ? resData : []);

        if (!Array.isArray(rawList)) {
            return [];
        }

        const mapped = rawList.map((item: any) => ({
          id: `${agency.name.toLowerCase().replace(/\s/g, '-')}-${item.id || Math.random().toString(36).substr(2, 9)}`,
          name: cleanBrandName(item.advertiser_name || item.name || item.title),
          logoUrl: item.logo_url || item.logo || item.image || item.preview_url || "",
          donationRate: parseRate(item.commission_rate || item.payout || item.commission || 0),
          type: 'brand' as const,
          link: item.click_url || item.tracking_url || item.link || "#",
          agency: agency.name,
          category: item.category || "Genel"
        }));

        console.log(`[Server] ${agency.name} yakalanan marka sayısı: ${mapped.length}`);
        return mapped;
      } catch (err) {
        console.error(`[Server] ${agency.name} Bağlantı Hatası:`, err);
        return [];
      }
    })
  );

  const combined = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  
  // Marka ismine göre tekilleştir (En yüksek oranlıyı tut)
  const uniqueMap = new Map<string, Brand>();
  combined.forEach(brand => {
      const key = brand.name.toLowerCase().trim();
      const existing = uniqueMap.get(key);
      if (!existing || brand.donationRate > existing.donationRate) {
          uniqueMap.set(key, brand);
      }
  });

  return Array.from(uniqueMap.values());
}
