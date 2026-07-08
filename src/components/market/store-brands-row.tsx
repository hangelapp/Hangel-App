'use client';

/**
 * StoreBrandsRow — MAĞAZA profilinde "Bu mağazada satılan markalar" şeridi.
 * Marka profilindeki "Bu markayı satan mağazalar"ın TERSİ. Yatay kayan çipler;
 * her marka tıklanınca marka profiline (/market/brand/<key>) gider.
 *
 * Veri: GET /api/market/store/[id]/brands?name=<storeName> (agregat, cache'li).
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag, ChevronRight } from 'lucide-react';

type BrandRow = { key: string; name: string; productCount: number; donationRate: number };

export function StoreBrandsRow({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [brands, setBrands] = useState<BrandRow[] | null>(null);

  useEffect(() => {
    if (!storeId && !storeName) return;
    let alive = true;
    const qs = storeName ? `?name=${encodeURIComponent(storeName)}` : '';
    fetch(`/api/market/store/${encodeURIComponent(storeId || 'x')}/brands${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && Array.isArray(j?.brands)) setBrands(j.brands); })
      .catch(() => { if (alive) setBrands([]); });
    return () => { alive = false; };
  }, [storeId, storeName]);

  if (!brands || brands.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-1.5 px-0.5">
        <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-black text-foreground">Bu mağazada satılan markalar ({brands.length})</h2>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {brands.map((b) => (
          <Link
            key={b.key}
            href={`/market/brand/${encodeURIComponent(b.key)}`}
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="min-w-0">
              <p className="max-w-[140px] truncate text-sm font-bold text-foreground">{b.name}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {b.productCount} ürün{b.donationRate > 0 ? ` · %${b.donationRate} bağış` : ''}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default StoreBrandsRow;
