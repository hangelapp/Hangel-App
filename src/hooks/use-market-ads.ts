'use client';

import { useMemo, useState } from 'react';
import { collection, query } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import {
  type MarketAdBanner,
  type AdPlacement,
  bannersForPlacement,
  SEED_MARKET_ADS,
} from '@/lib/market/ad-banners';

/**
 * Bir sayfa türü (placement) için yayındaki market reklam banner'larını döndürür.
 *
 * - `marketAdBanners` koleksiyonunu okur; aktiflik + tarih aralığı + placement
 *   filtresini istemci tarafında `bannersForPlacement` ile uygular.
 * - Koleksiyon henüz tohumlanmadıysa (boş), `SEED_MARKET_ADS` üzerinden fallback
 *   yaparak banner'ların Firestore seed'inden önce de görünmesini sağlar.
 * - db yoksa / yüklenirken güvenli biçimde boş dizi döner.
 */
export function useMarketAds(placement: AdPlacement): MarketAdBanner[] {
  const db = useFirestore();

  const adsQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.marketAdBanners)) : null),
    [db],
  );

  const { data, isLoading } = useCollection<MarketAdBanner>(adsQuery);

  // Tarih aralığı filtresi için mount anındaki zaman damgası (render'da tekrar
  // Date.now() çağırmamak için lazy state — reklam tarih aralığı ms hassasiyeti gerektirmez).
  const [now] = useState(() => Date.now());

  return useMemo(() => {
    // Yükleniyor ya da db yok → boş.
    if (isLoading) return [];

    // Koleksiyon boş/henüz tohumlanmamış → seed kreatiflerine düş.
    const source: MarketAdBanner[] =
      data && data.length > 0 ? data : SEED_MARKET_ADS;

    return bannersForPlacement(source, placement, now);
  }, [data, isLoading, placement, now]);
}
