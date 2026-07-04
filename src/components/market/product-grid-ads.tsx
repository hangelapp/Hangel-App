'use client';

/**
 * ProductGridWithAds — bir ürün grid'ini render ederken araya "her 5 satırda bir"
 * (rowSlot×5. üründen sonra) tam-genişlik reklam banner'ı serpiştirir. Ham grid
 * kullanan sayfalar (marka profili, Apple) için; MarketListing kendi içinde aynı
 * mantığı barındırır.
 */

import React from 'react';
import type { CanonicalProduct } from '@/lib/feed/types';
import { AdBannerCard } from '@/components/market/ad-banner';
import { useMarketAds } from '@/hooks/use-market-ads';
import type { AdPlacement } from '@/lib/market/ad-banners';

const GRID_COLS = 5;
const AD_SPAN = 'col-span-2 sm:col-span-3 md:col-span-4 xl:col-span-5';

export function ProductGridWithAds({
  items,
  renderCard,
  adPlacement,
  className,
}: {
  items: CanonicalProduct[];
  /** Tek bir ürün kartını render eder (key={p.id} vermeli). */
  renderCard: (p: CanonicalProduct, index: number) => React.ReactNode;
  adPlacement: AdPlacement;
  className: string;
}) {
  const ads = useMarketAds(adPlacement);
  return (
    <div className={className}>
      {items.map((p, i) => {
        const card = renderCard(p, i);
        const slotAds = ads.filter((b) => b.rowSlot * GRID_COLS - 1 === i);
        if (slotAds.length === 0) return card;
        return (
          <React.Fragment key={`row-${p.id}`}>
            {card}
            {slotAds.map((b) => (
              <div key={`ad-${b.id}`} className={AD_SPAN}>
                <AdBannerCard banner={b} />
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
