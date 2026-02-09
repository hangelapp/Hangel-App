import type { Brand } from './types';

/**
 * Marka isimlerindeki teknik ibareleri ([CPS], [CPL], Mobil, Influencer vb.) temizler.
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
 * Real Fallback Data: If APIs return empty, show these real brands from the user's list.
 */
const fallbackBrands: Brand[] = [
  {
    id: 'fallback-converse',
    name: 'Converse',
    logoUrl: 'https://logo.clearbit.com/converse.com',
    donationRate: 7,
    type: 'brand',
    agency: 'Affocean (Geçici Veri)',
    category: 'Ayakkabı',
    link: 'https://www.converse.com.tr'
  },
  {
    id: 'fallback-teknosa',
    name: 'Teknosa',
    logoUrl: 'https://logo.clearbit.com/teknosa.com',
    donationRate: 2,
    type: 'brand',
    agency: 'ReklamAction (Geçici Veri)',
    category: 'Elektronik',
    link: 'https://www.teknosa.com'
  },
  {
    id: 'fallback-ebebek',
    name: 'Ebebek',
    logoUrl: 'https://logo.clearbit.com/ebebek.com',
    donationRate: 5,
    type: 'brand',
    agency: 'Affocean (Geçici Veri)',
    category: 'Anne & Bebek',
    link: 'https://www.e-bebek.com'
  }
];

/**
 * Main Data Engine: Fetches and unifies data from 3 agencies.
 */
export async function fetchAllAgencyOffers(): Promise<Brand[]> {
  const agencies = [
    {
      id: 'go',
      name: 'Gelir Ortakları',
      url: 'https://feed.gelirortaklari.com/api/v1/search',
      key: '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3',
      method: 'POST',
      body: { "value": "", "type": "all" }, // REQUIRED TYPE PARAMETER
      headers: { 'x-api-key': '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3' }
    },
    {
      id: 'ao',
      name: 'Affocean',
      url: 'https://affocean.com/api/v1/offers',
      key: '9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48',
      method: 'GET',
      headers: { 'Authorization': 'Bearer 9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48' }
    },
    {
      id: 'ra',
      name: 'ReklamAction',
      url: 'https://api.reklamaction.com/v1/offers?network=reklamaction',
      key: '2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54',
      method: 'GET',
      headers: { 'Authorization': 'Bearer 2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54' }
    }
  ];

  const results = await Promise.allSettled(
    agencies.map(async (agency) => {
      try {
        const response = await fetch(agency.url, {
          method: agency.method,
          headers: {
            ...agency.headers,
            'Content-Type': 'application/json',
            'Origin': 'https://hangel.org',
            'Referer': 'https://hangel.org'
          },
          body: agency.method === 'POST' ? JSON.stringify(agency.body) : undefined,
          cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`[Server] ${agency.name} HTTP Error: ${response.status}`);
            return [];
        }

        const resData = await response.json();
        
        // Scan for brand arrays in various common locations
        const rawList = resData.results || resData.data || resData.offers || (Array.isArray(resData) ? resData : []);
        if (!Array.isArray(rawList)) return [];

        console.log(`[Server] ${agency.name} captured ${rawList.length} items.`);

        return rawList.map((item: any) => ({
          id: `${agency.id}-${item.id || Math.random()}`,
          name: cleanBrandName(item.advertiser_name || item.name || item.title),
          logoUrl: item.logo_url || item.logo || item.image || item.preview_url || "",
          donationRate: parseRate(item.commission_rate || item.payout || item.commission || 0),
          type: 'brand' as const,
          link: item.click_url || item.tracking_url || item.link || "#",
          agency: agency.name,
          category: item.category || "Genel"
        }));
      } catch (err: any) {
        console.error(`[Server] ${agency.name} Connection Error:`, err.message);
        return [];
      }
    })
  );

  let combined = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  
  // Deduplicate and select best rates
  const uniqueMap = new Map<string, Brand>();
  combined.forEach(brand => {
      const key = brand.name.toLowerCase().trim();
      const existing = uniqueMap.get(key);
      if (!existing || brand.donationRate > existing.donationRate) {
          uniqueMap.set(key, brand);
      }
  });

  const finalResults = Array.from(uniqueMap.values());

  // IF ALL APIS EMPTY -> INJECT FALLBACKS
  if (finalResults.length === 0) {
      console.warn("[Server] All APIs returned empty. Injecting Fallback Data.");
      return fallbackBrands;
  }

  return finalResults;
}
