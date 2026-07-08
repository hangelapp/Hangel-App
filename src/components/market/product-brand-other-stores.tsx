'use client';

/**
 * ProductBrandOtherStores — "Bu Marka Başka Mağazalarda".
 *
 * Aynı MARKA (productBrandKey — örn. Nike, Apple) ürünlerini FARKLI MAĞAZALARDA
 * (brandName) satan mağazaları gösterir: kullanıcıya "Nike ürünü Trendyol'da %5,
 * Modanisa'da %6" karşılaştırması sunar.
 *
 * `ProductOtherSellers`tan farkı: o AYNI ÜRÜNÜ (GTIN/MPN) satan satıcıları listeler.
 * Bu bileşen ise AYNI MARKAYI (Nike) satan mağazaları, o mağazadaki BAŞKA Nike
 * ürününü de göstererek karşılaştırır. Ürün-özdeşliği aramaz.
 *
 * Sorgu: products where productBrandKey == this.productBrandKey (limit 40).
 * İstemcide mağazaya (brandName) göre gruplanır, her mağazadan en düşük fiyatlı
 * ürün seçilir; mevcut ürünün mağazası dışlanır; mağaza oranına göre sıralanır.
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { ProductCard } from '@/components/market/product-card';
import type { CanonicalProduct } from '@/lib/feed/types';
import type { Brand } from '@/lib/types';

const eff = (p: CanonicalProduct) =>
  typeof p.salePrice === 'number' && p.salePrice > 0 ? p.salePrice : p.price;
const normStore = (s: string) => (s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();

interface Row {
  storeName: string;      // görünen mağaza adı (Trendyol, Modanisa…)
  storeId: string | null; // brands koleksiyonundaki id (varsa)
  storeRate: number;      // mağazanın bağış oranı (%)
  cheapest: CanonicalProduct; // o mağazadaki en ucuz aynı-marka ürün
}

export function ProductBrandOtherStores({ product }: { product: CanonicalProduct }) {
  const db = useFirestore();
  const brandKey = (product.productBrandKey || '').trim();

  const q = useMemoFirebase(() => {
    if (!db || !brandKey) return null;
    return query(
      collection(db, COLLECTIONS.products),
      where('productBrandKey', '==', brandKey),
      limit(40),
    );
  }, [db, brandKey]);
  const { data: matches } = useCollection<CanonicalProduct>(q);

  // Mağaza kataloğu — oran + gerçek storeId için.
  const storesQuery = useMemoFirebase(
    () => (db ? collection(db, COLLECTIONS.brands) : null),
    [db],
  );
  const { data: allStores } = useCollection<Brand>(storesQuery);
  const storeByName = useMemo(() => {
    const m = new Map<string, Brand>();
    for (const b of allStores ?? []) if (b?.name) m.set(normStore(b.name), b);
    return m;
  }, [allStores]);

  const rows: Row[] = useMemo(() => {
    const curStore = normStore(product.brandName || '');
    const bestByStore = new Map<string, CanonicalProduct>();
    for (const p of matches ?? []) {
      if (p.id === product.id) continue;
      const key = normStore(p.brandName || '');
      if (!key || key === curStore) continue;
      const ex = bestByStore.get(key);
      if (!ex || eff(p) < eff(ex)) bestByStore.set(key, p);
    }
    const out: Row[] = [];
    for (const p of bestByStore.values()) {
      const storeMeta = storeByName.get(normStore(p.brandName || ''));
      const rate =
        typeof p.donationRate === 'number' && p.donationRate > 0
          ? p.donationRate
          : typeof storeMeta?.donationRate === 'number' && storeMeta.donationRate > 0
            ? storeMeta.donationRate
            : 0;
      out.push({
        storeName: p.brandName,
        storeId: storeMeta?.id || null,
        storeRate: rate,
        cheapest: p,
      });
    }
    // En yüksek bağış oranı önce; eşitlikte ucuz fiyat önce.
    return out
      .sort((a, b) => b.storeRate - a.storeRate || eff(a.cheapest) - eff(b.cheapest))
      .slice(0, 8);
  }, [matches, product, storeByName]);

  if (!brandKey) return null;
  if (rows.length === 0) return null;

  const brandLabel = product.productBrand || brandKey;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-base font-black text-foreground">
          Bu Ürün Başka Mağazalarda ({rows.length})
        </h2>
        <span className="shrink-0 text-[11px] font-semibold text-primary">
          en çok bağışlayan önce
        </span>
      </div>
      {/* Yatay ürün şeridi — her mağazanın en uygun ürünü fiyat + indirim + bağış
          oranıyla; kullanıcı tek bakışta en uygununu görür, sayfa değiştirmez. */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {rows.map((r) => (
          <div key={r.cheapest.id} className="w-36 shrink-0 space-y-1">
            {/* Her kart KENDİ mağaza bağış oranını gösterir (ürün oranı yoksa mağaza oranı). */}
            <ProductCard product={r.cheapest} donationRate={r.storeRate > 0 ? Math.round(r.storeRate) : undefined} />
            <Link
              href={r.storeId ? `/market/${r.storeId}` : `/products/${r.cheapest.id}`}
              className="flex items-center gap-1 truncate px-0.5 text-[11px] font-bold text-primary hover:underline"
            >
              <HeartHandshake className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{r.storeName}</span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProductBrandOtherStores;
