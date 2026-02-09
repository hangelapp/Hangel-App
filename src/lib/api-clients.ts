import type { Brand } from './types';

const DOMAIN_HEADERS = {
  'Origin': 'https://hangel.org',
  'Referer': 'https://hangel.org',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

/**
 * Marka isimlerini teknik ibarelerden ve gereksiz eklerden temizler.
 */
const cleanBrandName = (name: string): string => {
  if (!name) return "Bilinmeyen Marka";
  return name
    .replace(/\[.*?\]/g, '') // [CPS], [CPL] gibi yapıları siler
    .replace(/\(.*?\)/g, '') // Parantez içindeki ekleri siler
    .replace(/CPS|CPL|CPA|Mobil|Influencer|Offer|Kampanyası|Sale|Indirim|Online/gi, '') // Teknik kelimeleri siler
    .replace(/\s+/g, ' ') // Fazla boşlukları temizler
    .replace(/-$/, '') // Sondaki tireleri temizler
    .trim();
};

/**
 * Komisyon oranlarını sayısal formata dönüştürür.
 */
const parseRate = (rate: any): number => {
    if (!rate) return 0;
    if (typeof rate === 'number') return rate;
    const cleaned = String(rate).replace('%', '').replace(',', '.').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Üç farklı ajansın verilerini çeker, standardize eder ve birleştirir.
 */
export async function fetchAllAgencyOffers(): Promise<Brand[]> {
  const agencies = [
    {
      name: 'Gelir Ortakları',
      url: 'https://feed.gelirortaklari.com/api/v1/search',
      key: '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3',
      method: 'POST',
      body: JSON.stringify({ "value": "" }),
      authType: 'x-api-key'
    },
    {
      name: 'Affocean',
      url: 'https://affocean.com/api/v1/offers',
      key: '9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48',
      method: 'GET',
      authType: 'bearer'
    },
    {
      name: 'ReklamAction',
      url: 'https://api.reklamaction.com/v1/offer?network=reklamaction',
      key: '2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54',
      method: 'GET',
      authType: 'bearer'
    }
  ];

  const results = await Promise.allSettled(
    agencies.map(async (agency) => {
      try {
        const headers: any = { ...DOMAIN_HEADERS };
        
        if (agency.authType === 'x-api-key') {
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
            console.error(`[Server] ${agency.name} Hatası:`, response.status);
            return [];
        }

        const resData = await response.json();
        
        // Farklı JSON hiyerarşilerinde veriyi ara
        const rawList = resData.results || resData.data || resData.offers || (Array.isArray(resData) ? resData : []);

        if (!Array.isArray(rawList)) {
            console.error(`[Server] ${agency.name} geçersiz veri formatı döndürdü.`);
            return [];
        }

        return rawList.map((item: any) => ({
          id: `${agency.name.toLowerCase().replace(' ', '-')}-${item.id || Math.random().toString(36).substr(2, 9)}`,
          name: cleanBrandName(item.name || item.advertiser_name || item.title),
          logoUrl: item.logo_url || item.image || item.preview_url || item.logo || "",
          donationRate: parseRate(item.commission_rate || item.payout || item.commission || 0),
          type: 'brand' as const,
          link: item.click_url || item.tracking_url || item.link || "#",
          followers: Math.floor(Math.random() * 5000) + 1000,
          agency: agency.name,
          category: item.category || "Genel"
        }));
      } catch (err) {
        console.error(`[Server] ${agency.name} Bağlantı Hatası:`, err);
        return [];
      }
    })
  );

  const combined = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  
  // Marka ismine göre tekilleştir (Aynı marka varsa en yüksek oranlıyı tut)
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
