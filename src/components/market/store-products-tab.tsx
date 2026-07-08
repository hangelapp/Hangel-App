'use client';

/**
 * StoreProductsTab — MAĞAZA profilindeki "Ürünler" sekmesi. O mağazanın (satıcının)
 * hangi markadan olursa olsun TÜM ürünlerini (brandName == mağaza adı) Trendyol-tarzı
 * MarketListing ile listeler. Marka profiliyle tutarlı arama + filtre + sıralama.
 */

import React, { useMemo, useState } from 'react';
import { PackageX, Search, SlidersHorizontal, ArrowDownUp, Check } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { MarketListing } from '@/components/market/market-listing';
import { ProductCategoryStrips } from '@/components/market/product-category-strips';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from '@/lib/feed/types';

type SortKey = 'default' | 'donation' | 'priceAsc' | 'priceDesc' | 'discount';

export function StoreProductsTab({ storeName, storeRate }: { storeName: string; storeRate?: number }) {
  const db = useFirestore();
  const q = useMemoFirebase(
    () => (db && storeName ? query(collection(db, COLLECTIONS.products), where('brandName', '==', storeName), limit(240)) : null),
    [db, storeName],
  );
  const { data: products, isLoading } = useCollection<CanonicalProduct>(q);

  // Arama + filtre + sıralama durumu (marka profiliyle aynı UX).
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);

  const isDeal = (p: CanonicalProduct) => typeof p.salePrice === 'number' && p.salePrice > 0 && p.salePrice < p.price;

  const shown = useMemo(() => {
    let list = [...(products ?? [])];
    const term = search.toLocaleLowerCase('tr-TR').trim();
    if (term) {
      list = list.filter((p) => {
        if ((p.title || '').toLocaleLowerCase('tr-TR').includes(term)) return true;
        return (p.searchTokens ?? []).some((t) => (t || '').toLocaleLowerCase('tr-TR').includes(term));
      });
    }
    if (inStockOnly) list = list.filter((p) => { const a = (p.availability || '').toLowerCase(); return !a || a.includes('stock') || a.includes('stok'); });
    if (dealsOnly) list = list.filter(isDeal);
    const price = (p: CanonicalProduct) => (typeof p.salePrice === 'number' && p.salePrice > 0 ? p.salePrice : p.price);
    const discount = (p: CanonicalProduct) => (isDeal(p) ? 1 - (p.salePrice as number) / p.price : 0);
    switch (sortKey) {
      case 'donation': list.sort((a, b) => (Number(b.donationRate) || 0) - (Number(a.donationRate) || 0)); break;
      case 'priceAsc': list.sort((a, b) => price(a) - price(b)); break;
      case 'priceDesc': list.sort((a, b) => price(b) - price(a)); break;
      case 'discount': list.sort((a, b) => discount(b) - discount(a)); break;
    }
    return list;
  }, [products, search, inStockOnly, dealsOnly, sortKey]);

  const activeFilterCount = (inStockOnly ? 1 : 0) + (dealsOnly ? 1 : 0);

  if (isLoading && !products?.length) {
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
    <div className="space-y-4">
      {/* Arama + Filtre + Sırala — marka profiliyle tutarlı */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${storeName} ürünlerinde ara`}
            className="h-10 w-full rounded-full border border-border bg-secondary/60 pl-9 pr-3 text-base sm:text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full" aria-label={`Filtre${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}>
              <span className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{activeFilterCount}</span>}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrele</DropdownMenuLabel>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setInStockOnly((v) => !v); }}>
              {inStockOnly ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-2 w-4" />} Yalnız stokta
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setDealsOnly((v) => !v); }}>
              {dealsOnly ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-2 w-4" />} Yalnız indirimli
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full" aria-label="Sırala">
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sırala</DropdownMenuLabel>
            {([['default', 'Önerilen'], ['donation', 'Bağış oranı (çok→az)'], ['discount', 'İndirim (çok→az)'], ['priceAsc', 'Fiyat (az→çok)'], ['priceDesc', 'Fiyat (çok→az)']] as const).map(([k, label]) => (
              <DropdownMenuItem key={k} onSelect={() => setSortKey(k)}>
                {sortKey === k ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-2 w-4" />} {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Arama/filtre aktifken kategori şeritleri gizlenir; sonuç düz listelenir. */}
      {search.trim() || activeFilterCount > 0 || sortKey !== 'default' ? (
        shown.length > 0 ? (
          <MarketListing products={shown} resolveRate={resolveRate} adPlacement="store" adContext={{ brand: storeName }} />
        ) : (
          <EmptyState icon={PackageX} title="Sonuç bulunamadı" description="Aramanı veya filtreni değiştirmeyi dene." />
        )
      ) : (
        <div className="space-y-6">
          <ProductCategoryStrips products={products} resolveRate={resolveRate} minItems={6} />
          <MarketListing products={products} resolveRate={resolveRate} adPlacement="store" adContext={{ brand: storeName }} />
        </div>
      )}
    </div>
  );
}
