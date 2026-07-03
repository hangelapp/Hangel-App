'use client';

/**
 * StoreProductsTab — MAĞAZA profilindeki "Ürünler" sekmesi. O mağazanın (satıcının)
 * hangi markadan olursa olsun TÜM ürünlerini (brandName == mağaza adı) Trendyol-tarzı
 * MarketListing ile listeler.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { MarketListing } from '@/components/market/market-listing';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from '@/lib/feed/types';

export function StoreProductsTab({ storeName, storeRate }: { storeName: string; storeRate?: number }) {
  const db = useFirestore();
  const q = useMemoFirebase(
    () => (db && storeName ? query(collection(db, COLLECTIONS.products), where('brandName', '==', storeName), limit(240)) : null),
    [db, storeName],
  );
  const { data: products, isLoading } = useCollection<CanonicalProduct>(q);

  if (isLoading && !products?.length) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!products?.length) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Bu mağazanın ürünleri şu an listede yok.</p>;
  }

  // Mağaza bağış oranı varsa: ürünün kendi oranı yoksa mağaza oranına düş.
  const resolveRate = storeRate && storeRate > 0
    ? (p: CanonicalProduct) => Number(p.donationRate) || storeRate
    : undefined;

  return <MarketListing products={products} resolveRate={resolveRate} />;
}
