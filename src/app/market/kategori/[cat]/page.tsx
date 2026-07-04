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
import { ArrowLeft, Loader2, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { MarketListing } from '@/components/market/market-listing';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from '@/lib/feed/types';
import { categoryQueryTokens, curatedCategoryOf } from '@/lib/market/curated-categories';

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/90 px-3 py-2.5 backdrop-blur-md">
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => router.back()} aria-label="Geri">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="truncate text-lg font-black text-foreground">{cat}</h1>
      </header>

      <main className="w-full max-w-full overflow-x-hidden p-4 pb-32">
        {isLoading && !products.length ? (
          <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
        ) : products.length === 0 ? (
          <EmptyState icon={PackageX} title="Ürün bulunamadı" description={`“${cat}” kategorisinde şu an listede ürün yok.`} />
        ) : (
          <MarketListing products={products} adPlacement="category" />
        )}
      </main>
    </div>
  );
}
