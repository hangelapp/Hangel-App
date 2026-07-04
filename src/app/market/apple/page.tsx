'use client';

/**
 * /market/apple — anlaşmalı katalogdaki Apple ürünleri, KARIŞIK (her ziyarette farklı) liste.
 * market/discover'daki Apple banner'ından açılır. Apple kurumsal kimliği (siyah hero) +
 * her üründe %bağış rozeti (ProductCard). Apple ürünlerinde marka oranı yok → platform %5.
 */

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, HeartHandshake, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCard } from '@/components/market/product-card';
import { ProductSortChips, sortProducts, type SortMode } from '@/components/market/product-sort-chips';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, where, query, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from '@/lib/feed/types';
import { ProductCategoryStrips } from '@/components/market/product-category-strips';
import { ProductGridWithAds } from '@/components/market/product-grid-ads';
import { isFalseBrandMatch } from '@/lib/market/brand-extract';

// Apple ürünlerinde markaya özgü oran yok → platform varsayılanı (discover ile aynı).
const APPLE_RATE = 5;

export default function AppleProductsPage() {
  const db = useFirestore();

  // Marka≠Mağaza: fix sonrası brandName=MAĞAZA (MediaMarkt…), Apple ise productBrand.
  // Apple ürünleri productBrandKey='apple' ile bulunur (brandName='Apple' artık yok).
  const productsQuery = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.products), where('productBrandKey', '==', 'apple'), limit(120)),
    [db],
  );
  const { data: products, isLoading } = useCollection<CanonicalProduct>(productsQuery);

  // KARIŞIK sıra — oturum başına sabit seed (render içinde Math.random yok), her ziyarette farklı.
  const [seed, setSeed] = useState(0);
  useEffect(() => { setSeed(Math.floor(Math.random() * 2_147_483_646) + 1); }, []);

  // Apple false-positive: "green apple", "apple cider", "apple peel" gibi meyve/gıda
  // ürünlerini ele — bunlar Apple markası değil (extractProductBrand yanlış eşlemişti).
  const cleanProducts = useMemo(
    () => (products || []).filter((p) => !isFalseBrandMatch('Apple', p.title || '')),
    [products],
  );

  const shuffled = useMemo(() => {
    const list = [...cleanProducts];
    let s = seed || 1;
    const rand = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [cleanProducts, seed]);

  // Sıralama çipi (boşken karışık; çip seçilince ona göre sıralı).
  const [sortMode, setSortMode] = useState<SortMode>(null);
  const displayed = useMemo(() => sortProducts(shuffled, sortMode, APPLE_RATE), [shuffled, sortMode]);

  return (
    <div className="flex min-h-full w-full max-w-full flex-col overflow-x-hidden bg-secondary/30">
      {/* Üst sticky bar (top-0: header'ın hemen altı) */}
      <div className="sticky top-0 z-20 w-full max-w-full shrink-0 overflow-x-hidden border-b border-border bg-background px-4 py-2.5">
        <div className="flex w-full items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="h-11 w-11 shrink-0 rounded-2xl" aria-label="Geri">
            <Link href="/market/discover"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <Apple className="h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
          <h1 className="min-w-0 flex-1 truncate text-base font-black text-foreground">Apple</h1>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
            <HeartHandshake className="h-3 w-3" aria-hidden="true" />%{APPLE_RATE} bağış
          </span>
        </div>
      </div>

      {/* Apple kurumsal kimlikli hero — hem indirim hem bağış */}
      <div className="px-4 pt-3">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-neutral-800 to-black p-5 text-white shadow-lg">
          <Apple className="pointer-events-none absolute -right-5 -top-5 h-32 w-32 opacity-10" aria-hidden="true" />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/60">Apple</p>
          <p className="mt-1.5 text-2xl font-black leading-tight">İndirim + bağış</p>
          <p className="mt-1.5 max-w-[90%] text-sm font-medium text-white/85">
            Apple ürünleri — hem indirimli hem her alışveriş %{APPLE_RATE} bağış.
          </p>
        </div>
      </div>

      {/* Pazaryeri sıralama çipleri (arama/kategori sayfalarıyla aynı) */}
      <div className="px-4 pt-3">
        <ProductSortChips value={sortMode} onChange={setSortMode} />
      </div>

      <main className="w-full max-w-full overflow-x-hidden pb-32 pt-4">
        {/* Kategori şeritleri (Telefon, Bilgisayar, Tablet, Aksesuar…) — filtre yokken */}
        {sortMode === null && cleanProducts.length >= 8 && (
          <div className="px-4 pb-4"><ProductCategoryStrips products={cleanProducts} /></div>
        )}
        {isLoading && displayed.length === 0 ? (
          <div className="grid grid-cols-2 gap-2.5 px-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <Card key={i} variant="glass" className="h-72 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Apple} title="Apple ürünü bulunamadı" description="Yakında burada olacaklar." />
          </div>
        ) : (
          <ProductGridWithAds
            items={displayed}
            adPlacement="brand"
            className="grid grid-cols-2 gap-2.5 px-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5"
            renderCard={(p) => (
              <ProductCard
                key={p.id}
                product={p}
                donationRate={typeof p.donationRate === 'number' && p.donationRate > 0 ? p.donationRate : APPLE_RATE}
              />
            )}
          />
        )}
      </main>
    </div>
  );
}
