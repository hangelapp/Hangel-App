'use client';

/**
 * 🎯 Sana Özel — kullanıcının FAVORİLERİ + SON GEZDİKLERİNDEN türetilen
 * kişiselleştirilmiş ürün şeridi. Ana sayfada ZATEN yüklü ürünleri (ek Firestore
 * okuması YOK) tercih sinyaline göre puanlar/sıralar.
 *
 * Sinyal kaynakları:
 *  - Son gezilenler (localStorage): kategori + productBrandKey + brandName + id.
 *  - Favoriler (Firestore snapshot): yalnız brandName + id (snapshot'ta kategori yok).
 *
 * Zaten gördüğü/favorilediği ürünler ÖNERİLMEZ (görülen id kümesi hariç tutulur).
 * Sinyal yoksa ya da <4 sonuç varsa null döner (yeni kullanıcıya gösterilmez).
 */

import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '@/components/market/product-card';
import { getRecentViews, type RecentView } from '@/lib/market/recently-viewed';
import { realCategoryOf } from '@/lib/market/category-utils';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';
import type { CanonicalProduct } from '@/lib/feed/types';

const NO_SCROLLBAR =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function PersonalizedStrip({
  products,
  resolveRate,
}: {
  products: CanonicalProduct[];
  resolveRate: (p: CanonicalProduct) => number;
}) {
  // localStorage yalnız client'ta — SSR kırılmasın diye effect'te yükle.
  const [recent, setRecent] = useState<RecentView[]>([]);
  useEffect(() => setRecent(getRecentViews()), []);

  const { favorites, favIds } = useFavorites();

  const items = useMemo(() => {
    const prefCategories = new Set<string>();
    const prefBrandKeys = new Set<string>();
    const prefStores = new Set<string>();
    const seenIds = new Set<string>();

    // Son gezilenler — kategori/marka anahtarı/mağaza sinyali + görülen id.
    for (const v of recent) {
      if (v.id) seenIds.add(v.id);
      const c = realCategoryOf(v.category);
      if (c) prefCategories.add(c.toLowerCase());
      if (v.productBrandKey) prefBrandKeys.add(v.productBrandKey.toLowerCase());
      if (v.brandName) prefStores.add(v.brandName.trim().toLowerCase());
    }

    // Favoriler — snapshot'ta yalnız brandName var; id'yi de hariç tutmak için topla.
    for (const f of favorites) {
      const id = (f as { id?: string }).id;
      if (id) seenIds.add(id);
      if (f.brandName) prefStores.add(f.brandName.trim().toLowerCase());
    }
    for (const id of favIds) seenIds.add(id);

    const hasSignal =
      prefCategories.size > 0 || prefBrandKeys.size > 0 || prefStores.size > 0;
    if (!hasSignal) return [];

    const scored = products
      .filter((p) => {
        const img = typeof p.imageLink === 'string' && p.imageLink.trim().length > 0;
        return img && !seenIds.has(p.id);
      })
      .map((p) => {
        let score = 0;
        const cat = realCategoryOf(p.category).toLowerCase();
        if (cat && prefCategories.has(cat)) score += 3;
        const bk = p.productBrandKey?.toLowerCase();
        if (bk && prefBrandKeys.has(bk)) score += 2;
        const store = p.brandName?.trim().toLowerCase();
        if (store && prefStores.has(store)) score += 1;
        return { p, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || resolveRate(b.p) - resolveRate(a.p))
      .slice(0, 18)
      .map((s) => s.p);

    return scored;
    // resolveRate ana sayfada her render'da yeni referans; içeriği brandRate'e bağlı.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, recent, favorites, favIds]);

  // Sinyal yok ya da yeterli sonuç yoksa şeridi gösterme.
  if (items.length < 4) return null;

  return (
    <section className="w-full max-w-full pt-6">
      <div className="mb-2.5 flex items-center justify-between gap-2 px-4">
        <h2 className="flex min-w-0 items-center gap-1.5 text-base font-black text-foreground">
          <span aria-hidden="true">🎯</span>
          <span className="truncate">Sana Özel</span>
        </h2>
      </div>
      <div className={cn('flex w-full min-w-0 gap-2.5 overflow-x-auto px-4 pb-1', NO_SCROLLBAR)} style={{ scrollbarWidth: 'none' }}>
        {items.map((p) => (
          <div key={p.id} className="w-36 shrink-0 sm:w-40">
            <ProductCard product={p} donationRate={resolveRate(p)} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default PersonalizedStrip;
