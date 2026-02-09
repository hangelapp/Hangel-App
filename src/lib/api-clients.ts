import type { Brand } from './types';

/**
 * Gelişmiş İsim Temizleme: [CPS], [CPL], Mobil gibi ibareleri siler.
 */
const cleanBrandName = (name: string): string => {
  if (!name) return "Bilinmeyen Marka";
  return name
    .replace(/\[.*?\]/g, '') 
    .replace(/\(.*?\)/g, '')
    .replace(/CPS|CPL|CPA|Mobil|Influencer|Offer|Kampanyası|Sale|İndirim|Online|TR/gi, '') 
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

const fallbackBrands: Brand[] = [
  { id: 'fb-1', name: 'Converse', donationRate: 7, logoUrl: 'https://logo.clearbit.com/converse.com', agency: 'Affocean (Geçici Veri)', type: 'brand', category: 'Ayakkabı' },
  { id: 'fb-2', name: 'Ebebek', donationRate: 5, logoUrl: 'https://logo.clearbit.com/ebebek.com', agency: 'Affocean (Geçici Veri)', type: 'brand', category: 'Anne & Bebek' },
  { id: 'fb-3', name: 'Teknosa', donationRate: 2, logoUrl: 'https://logo.clearbit.com/teknosa.com', agency: 'ReklamAction (Geçici Veri)', type: 'brand', category: 'Elektronik' }
];

export async function fetchAllAgencyOffers(): Promise<Brand[]> {
  const agencies = [
    {
      id: 'go',
      name: 'Gelir Ortakları',
      url: 'https://feed.gelirortaklari.com/api/v1/search',
      method: 'POST',
      body: { "value": "", "type": "advertiser" }, // Updated type parameter
      headers: { 'x-api-key': '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3' }
    },
    {
      id: 'ao',
      name: 'Affocean',
      url: 'https://affocean.com/api/v1/offers',
      method: 'GET',
      headers: { 'Authorization': 'Bearer 9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48' }
    },
    {
      id: 'ra',
      name: 'ReklamAction',
      url: 'https://api.reklamaction.com/v1/offers?network=reklamaction',
      method: 'GET',
      headers: { 'Authorization': 'Bearer 2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54' }
    }
  ];

  const proxyUrl = 'https://' + (typeof window !== 'undefined' ? window.location.host : 'localhost:3000') + '/api/proxy';

  const results = await Promise.allSettled(
    agencies.map(async (agency) => {
      try {
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agency),
          cache: 'no-store'
        });

        const resData = await response.json();
        
        // Scan for brand arrays with Array.isArray checks
        let rawList = [];
        if (Array.isArray(resData)) rawList = resData;
        else if (resData.results && Array.isArray(resData.results)) rawList = resData.results;
        else if (resData.data && Array.isArray(resData.data)) rawList = resData.data;
        else if (resData.offers && Array.isArray(resData.offers)) rawList = resData.offers;

        console.log(`[Server] ${agency.name} found ${rawList.length} valid entries.`);

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
        console.error(`[Server] ${agency.name} Fetch Error:`, err.message);
        return [];
      }
    })
  );

  let combined = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  
  // Deduplicate
  const uniqueMap = new Map<string, Brand>();
  combined.forEach(brand => {
      const key = brand.name.toLowerCase().trim();
      const existing = uniqueMap.get(key);
      if (!existing || brand.donationRate > existing.donationRate) {
          uniqueMap.set(key, brand);
      }
  });

  const finalResults = Array.from(uniqueMap.values());

  // Disable fallback if real data is present
  if (finalResults.length === 0) {
      console.warn("[Server] No real data. Using fallbacks.");
      return fallbackBrands;
  }

  console.log(`[Server] Total unique brands identified: ${finalResults.length}`);
  return finalResults;
}
