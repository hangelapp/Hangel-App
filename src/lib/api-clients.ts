
import type { Brand } from './types';

const cleanBrandName = (name: string): string => {
  if (!name) return "Marka";
  return name
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(CPS|CPL|CPA|CPO|İndirim|Online|Campaign|Kampanyası|Offer|BPC)\b/gi, '')
    .replace(/(?<!\.)(\b(Sale|Mobil|TR)\b)/gi, '')
    .replace(/[\-\|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const parseRate = (rate: any): number => {
  if (!rate) return 5;
  if (typeof rate === 'number') return Math.round(rate);
  const cleaned = String(rate).replace('%', '').replace(',', '.').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 5 : Math.round(parsed);
};

const getDomainFromUrl = (urlString: string, fallback: string): string => {
  try {
    if (urlString && (urlString.startsWith('http') || urlString.startsWith('//'))) {
      const full = urlString.startsWith('//') ? `https:${urlString}` : urlString;
      return new URL(full).hostname.replace('www.', '');
    }
  } catch (_) {}
  return fallback;
};

// ── Generic HasOffers/Tune API ───────────────────────────────────────────────
interface HasOffersConfig {
  apiKey: string;
  network: string;
  idPrefix: string;
  agencyName: string;
}

async function fetchHasOffersOffers(config: HasOffersConfig): Promise<Brand[]> {
  const base = `https://${config.network}.api.hasoffers.com/Apiv3/json`;
  const allBrands: Brand[] = [];
  let page = 1;
  const limit = 200;

  while (true) {
    const params = new URLSearchParams({
      Target: 'Affiliate_Offer',
      Method: 'findAll',
      api_key: config.apiKey,
      'filters[status]': 'active',
      'contain[]': 'Thumbnail',
      'contain[1]': 'OfferCategory',
      limit: String(limit),
      page: String(page),
    });

    const res = await fetch(`${base}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`[${config.agencyName}] Error ${res.status}: ${res.statusText}`);
      break;
    }

    const json = await res.json();
    const resp = json?.response;
    if (!resp || resp.status !== 1) {
      console.error(`[${config.agencyName}] Non-success status:`, resp?.status, resp?.errors);
      break;
    }

    const pageData = resp?.data?.data;
    if (!pageData || typeof pageData !== 'object') break;

    const offerEntries = Object.values(pageData) as any[];
    if (offerEntries.length === 0) break;

    for (const entry of offerEntries) {
      const offer = entry?.Offer;
      if (!offer || !offer.name) continue;

      const name = cleanBrandName(offer.name);
      if (!name) continue;

      // Filter out book/ebook offers
      const nameLower = name.toLowerCase();
      if (/e?kitap|e?book/i.test(nameLower)) continue;

      const thumbnailUrl = entry?.Thumbnail?.thumbnail || entry?.Thumbnail?.display;
      const previewUrl = offer.preview_url || offer.offer_url || '';
      const domain = getDomainFromUrl(previewUrl, `${name.toLowerCase().replace(/\s+/g, '')}.com`);
      const logoUrl = thumbnailUrl || `https://logo.uplead.com/${domain}`;

      let category = 'Genel';
      const cats = entry?.OfferCategory;
      if (cats && typeof cats === 'object') {
        const firstCat = Object.values(cats)[0] as any;
        if (firstCat?.name) category = firstCat.name;
      }

      const rawRate = offer.payout_type === 'cpa_percentage'
        ? offer.percent_payout
        : (offer.default_payout && parseFloat(offer.default_payout) > 0 ? offer.default_payout : offer.percent_payout);
      const rate = parseRate(rawRate);
      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${config.idPrefix}-${offer.id}`;

      allBrands.push({
        id: `${config.idPrefix}-${offer.id}`,
        slug,
        name,
        logoUrl,
        donationRate: rate,
        type: 'brand',
        agency: config.agencyName,
        category,
        about: offer.description ? offer.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500) : undefined,
        link: previewUrl || undefined,
      });
    }

    const pageCount = resp?.data?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }

  return allBrands;
}

// ── Networks ─────────────────────────────────────────────────────────────────
const NETWORKS: HasOffersConfig[] = [
  {
    apiKey: '2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54',
    network: 'reklamaction',
    idPrefix: 'ra',
    agencyName: 'ReklamAction',
  },
  {
    apiKey: 'c908bda5f41405de7cbcb40a15db041e47a2fcc55358e8f44790db8ff2cfb35d',
    network: 'affocean',
    idPrefix: 'ao',
    agencyName: 'Affocean',
  },
  {
    apiKey: '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3',
    network: 'gelirortaklari',
    idPrefix: 'go',
    agencyName: 'GelirOrtaklari',
  },
];

// ── Main export ─────────────────────────────────────────────────────────────
export async function fetchAllAgencyOffers(): Promise<Brand[]> {
  const results = await Promise.allSettled(
    NETWORKS.map(config => fetchHasOffersOffers(config))
  );

  const combined = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

  // Deduplicate by name — keep highest donationRate
  const uniqueMap = new Map<string, Brand>();
  for (const brand of combined) {
    if (!brand?.name) continue;
    const key = brand.name.toLowerCase().trim();
    const existing = uniqueMap.get(key);
    if (!existing || brand.donationRate > existing.donationRate) {
      uniqueMap.set(key, brand);
    }
  }

  return Array.from(uniqueMap.values());
}
