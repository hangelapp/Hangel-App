'use client';

/**
 * ProductCategoryStrips — bir ürün kümesini (marka veya mağaza profilindeki ürünler)
 * gerçek kategoriye göre gruplayıp her kategori için yatay 21-ürünlük şerit render eder.
 * Örn. Apple → Telefon / Bilgisayar / Tablet / Aksesuar; Teknosa → aynı mantık.
 * Ana sayfadaki kategori şeritlerinin marka/mağaza profili karşılığı.
 */

import React, { useMemo } from 'react';
import { ProductCard } from '@/components/market/product-card';
import type { CanonicalProduct } from '@/lib/feed/types';
import { groupByRealCategory } from '@/lib/market/category-utils';

function Strip({ title, items, resolveRate }: { title: string; items: CanonicalProduct[]; resolveRate?: (p: CanonicalProduct) => number }) {
  return (
    <section className="w-full max-w-full">
      <h3 className="mb-2.5 px-1 text-base font-black text-foreground">{title}</h3>
      <div className="flex w-full gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {items.map((p) => (
          <div key={p.id} className="w-36 shrink-0 sm:w-40">
            <ProductCard product={p} donationRate={resolveRate ? resolveRate(p) : undefined} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProductCategoryStrips({
  products,
  resolveRate,
  minItems = 4,
  className,
}: {
  products: CanonicalProduct[];
  resolveRate?: (p: CanonicalProduct) => number;
  minItems?: number;
  className?: string;
}) {
  const strips = useMemo(() => groupByRealCategory(products, minItems), [products, minItems]);
  if (strips.length === 0) return null;
  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      {strips.map((s) => (
        <Strip key={s.name} title={s.name} items={s.items.slice(0, 21)} resolveRate={resolveRate} />
      ))}
    </div>
  );
}
