'use client';

/**
 * StoreProductsTab — MAĞAZA profilindeki "Ürünler" sekmesi. O mağazanın (satıcının)
 * hangi markadan olursa olsun TÜM ürünlerini (brandName == mağaza adı) Trendyol-tarzı
 * MarketListing ile listeler.
 */

import React from 'react';
import { PackageX } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { MarketListing } from '@/components/market/market-listing';
import { ProductCategoryStrips } from '@/components/market/product-category-strips';
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
    // Marka/kategori sayfalarıyla tutarlı skeleton grid.
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }
  if (!products?.length) {
    return <EmptyState icon={PackageX} title="Ürün bulunamadı" description="Bu mağazanın ürünleri şu an listede yok." />;
  }

  // Mağaza bağış oranı varsa: ürünün kendi oranı yoksa mağaza oranına düş.
  const resolveRate = storeRate && storeRate > 0
    ? (p: CanonicalProduct) => Number(p.donationRate) || storeRate
    : undefined;

  return (
    <div className="space-y-6">
      {/* Mağazanın kendi ürünlerinden kategori şeritleri (Telefon, Bilgisayar, Tablet…) */}
      <ProductCategoryStrips products={products} resolveRate={resolveRate} minItems={6} />
      <MarketListing products={products} resolveRate={resolveRate} adPlacement="store" />
    </div>
  );
}
