/**
 * Feed kaynak → adaptör kaydı (registry).
 *
 * Tek bir `ingestProducts` girişi, `kind`'a göre doğru adaptörü çağırır:
 *  - 'gelirortaklari' : GelirOrtakları Go Feed API (feedId + offerId ile marka feed'i)
 *  - 'generic'        : verilen feedUrl'den Google Merchant XML (ikas/ideasoft/tsoft/…)
 *
 * Yeni bir kaynak eklemek için FeedSourceKind'a bir değer + bu switch'e bir kol
 * eklemek yeterli; route ve UI tek giriş üzerinden çalışır.
 */
import type { CanonicalProduct, ProductFeed } from './types';
import { listGelirOrtaklariFeeds, fetchGelirOrtaklariProducts } from './gelirortaklari';
import { fetchGenericGoogleMerchantProducts } from './generic';

export type FeedSourceKind = 'gelirortaklari' | 'generic';

export interface IngestParams {
  kind: FeedSourceKind;
  brandId?: string | null;
  brandName?: string;
  donationRate?: number;
  limit?: number;
  // gelirortaklari için:
  feedId?: string;
  offerId?: string;
  type?: string;
  // generic için:
  feedUrl?: string;
  source?: string;
}

export async function ingestProducts(params: IngestParams): Promise<CanonicalProduct[]> {
  if (params.kind === 'generic') {
    if (!params.feedUrl) throw new Error('generic kaynak için feedUrl zorunlu.');
    return fetchGenericGoogleMerchantProducts({
      feedUrl: params.feedUrl,
      brandId: params.brandId ?? null,
      brandName: params.brandName || 'Marka',
      source: params.source,
      donationRate: params.donationRate,
      limit: params.limit,
    });
  }

  // kind === 'gelirortaklari'
  if (!params.feedId || !params.offerId) {
    throw new Error('gelirortaklari kaynak için feedId ve offerId zorunlu.');
  }
  const feed: ProductFeed = {
    source: 'gelirortaklari',
    feedId: params.feedId,
    offerId: params.offerId,
    name: params.brandName || 'Marka',
    type: params.type || 'google',
  };
  return fetchGelirOrtaklariProducts(feed, {
    limit: params.limit,
    brandId: params.brandId ?? null,
    donationRate: params.donationRate,
  });
}

// GelirOrtakları feed listesini yeniden export ederek registry'yi tek giriş yapar.
export { listGelirOrtaklariFeeds };
