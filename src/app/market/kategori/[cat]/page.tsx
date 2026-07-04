'use client';

/**
 * Kategori detay sayfası — /market/kategori/<kürasyonlu kategori>
 *
 * Ana sayfadaki kategori şeridinin "Tümü"sü buraya gelir. O kategorideki ürünleri
 * (searchTokens array-contains-any + kürasyon filtresi) Trendyol-tarzı MarketListing
 * ile listeler. Mağaza/marka bağımsız — o kategorinin tüm ürünleri.
 */

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { MarketListing } from '@/components/market/market-listing';
import { CategoryFacets } from '@/components/market/category-facets';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from '@/lib/feed/types';
import type { Brand } from '@/lib/types';
import { categoryQueryTokens, curatedCategoryOf } from '@/lib/market/curated-categories';

const normStore = (s: string) => (s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const cat = decodeURIComponent((params.cat as string) || '');
  const db = useFirestore();

  const tokens = useMemo(() => categoryQueryTokens(cat).slice(0, 10), [cat]);
  const q = useMemoFirebase(
    () => (db && tokens.length ? query(collection(db, COLLECTIONS.products), where('searchTokens', 'array-contains-any', tokens), limit(300)) : null),
    [db, tokens],
  );
  const { data: raw, isLoading } = useCollection<CanonicalProduct>(q);

  // Token sorgusu geniş; kürasyon kuralıyla kesinleştir (o kategoriye ait olanlar).
  const products = useMemo(
    () => (raw || []).filter((p) => curatedCategoryOf(p.category, p.title, p.brandName) === cat),
    [raw, cat],
  );

  // Mağaza (satıcı) oran haritası — ürünün kendi oranı yoksa MAĞAZA oranına düş.
  const storesQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.brands) : null), [db]);
  const { data: allStores } = useCollection<Brand>(storesQuery);
  const storeRateByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of allStores ?? []) {
      const r = Number(b?.donationRate);
      if (b?.name && Number.isFinite(r) && r > 0) m.set(normStore(b.name), Math.round(r));
    }
    return m;
  }, [allStores]);
  const resolveRate = (p: CanonicalProduct) =>
    Number(p.donationRate) || storeRateByName.get(normStore(p.brandName)) || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/90 px-3 py-2.5 backdrop-blur-md">
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => router.back()} aria-label="Geri">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black leading-tight text-foreground">{cat}</h1>
          {products.length > 0 && (
            <p className="text-[11px] font-semibold text-muted-foreground">{products.length.toLocaleString('tr-TR')} ürün</p>
          )}
        </div>
      </header>

      <main className="w-full max-w-full overflow-x-hidden p-4 pb-32">
        {isLoading && !products.length ? (
          // Marka sayfasıyla tutarlı skeleton grid (bare spinner yerine).
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon={PackageX} title="Ürün bulunamadı" description={`“${cat}” kategorisinde şu an listede ürün yok.`} />
        ) : (
          <>
            {products.length >= 4 && (
              <div className="mb-4">
                <CategoryFacets products={products} />
              </div>
            )}
            <MarketListing products={products} resolveRate={resolveRate} adPlacement="category" />
          </>
        )}
      </main>
    </div>
  );
}
