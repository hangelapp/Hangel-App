'use client';

/**
 * DonationStrips — bir ürün listesinden İKİ yatay bağış şeridi üretir:
 *   🧡 En Çok Yüzdeyle Bağış Yapanlar — bağış ORANI (%) yüksek → düşük
 *   💰 En Çok Tutarla Bağış Yapanlar  — mutlak bağış TUTARI (₺ = oran × fiyat)
 *
 * Market ana sayfasındaki şeritlerin marka profili + kategori görünümü karşılığı.
 * (ProductStrip market/page.tsx'e özel olduğundan burada ProductCard ile hafif sürüm.)
 */

import React from 'react';
import { ProductCard } from '@/components/market/product-card';
import type { CanonicalProduct } from '@/lib/feed/types';
import { donationAmountTRY } from '@/lib/market/donation-value';

function Strip({ title, items }: { title: string; items: CanonicalProduct[] }) {
  return (
    <section className="w-full max-w-full">
      <h2 className="mb-2.5 px-1 text-base font-black text-foreground">{title}</h2>
      <div className="flex w-full min-w-0 gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {items.map((p) => (
          <div key={p.id} className="w-36 shrink-0 sm:w-40">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DonationStrips({
  products,
  resolveRate,
  limit = 15,
  className,
}: {
  products: CanonicalProduct[];
  resolveRate?: (p: CanonicalProduct) => number;
  limit?: number;
  className?: string;
}) {
  const rate = resolveRate || ((p: CanonicalProduct) => Number(p.donationRate) || 0);

  const byPct = products
    .map((p) => ({ p, v: rate(p) }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, limit)
    .map((x) => x.p);

  const byAmt = products
    .map((p) => ({ p, v: donationAmountTRY(p, rate(p)) }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, limit)
    .map((x) => x.p);

  // Anlamlı bir şerit için en az 3 ürün gerekli.
  if (byPct.length < 3) return null;

  return (
    <div className={className ? `space-y-6 ${className}` : 'space-y-6'}>
      <Strip title="🧡 En Çok Yüzdeyle Bağış Yapanlar" items={byPct} />
      {byAmt.length >= 3 && <Strip title="💰 En Çok Tutarla Bağış Yapanlar" items={byAmt} />}
    </div>
  );
}
