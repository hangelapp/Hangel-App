
import type { Brand } from './types';

const cleanBrandName = (name: string): string => {
  if (!name) return "Marka";
  return name
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(CPS|CPL|CPA|CPO|İndirim|Online|Campaign|Kampanyası|Offer|BPC)\b/gi, '')
    .replace(/(?<!\.)(\b(Sale|Mobil|TR)\b)/gi, '')
    .replace(/[-|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Parses a percentage payout. Returns null when the input cannot be
// interpreted as a meaningful percentage (so we can fall back to a sane
// platform default instead of leaking 0% or 100% to the UI).
const parseRate = (rate: unknown): number | null => {
  if (rate === null || rate === undefined || rate === '') return null;
  let parsed: number;
  if (typeof rate === 'number') {
    parsed = rate;
  } else {
    const cleaned = String(rate).replace('%', '').replace(',', '.').trim();
    parsed = parseFloat(cleaned);
  }
  if (!Number.isFinite(parsed)) return null;
  // Affiliate networks sometimes report fractional payouts (0.05) instead of
  // percent (5). Normalize to a percent value.
  if (parsed > 0 && parsed < 1) parsed = parsed * 100;
  // Drop nonsensical values: 0% and >100% are both bogus for display.
  if (parsed <= 0 || parsed > 100) return null;
  return Math.round(parsed);
};

// Default donation rate when an offer reports CPA / flat-fee / missing
// percentage. Hangel platform commitment is at least 2%.
const DEFAULT_DONATION_RATE = 2;

const getDomainFromUrl = (urlString: string, fallback: string): string => {
  try {
    if (urlString && (urlString.startsWith('http') || urlString.startsWith('//'))) {
      const full = urlString.startsWith('//') ? `https:${urlString}` : urlString;
      return new URL(full).hostname.replace('www.', '');
    }
  } catch {}
  return fallback;
};

// ── Denied/pending offer blocklist ──────────────────────────────────────────
// HasOffers API'leri "status=active" filter'ı uygulansa da affiliate hesabımız
// için reddedilmiş (denied/pending) offer'ları da listeliyor — bu offer'lara
// tıklayan kullanıcı kırık tracking link görüyor. Panel'deki "Canlı Teklifler"
// (approved) listesi ile karşılaştırılarak elde edildi (2026-06-05).
// Kaynak: scripts/affiliate-panel-deep-scrape.ts + scripts/affiliate-panel-reklamaction-only.ts
// 2026-06-10 — Rüya hanım yanıtı sonrası canlı API approval_status taraması ile
// güncellendi (Affiliate_Offer.findAll + fields[]=approval_status). Yalnızca
// approval_status != 'approved' (rejected/pending) olan offer'lar bloklanır;
// approved olanlar Market'te kullanıcıya gösterilir.
const DENIED_OFFER_IDS_BY_NETWORK: Record<string, Set<string>> = {
  reklamaction: new Set([
    // 2026-06-10: 9 marka onaylandı (Banggood, S Sport Plus, havhav, Supplementler,
    // Vitaminler, Fitmoda, miyav, Kuponkod, LG Coupon) → açıldı, artık Market'te görünür.
    // Aşağıdakiler hâlâ pending (approval_status=null) → kalır:
    '580',   // Modanisa Kuponlu Takip
    '12437', // Beymen
    '61440', // Tatildekirala.com
    '62180', // I Find Location CPL
    '62356', // Idefix Android-Ios
    '62369', // Portfun TR
    '62372', // Chat Fun TR
    '62374', // Flo Influencer Install+Satis
    '62412', // Modanisa JO+GCC+UAE-SA
  ]),
  affocean: new Set([
    // 2026-06-10: 14 marka onaylandı (Network, Divarese, Media Markt, Arçelik,
    // Nautica, Gant, Occasion, Yargıcı, Benetton, Bloom and Fresh, SPX, SuperStep,
    // Beko, Suwen) → açıldı. Kalan 2 pending (CPC, retail değil):
    '2720', // Bilişim - HR [CPC]
    '2723', // Bitcointr [CPC] - PN
  ]),
  gelirortaklari: new Set([
    // 2026-06-10: deniedSet eskiden boştu → 13 rejected + 16 pending marka
    // kullanıcıya KIRIK tracking link gösteriyordu. API taramasıyla bloklandı.
    // rejected (link çalışmaz):
    '6131', // Altınbaş
    '6718', // Amazon TR
    '6833', // Bilet.com
    '6871', // Boyner Now
    '6658', // Cacharel
    '6840', // CamperTR
    '6786', // Decathlon
    '4908', // Etstur
    '5396', // IKEA
    '6196', // Penti
    '6659', // Pierre Cardin
    '6647', // Samsung [CPC]
    '6655', // US Polo Assn
    // pending (onay bekliyor — onaylanınca çıkarılır):
    '6782', // Carter's
    '6899', // Getir Büyük
    '6895', // Getir
    '6779', // Gratis
    '5754', // idefix
    '6908', // Karaca Core Affiliate
    '6918', // Karaca Influencer Affiliate
    '2020', // Mavi
    '6673', // Mavi Influencer
    '6776', // MinyCenter
    '6920', // Pazarama
    '6646', // Samsung [CPS]
    '6894', // Tatilbudur
    '6605', // Tchibo
    '6743', // Vitaminler
    '6909', // Yalıspor
  ]),
};

// ── Generic HasOffers/Tune API ───────────────────────────────────────────────
interface HasOffersConfig {
  apiKey: string;
  network: string;
  idPrefix: string;
  agencyName: string;
  affiliateId: string;
  trackingDomain: string;
}

function buildAffiliateLink(config: HasOffersConfig, previewUrl: string): string {
  if (!previewUrl) return '';
  const replaced = previewUrl
    .replace(/\{aff_id\}/g, config.affiliateId)
    .replace(/\{affiliate_id\}/g, config.affiliateId)
    .replace(/\{transaction_id\}/g, '');
  // Remove query params left empty after placeholder replacement
  try {
    const url = new URL(replaced);
    const cleaned = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (value) cleaned.set(key, value);
    });
    url.search = cleaned.toString();
    return url.toString();
  } catch {
    return replaced;
  }
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

    type OfferEntry = {
      Offer?: { id?: string; name?: string; description?: string; preview_url?: string; offer_url?: string; payout_type?: string; percent_payout?: string; default_payout?: string };
      Thumbnail?: { thumbnail?: string; display?: string };
      OfferCategory?: Record<string, { name?: string }>;
    };
    const offerEntries = Object.values(pageData) as OfferEntry[];
    if (offerEntries.length === 0) break;

    const deniedSet = DENIED_OFFER_IDS_BY_NETWORK[config.network];

    for (const entry of offerEntries) {
      const offer = entry?.Offer;
      if (!offer || !offer.name) continue;

      // Affiliate panel'inde denied/pending olan offer'lar — tracking link
      // kırık çalışır, kullanıcıya hata gösterir. Listeye eklenmez.
      if (offer.id && deniedSet?.has(String(offer.id))) continue;

      const name = cleanBrandName(offer.name);
      if (!name) continue;

      // Filter out inappropriate or irrelevant offers
      const nameLower = name.toLowerCase();
      if (/e?kitap|e?book/i.test(nameLower)) continue;
      if (/xxx|porn|adult|sex|eroti[ck]|video\s*marks?/i.test(nameLower)) continue;

      const thumbnailUrl = entry?.Thumbnail?.thumbnail || entry?.Thumbnail?.display;
      const rawPreviewUrl = offer.preview_url || offer.offer_url || '';
      const domain = getDomainFromUrl(rawPreviewUrl, `${name.toLowerCase().replace(/\s+/g, '')}.com`);
      // Clearbit logo API kapandı; Google favicon ile fallback. BrandLogo
      // component error event'inde tekrar fallback chain'i çalıştırır.
      const logoUrl = thumbnailUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      // Use preview_url if it has affiliate placeholders; otherwise fall back to HasOffers tracking URL
      const hasPlaceholder = /\{aff_id\}|\{affiliate_id\}/i.test(rawPreviewUrl);
      const previewUrl = hasPlaceholder
        ? rawPreviewUrl
        : `https://${config.trackingDomain}/aff_c?offer_id=${offer.id}&aff_id=${config.affiliateId}`;

      let category = 'Genel';
      const cats = entry?.OfferCategory;
      if (cats && typeof cats === 'object') {
        const firstCat = Object.values(cats)[0] as { name?: string } | undefined;
        if (firstCat?.name) category = firstCat.name;
      }

      // Only `percent_payout` is a real percentage. `default_payout` is a
      // flat currency amount on CPA offers and must NOT be coerced into a %.
      const rawRate = offer.payout_type === 'cpa_percentage'
        ? offer.percent_payout
        : offer.percent_payout;
      const parsedRate = parseRate(rawRate);
      const rate = parsedRate ?? DEFAULT_DONATION_RATE;
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
        link: buildAffiliateLink(config, previewUrl) || undefined,
        targetDomain: domain,
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
    affiliateId: '35329',
    trackingDomain: 'ad.reklm.com',
  },
  {
    apiKey: 'c908bda5f41405de7cbcb40a15db041e47a2fcc55358e8f44790db8ff2cfb35d',
    network: 'affocean',
    idPrefix: 'ao',
    agencyName: 'Affocean',
    affiliateId: '7873',
    trackingDomain: 'ad.afftrck.com',
  },
  {
    apiKey: '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3',
    network: 'gelirortaklari',
    idPrefix: 'go',
    agencyName: 'GelirOrtaklari',
    affiliateId: '37081',
    trackingDomain: 'tr.rdrtr.com',
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
