'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Store } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { BrandLogo } from '@/components/market/brand-logo';
import type { Brand } from '@/lib/types';

/**
 * Tüm Markalar — market'teki BÜTÜN ürün markaları (479+). Büyük "Tüm Markalar"
 * butonundan (/market) açılır. Veri /api/market/brands-all'dan gelir: `products`
 * koleksiyonundaki tekil (normalize edilmiş) markalar; yeni taranan markalar
 * otomatik eklenir. Marka şeridindeki "Tümü" (/market/brands) yalnız ajans
 * markalarını gösterir — burası ondan farklı ve daha kapsamlıdır.
 *
 * Tıklayınca markanın ürünleri açılır (/market/products?brand=<ad>).
 */
type AllBrand = { id: string; name: string; donationRate: number; logoUrl?: string; domain?: string };

export default function AllBrandsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allBrands, setAllBrands] = useState<AllBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/market/brands-all')
      .then((r) => (r.ok ? r.json() : { brands: [] }))
      .then((d: { brands?: AllBrand[] }) => {
        if (alive) setAllBrands(Array.isArray(d.brands) ? d.brands : []);
      })
      .catch(() => {
        if (alive) setAllBrands([]);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const brands = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allBrands;
    return allBrands.filter((b) => (b.name || '').toLowerCase().includes(q));
  }, [allBrands, searchTerm]);

  return (
    <div className="flex min-h-full w-full max-w-full flex-col overflow-x-hidden bg-secondary/30">
      {/* Üst sticky bar — geri + arama + başlık */}
      <div className="sticky top-0 z-20 w-full max-w-full shrink-0 space-y-2.5 overflow-x-hidden border-b border-border bg-background px-4 py-2.5">
        <div className="flex w-full items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-2xl"
            aria-label="Geri"
          >
            <Link href="/market">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="relative min-w-0 flex-grow">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Marka ara"
              className="h-11 rounded-2xl border-none bg-muted/50 pl-10 text-base focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 px-1">
          <Store className="h-4 w-4 text-primary" aria-hidden="true" />
          <h1 className="text-sm font-bold text-foreground">Tüm Markalar</h1>
          {brands.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground">{brands.length}</span>
          )}
        </div>
      </div>

      <main className="w-full max-w-full overflow-x-hidden pb-32">
        {isLoading && brands.length === 0 ? (
          <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Store}
              title="Marka bulunamadı"
              description={searchTerm ? 'Aramanı değiştirip tekrar dene.' : 'Yakında burada olacaklar.'}
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {brands.map((b) => {
              const rate = Math.max(0, Math.min(100, Number(b.donationRate) || 0));
              // logoUrl: affiliate gerçek logosu (varsa). targetDomain: markanın
              // sitesi → BrandLogo favicon/logoyu oradan çeker. İkisi de yoksa
              // BrandLogo marka adından domain tahmin edip favicon dener.
              const brandForLogo = {
                id: b.id,
                slug: b.id,
                name: b.name,
                category: '',
                type: 'brand',
                logoUrl: b.logoUrl || '',
                targetDomain: b.domain || '',
                donationRate: rate,
              } as Brand;
              return (
                <Link
                  key={b.id}
                  href={`/market/brand/${encodeURIComponent(b.id)}`}
                  className="group"
                >
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="relative aspect-square w-full">
                      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all group-hover:shadow-md">
                        <BrandLogo brand={brandForLogo} />
                      </div>
                      {rate > 0 && (
                        <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-[11px] font-black text-white">
                          %{rate}
                        </div>
                      )}
                    </div>
                    <p className="break-words text-xs font-bold leading-tight text-foreground group-hover:text-primary">
                      {b.name}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
