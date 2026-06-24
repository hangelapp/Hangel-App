'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, ChevronRight, HeartHandshake, Store } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { BrandLogo } from '@/components/market/brand-logo';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { Brand } from '@/lib/types';

/**
 * Markalar — liste görünümü. /market/discover'daki 🏪 ikonundan açılır.
 * Markalar dikey LİSTE olarak (satır satır: logo + ad + %bağış + chevron) gösterilir;
 * üstte marka adına göre arama. Tıklayınca markanın sayfasına (/market/{slug|id}) gider.
 * Veri /market ile aynı: Firestore markaları + affiliate (/api/offers), id ile deduplı,
 * pasif/silinmiş + geçersiz oran (<1 / >100) elenir.
 */
export default function BrandsListPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
  const { data: firestoreBrands, isLoading } = useCollection<Brand>(brandsQuery);

  const [apiBrands, setApiBrands] = useState<Brand[]>([]);
  useEffect(() => {
    fetch('/api/offers')
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Brand[]) => setApiBrands(Array.isArray(d) ? d : []))
      .catch(() => setApiBrands([]));
  }, []);

  const brands = useMemo(() => {
    const map = new Map<string, Brand>();
    for (const b of [...(firestoreBrands || []), ...apiBrands]) {
      if (!b?.id || !b?.name || map.has(b.id)) continue;
      const status = (b as Brand & { status?: string }).status;
      if (status === 'Silindi' || status === 'Pasif' || status === 'Reddedildi') continue;
      const rate = Number(b.donationRate);
      if (!Number.isFinite(rate) || rate < 1 || rate > 100) continue;
      map.set(b.id, b);
    }
    let list = Array.from(map.values()).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'tr'),
    );
    const q = searchTerm.trim().toLowerCase();
    if (q) list = list.filter((b) => (b.name || '').toLowerCase().includes(q));
    return list;
  }, [firestoreBrands, apiBrands, searchTerm]);

  return (
    <div className="flex min-h-full w-full max-w-full flex-col overflow-x-hidden bg-secondary/30">
      {/* Üst sticky bar — geri + arama + başlık (top-0: header'ın hemen altı, boşluksuz) */}
      <div className="sticky top-0 z-20 w-full max-w-full shrink-0 space-y-2.5 overflow-x-hidden border-b border-border bg-background px-4 py-2.5">
        <div className="flex w-full items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-2xl"
            aria-label="Geri"
          >
            <Link href="/market/discover">
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
          <h1 className="text-sm font-bold text-foreground">Markalar</h1>
          {brands.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground">{brands.length}</span>
          )}
        </div>
      </div>

      <main className="w-full max-w-full overflow-x-hidden pb-32">
        {isLoading && brands.length === 0 ? (
          <div className="divide-y divide-border bg-background">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-muted" />
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                <div className="h-6 w-14 shrink-0 animate-pulse rounded-full bg-muted" />
              </div>
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
          <div className="divide-y divide-border bg-background">
            {brands.map((brand) => {
              const rate = Math.max(0, Math.min(100, Number(brand.donationRate) || 0));
              return (
                <Link
                  key={brand.id}
                  href={`/market/${brand.slug || brand.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50 active:bg-secondary"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
                    <BrandLogo brand={brand} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-bold text-foreground">
                      {brand.name}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                    <HeartHandshake className="h-3 w-3" aria-hidden="true" />%{rate} bağış
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
