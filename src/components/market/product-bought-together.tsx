'use client';

/**
 * ProductBoughtTogether — ürün detayında "Birlikte Alınanlar". AYNI MAĞAZADAN
 * tamamlayıcı ürünleri önerir (tek teslimatla gelir). Yakın-kopya olmasın diye
 * FARKLI kategorideki ürünler tercih edilir; yeterli tamamlayıcı yoksa aynı
 * mağazadan herhangi bir kategoriyle doldurulur. Mevcut ürün dışlanır.
 */

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { ProductCard } from '@/components/market/product-card';
import type { CanonicalProduct } from '@/lib/feed/types';

export function ProductBoughtTogether({ product }: { product: CanonicalProduct }) {
  const db = useFirestore();
  const store = (product.brandName || '').trim();

  const q = useMemoFirebase(() => {
    if (!db || !store) return null;
    return query(collection(db, COLLECTIONS.products), where('brandName', '==', store), limit(24));
  }, [db, store]);
  const { data: matches } = useCollection<CanonicalProduct>(q);

  const items = useMemo(() => {
    const curCat = (product.category || '').trim().toLowerCase();
    const seen = new Set<string>([product.id]);
    const complementary: CanonicalProduct[] = [];
    const sameCat: CanonicalProduct[] = [];
    for (const p of matches ?? []) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      const cat = (p.category || '').trim().toLowerCase();
      if (curCat && cat === curCat) sameCat.push(p);
      else complementary.push(p);
    }
    // Farklı kategori (tamamlayıcı) önce; 4'ten az ise aynı kategoriyle doldur.
    const merged = complementary.length >= 4 ? complementary : [...complementary, ...sameCat];
    return merged.slice(0, 10);
  }, [matches, product]);

  if (!store) return null;
  if (items.length < 2) return null;

  return (
    <section>
      <h2 className="mb-2.5 px-1 text-base font-black text-foreground">Birlikte Alınanlar</h2>
      <span className="mb-2 block px-1 text-[11px] font-semibold text-muted-foreground">
        Aynı mağazadan — tek teslimatla
      </span>
      <div className="flex gap-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {items.map((p) => (
          <div key={p.id} className="w-36 shrink-0 sm:w-40">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProductBoughtTogether;
