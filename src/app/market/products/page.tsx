'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCard } from '@/components/market/product-card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { collection, limit, query, orderBy, startAt, getCountFromServer } from 'firebase/firestore';
import type { CanonicalProduct } from '@/lib/feed/types';

export default function ProductsPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBrand, setActiveBrand] = useState('Tümü');

  // Her yüklemede farklı `random` başlangıç noktası → ürünler rastgele gelir.
  // 0.8 tavanı: imleçten sonra her zaman bolca ürün kalır (limit dolar).
  const [randSeed, setRandSeed] = useState(0);
  useEffect(() => { setRandSeed(Math.random() * 0.8); }, []);

  // Toplam ürün sayısı (koleksiyonun tamamı) — placeholder yalnız çekilen 120'yi
  // değil GERÇEK toplamı göstersin diye getCountFromServer ile ayrıca sayılır.
  const [totalCount, setTotalCount] = useState<number | null>(null);
  useEffect(() => {
    if (!db) return;
    getCountFromServer(collection(db, COLLECTIONS.products))
      .then((snap) => setTotalCount(snap.data().count))
      .catch(() => { /* sessiz — placeholder yine çalışır */ });
  }, [db]);

  const productsQuery = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.products), orderBy('random'), startAt(randSeed), limit(120)),
    [db, randSeed]
  );
  const { data: products, isLoading } =
    useCollection<CanonicalProduct>(productsQuery);

  const brandNames = useMemo(() => {
    const set = new Set<string>();
    for (const p of products || []) {
      if (p.brandName) set.add(p.brandName);
    }
    return ['Tümü', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products || [];
    if (activeBrand !== 'Tümü') {
      list = list.filter((p) => p.brandName === activeBrand);
    }
    const lower = searchTerm.trim().toLowerCase();
    if (lower) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.brandName.toLowerCase().includes(lower)
      );
    }
    return list;
  }, [products, activeBrand, searchTerm]);

  const hasFilters = searchTerm.trim() !== '' || activeBrand !== 'Tümü';

  return (
    <div className="flex h-full flex-col bg-secondary/30">
      <div className="sticky top-12 z-20 shrink-0 space-y-3 border-b bg-background p-4">
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            aria-label="Geri"
          >
            <Link href="/market">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-black">Ürünler</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-grow">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`${(totalCount ?? products?.length ?? 0).toLocaleString('tr-TR')} ürün arasında seçiniz`}
              className="h-12 rounded-2xl border-none bg-muted/50 pl-10 text-base focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 max-w-[40%] shrink-0 truncate rounded-2xl border-none bg-background shadow-sm"
              >
                {activeBrand}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              {brandNames.map((name) => (
                <DropdownMenuItem
                  key={name}
                  onClick={() => setActiveBrand(name)}
                  className={activeBrand === name ? 'font-bold text-primary' : ''}
                >
                  {name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-32">
        {isLoading && (!products || products.length === 0) ? (
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:gap-x-3 lg:grid-cols-5">
            {[...Array(8)].map((_, i) => (
              <Card key={i} variant="glass" className="h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Ürün bulunamadı"
            description={
              hasFilters
                ? 'Aramanıza uygun ürün yok. Filtreleri temizleyin.'
                : 'Henüz listelenecek ürün yok.'
            }
            action={
              hasFilters
                ? {
                    label: 'Filtreleri temizle',
                    onClick: () => {
                      setSearchTerm('');
                      setActiveBrand('Tümü');
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:gap-x-3 lg:grid-cols-5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
