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
import { Store as StoreIcon, ChevronRight, HeartHandshake } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from '@/lib/feed/types';
import type { Brand } from '@/lib/types';

const eff = (p: CanonicalProduct) =>
  typeof p.salePrice === 'number' && p.salePrice > 0 ? p.salePrice : p.price;
const fmt = (n: number, c?: string) =>
  `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)} ${
    c === 'TRY' || !c ? 'TL' : c
  }`;
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
    <section className="space-y-2 rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
          Bu Ürün Başka Mağazalarda ({rows.length})
        </h2>
        <span className="text-[11px] font-semibold text-primary">
          en çok bağışlayan önce
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Aynı ürünü başka mağazalarda karşılaştır — en yüksek bağış oranı olan mağaza
        üstte. Başka sayfaya gitmene gerek yok.
      </p>
      <div className="divide-y divide-border/60">
        {rows.map((r) => {
          const href = r.storeId
            ? `/market/${r.storeId}`
            : `/products/${r.cheapest.id}`;
          return (
            <Link
              key={r.cheapest.id}
              href={href}
              className="-mx-1 flex items-center gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-primary/5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-white text-primary">
                <StoreIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {r.storeName}
                </p>
                {r.storeRate > 0 ? (
                  <p className="flex items-center gap-1 text-[11px] font-bold text-primary">
                    <HeartHandshake className="h-3 w-3" aria-hidden="true" />
                    %{Math.round(r.storeRate)} bağış
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Bağış oranı belirtilmemiş
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-foreground">
                  {fmt(eff(r.cheapest), r.cheapest.currency)}
                </p>
                <p className="text-[10px] text-muted-foreground">en düşük</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default ProductBrandOtherStores;
