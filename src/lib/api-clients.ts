import type { Brand } from './types';

/**
 * Marka isimlerini tertemiz yapan Regex motoru.
 */
const cleanBrandName = (name: string): string => {
  if (!name) return "Marka";
  return name
    .replace(/\[.*?\]/g, '') 
    .replace(/\(.*?\)/g, '')
    .replace(/CPS|CPL|CPA|CPO|Sale|İndirim|Mobil|Online|Campaign|Kampanyası|TR|Offer|BPC/gi, '') 
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

export async function fetchAllAgencyOffers(): Promise<Brand[]> {
  const agencies = [
    {
      id: 'go',
      name: 'Gelir Ortakları',
      url: 'https://feed.gelirortaklari.com/api/v1/search',
      method: 'POST',
      body: { "value": "", "type": "advertiser" },
      headers: { 'Authorization': 'Bearer 891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3' }
    },
    {
      id: 'ao',
      name: 'Affocean',
      url: 'https://affocean.com/api/v1/offers?limit=100&status=active',
      method: 'GET',
      headers: { 'Authorization': 'Bearer 9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48' }
    },
    {
      id: 'ra',
      name: 'ReklamAction',
      url: 'https://api.reklamaction.com/v1/campaigns',
      method: 'GET',
      headers: { 'Authorization': 'Bearer 2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54' }
    }
  ];

  const results = await Promise.allSettled(
    agencies.map(async (agency) => {
      try {
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agency),
          cache: 'no-store'
        });

        const resData = await response.json();
        let rawList = [];

        if (Array.isArray(resData)) rawList = resData;
        else if (Array.isArray(resData.data)) rawList = resData.data;
        else if (Array.isArray(resData.results)) rawList = resData.results;
        else if (Array.isArray(resData.offers)) rawList = resData.offers;
        else if (Array.isArray(resData.campaigns)) rawList = resData.campaigns;

        return rawList.map((item: any) => {
          const name = cleanBrandName(item.advertiser_name || item.name || item.title || item.campaign_name);
          const domain = item.url ? new URL(item.url).hostname.replace('www.', '') : `${name.toLowerCase().replace(/\s+/g, '')}.com`;
          
          return {
            id: `${agency.id}-${item.id || Math.random()}`,
            name: name,
            logoUrl: `https://logo.clearbit.com/${domain}`,
            donationRate: parseRate(item.commission_rate || item.commission || item.payout || 5),
            type: 'brand' as const,
            agency: agency.name,
            category: item.category || "Genel"
          };
        });
      } catch (err) {
        return [];
      }
    })
  );

  const combined = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  
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
