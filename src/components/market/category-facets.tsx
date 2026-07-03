'use client';

/**
 * CategoryFacets — bir ürün kümesinden (ör. seçili kategori) o kümedeki
 * MAĞAZALARI (brandName) ve MARKALARI (productBrand) çıkarır; her ikisini de
 * BAĞIŞ ORANINA göre sıralı yatay şeritlerde gösterir. Mağaza → mağaza profili,
 * marka → /market/brand/<key>. Kategori "profili" deneyimi.
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Store as StoreIcon, Tag } from 'lucide-react';
import type { CanonicalProduct } from '@/lib/feed/types';

const srcPrefix = (s?: string) => (s === 'affocean' ? 'ao' : s === 'reklamaction' ? 'ra' : s === 'gelirortaklari' ? 'go' : '');
const rateOf = (p: CanonicalProduct) => Number(p.donationRate) || 0;

type Facet = { key: string; name: string; rate: number; count: number; href: string };

function groupFacets(
  products: CanonicalProduct[],
  keyFn: (p: CanonicalProduct) => string | undefined,
  nameFn: (p: CanonicalProduct) => string,
  hrefFn: (p: CanonicalProduct, key: string) => string,
): Facet[] {
  const map = new Map<string, { name: string; rateSum: number; rateCount: number; count: number; sample: CanonicalProduct }>();
  for (const p of products) {
    const k = (keyFn(p) || '').trim();
    if (!k) continue;
    const cur = map.get(k) ?? { name: nameFn(p), rateSum: 0, rateCount: 0, count: 0, sample: p };
    const r = rateOf(p);
    if (r > 0) { cur.rateSum += r; cur.rateCount += 1; }
    cur.count += 1;
    map.set(k, cur);
  }
  return Array.from(map.entries())
    .map(([k, v]) => ({ key: k, name: v.name, rate: v.rateCount ? Math.round(v.rateSum / v.rateCount) : 0, count: v.count, href: hrefFn(v.sample, k) }))
    .sort((a, b) => b.rate - a.rate || b.count - a.count)
    .slice(0, 20);
}

function Row({ title, icon, facets }: { title: string; icon: React.ReactNode; facets: Facet[] }) {
  if (facets.length === 0) return null;
  return (
    <section className="w-full max-w-full">
      <h3 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-black text-foreground">{icon} {title}</h3>
      <div className="flex w-full gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {facets.map((f) => (
          <Link
            key={f.key}
            href={f.href}
            className="flex shrink-0 flex-col items-start gap-0.5 rounded-2xl border border-border bg-card px-3.5 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="max-w-[9rem] truncate text-sm font-bold text-foreground">{f.name}</span>
            {f.rate > 0 && <span className="text-[11px] font-bold text-primary">%{f.rate} bağış</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CategoryFacets({ products, className }: { products: CanonicalProduct[]; className?: string }) {
  const stores = useMemo(
    () => groupFacets(
      products,
      (p) => p.brandName,
      (p) => p.brandName,
      (p) => {
        const id = p.brandId || (srcPrefix(p.source) && p.feedId ? `${srcPrefix(p.source)}-${p.feedId}` : '');
        return id ? `/market/${id}` : `/market/products?brand=${encodeURIComponent(p.brandName || '')}`;
      },
    ),
    [products],
  );
  const brands = useMemo(
    () => groupFacets(
      products.filter((p) => p.productBrand && p.productBrandKey),
      (p) => p.productBrandKey || undefined,
      (p) => p.productBrand || '',
      (_p, key) => `/market/brand/${encodeURIComponent(key)}`,
    ),
    [products],
  );

  if (stores.length === 0 && brands.length === 0) return null;

  return (
    <div className={className ? `space-y-4 ${className}` : 'space-y-4'}>
      <Row title="Bu kategorideki mağazalar" icon={<StoreIcon className="h-4 w-4 text-primary" />} facets={stores} />
      <Row title="Bu kategorideki markalar" icon={<Tag className="h-4 w-4 text-primary" />} facets={brands} />
    </div>
  );
}
