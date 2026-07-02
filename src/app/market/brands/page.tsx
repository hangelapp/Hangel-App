'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Store } from 'lucide-react';
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
            <Link href="/market">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="relative min-w-0 flex-grow">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Mağaza ara"
              className="h-11 rounded-2xl border-none bg-muted/50 pl-10 text-base focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 px-1">
          <Store className="h-4 w-4 text-primary" aria-hidden="true" />
          <h1 className="text-sm font-bold text-foreground">Mağazalar</h1>
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
            {brands.map((brand) => {
              const rate = Math.max(0, Math.min(100, Number(brand.donationRate) || 0));
              return (
                <Link key={brand.id} href={`/market/${brand.slug || brand.id}`} className="group">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="relative aspect-square w-full">
                      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all group-hover:shadow-md">
                        <BrandLogo brand={brand} />
                      </div>
                      <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-[11px] font-black text-white">
                        %{rate}
                      </div>
                    </div>
                    <p className="break-words text-xs font-bold leading-tight text-foreground group-hover:text-primary">
                      {brand.name}
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
