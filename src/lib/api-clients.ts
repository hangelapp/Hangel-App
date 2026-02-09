
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
  if (!rate) return 5;
  if (typeof rate === 'number') return rate;
  const cleaned = String(rate).replace('%', '').replace(',', '.').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 5 : parsed;
};

export async function fetchAllAgencyOffers(): Promise<Brand[]> {
  const agencies = [
    {
      id: 'go',
      name: 'GelirOrtaklari',
      url: 'https://feed.gelirortaklari.com/api/v1/product',
      headers: { 'Authorization': 'Bearer 891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3' }
    },
    {
      id: 'ao',
      name: 'Affocean',
      url: 'https://api.afftrck.com/v1/offers',
      headers: { 'Authorization': 'Bearer 9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48' }
    },
    {
      id: 'ra',
      name: 'ReklamAction',
      url: 'https://api.reklamaction.com/v1/offer?network=reklamaction',
      headers: { 'Authorization': 'Bearer 2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54' }
    }
  ];

  const results = await Promise.allSettled(
    agencies.map(async (agency) => {
      try {
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agency: agency.name,
            url: agency.url,
            headers: agency.headers
          }),
          cache: 'no-store'
        });

        if (!response.ok) return [];

        const resData = await response.json();
        let rawList = [];

        // Dinamik yapı kontrolü
        if (Array.isArray(resData)) rawList = resData;
        else if (Array.isArray(resData.data)) rawList = resData.data;
        else if (Array.isArray(resData.offers)) rawList = resData.offers;
        else if (Array.isArray(resData.products)) rawList = resData.products;

        return rawList.map((item: any) => {
          const rawName = item.brand || item.name || item.advertiser_name || item.title;
          const name = cleanBrandName(rawName);
          const domain = item.url ? new URL(item.url).hostname.replace('www.', '') : `${name.toLowerCase().replace(/\s+/g, '')}.com`;
          
          return {
            id: `${agency.id}-${item.id || Math.random()}`,
            name: name,
            logoUrl: `https://logo.clearbit.com/${domain}`,
            donationRate: parseRate(item.commission_rate || item.payout || 5),
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
