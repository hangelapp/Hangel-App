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
 * Tüm Markalar — market'teki BÜTÜN ürün markaları (400+). Büyük "Tüm Markalar"
 * butonundan (/market) açılır. Veri /api/market/brands-all'dan gelir.
 *
 * DÜZEN: TEK bir akan grid — çok bilinen (ünlü) markalar üstte, az bilinenler
 * altta (görünür başlık/ayrım YOK, tek liste). Her iki grup da HER AÇILIŞTA bir
 * kez RASTGELE karıştırılır (grup içinde sabit/alfabetik sıra yok). Arama
 * yapılınca düz filtreli liste. Tıklayınca markanın profili açılır (/market/brand/<key>).
 */
type AllBrand = {
  id: string;
  name: string;
  donationRate: number;
  logoUrl?: string;
  domain?: string;
  famous?: boolean;
};

// Fisher-Yates — grup içi rastgele sıralama (her mount'ta bir kez).
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GRID = 'grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';

export default function AllBrandsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  // ordered = [karışık ünlüler ..., karışık az bilinenler ...] — mount'ta bir kez.
  // Tek grid olarak basılır: ünlüler üstte, az bilinenler altta, görünür ayrım yok.
  const [ordered, setOrdered] = useState<AllBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/market/brands-all')
      .then((r) => (r.ok ? r.json() : { brands: [] }))
      .then((d: { brands?: AllBrand[] }) => {
        if (!alive) return;
        const list = Array.isArray(d.brands) ? d.brands : [];
        const famous = shuffle(list.filter((b) => b.famous));
        const rest = shuffle(list.filter((b) => !b.famous));
        setOrdered([...famous, ...rest]);
      })
      .catch(() => {
        if (alive) setOrdered([]);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const shown = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter((b) => (b.name || '').toLowerCase().includes(q));
  }, [ordered, searchTerm]);

  const renderCard = (b: AllBrand) => {
    const rate = Math.max(0, Math.min(100, Number(b.donationRate) || 0));
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
      <Link key={b.id} href={`/market/brand/${encodeURIComponent(b.id)}`} className="group">
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
  };

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
          {shown.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground">{shown.length}</span>
          )}
        </div>
      </div>

      <main className="w-full max-w-full overflow-x-hidden pb-32">
        {isLoading && ordered.length === 0 ? (
          <div className={GRID}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Store}
              title="Marka bulunamadı"
              description={searchTerm ? 'Aramanı değiştirip tekrar dene.' : 'Yakında burada olacaklar.'}
            />
          </div>
        ) : (
          <div className={GRID}>{shown.map(renderCard)}</div>
        )}
      </main>
    </div>
  );
}
