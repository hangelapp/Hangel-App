
import type { Brand } from './types';

/**
 * Marka isimlerindeki teknik ibareleri (CPS, Mobil vb.) temizler.
 */
const cleanBrandName = (name: string): string => {
  if (!name) return "Bilinmeyen Marka";
  return name
    .replace(/\[.*?\]/g, '') 
    .replace(/\(.*?\)/g, '')
    .replace(/CPS|CPL|CPA|Mobil|Influencer|Offer|Kampanyası|Sale|İndirim|Online/gi, '') 
    .replace(/[\-\|]/g, '')
    .replace(/\s+/g, ' ') 
    .trim();
};

const parseRate = (rate: any): number => {
    if (!rate) return 0;
    if (typeof rate === 'number') return rate;
    const cleaned = String(rate).replace('%', '').replace(',', '.').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Proxy üzerinden tüm ajans verilerini çeker.
 */
export async function fetchAllAgencyOffers(): Promise<Brand[]> {
  const proxyUrl = '/api/proxy'; // Client-side check: this needs to be an absolute URL if called from server, but we call it from actions
  // IMPORTANT: Since this is likely called from a Server Action, we can keep the logic here or call our own API.
  // To ensure reliability in IDX, we use the server context directly here.

  const agencies = [
    {
      id: 'go',
      name: 'Gelir Ortakları',
      url: 'https://feed.gelirortaklari.com/api/v1/search',
      key: '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3',
      method: 'POST',
      body: { "value": "", "type": "all" },
      authHeader: 'x-api-key'
    },
    {
      id: 'ao',
      name: 'Affocean',
      url: 'https://affocean.com/api/v1/offers',
      key: '9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48',
      method: 'GET',
      authHeader: 'Authorization'
    },
    {
      id: 'ra',
      name: 'ReklamAction',
      url: 'https://api.reklamaction.com/v1/offers?network=reklamaction',
      key: '2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54',
      method: 'GET',
      authHeader: 'Authorization'
    }
  ];

  const results = await Promise.allSettled(
    agencies.map(async (agency) => {
      try {
        const headers: any = {
            'Content-Type': 'application/json',
            'Origin': 'https://hangel.org',
            'Referer': 'https://hangel.org'
        };

        if (agency.authHeader === 'x-api-key') {
            headers['x-api-key'] = agency.key;
            headers['api-key'] = agency.key; // Alternative
        } else {
            headers['Authorization'] = `Bearer ${agency.key}`;
        }

        const response = await fetch(agency.url, {
          method: agency.method,
          headers: headers,
          body: agency.method === 'POST' ? JSON.stringify(agency.body) : undefined,
          cache: 'no-store'
        });

        const text = await response.text();
        let resData;
        try {
            resData = JSON.parse(text);
        } catch (e) {
            console.error(`[Server] ${agency.name} JSON Parse Error`);
            return [];
        }

        const rawList = resData.results || resData.data || resData.offers || (Array.isArray(resData) ? resData : []);
        if (!Array.isArray(rawList)) return [];

        return rawList.map((item: any) => ({
          id: `${agency.id}-${item.id || Math.random().toString(36).substr(2, 9)}`,
          name: cleanBrandName(item.advertiser_name || item.name || item.title),
          logoUrl: item.logo_url || item.logo || item.image || item.preview_url || "",
          donationRate: parseRate(item.commission_rate || item.payout || item.commission || 0),
          type: 'brand' as const,
          link: item.click_url || item.tracking_url || item.link || "#",
          agency: agency.name,
          category: item.category || "Genel"
        }));
      } catch (err: any) {
        console.error(`[Server] ${agency.name} Error:`, err.message);
        return [];
      }
    })
  );

  let combined = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  
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
