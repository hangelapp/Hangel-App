'use client';

/**
 * Ürünleri Keşfet — Trendyol/pazar-yeri tarzı ürün keşfet sayfası (PIM).
 *
 * hangel farkı: her kartta 🧡 BAĞIŞ ORANI rozeti. Klasik pazar yerinde
 * olmayan tek şey bu — kullanıcı alışveriş yaparken hangi ürünün ne kadarının
 * bağışa gittiğini görür ve buna göre seçebilir (SIRALA → "Bağış oranı").
 *
 * Veri kaynağı: COLLECTIONS.products (kanonik ürün kütüphanesi). Ürünler
 * `random` alanına göre rastgele başlangıçla çekilir (her ziyarette farklı
 * vitrin). Arama, kategori ve sıralama çekilen küme üzerinde client-side
 * uygulanır — mevcut /market/products deseniyle aynı.
 *
 * İLERİ NOT (kod gerekmez): Aynı ürün (gtin/mpn ya da normalize başlık) birden
 * çok markada listelenince fiyat + bağış oranı KARŞILAŞTIRMA kartı gösterilebilir
 * ("3 markada var, en yüksek bağış %18"). Şimdilik tek düz liste; karşılaştırma
 * ileride gtin/mpn gruplaması ile eklenecek.
 */

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  ArrowLeft,
  ArrowDownUp,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCard } from '@/components/market/product-card';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import {
  collection,
  limit,
  query,
  orderBy,
  startAt,
  getCountFromServer,
} from 'firebase/firestore';
import type { CanonicalProduct } from '@/lib/feed/types';
import type { Brand } from '@/lib/types';

type SortOption =
  | 'recommended' // varsayılan — feed rastgele sırası (popüler vitrin)
  | 'donationDesc' // bağış oranı yüksek → düşük (hangel imzası)
  | 'priceAsc' // fiyat artan
  | 'priceDesc' // fiyat azalan
  | 'popular'; // popülerlik (en yeni ingest — taze ürün proxy'si)

const SORT_LABELS: Record<SortOption, string> = {
  recommended: 'Önerilen',
  donationDesc: 'Bağış oranı (yüksek)',
  priceAsc: 'Fiyat (artan)',
  priceDesc: 'Fiyat (azalan)',
  popular: 'Popülerlik',
};

// Bir ürünün etkin fiyatı: indirimli fiyat varsa o, yoksa ana fiyat.
function effectivePrice(p: CanonicalProduct): number {
  return typeof p.salePrice === 'number' && p.salePrice > 0
    ? p.salePrice
    : p.price;
}

export default function DiscoverPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  // Her yüklemede farklı `random` başlangıç noktası → vitrin rastgele gelir.
  // 0.8 tavanı: imleçten sonra her zaman bolca ürün kalır (limit dolar).
  const [randSeed, setRandSeed] = useState(0);
  useEffect(() => {
    setRandSeed(Math.random() * 0.8);
  }, []);

  // Koleksiyonun GERÇEK toplamı (yalnız çekilen 120 değil) — arama
  // placeholder'ında "X ürün arasında" doğru görünsün diye sayılır.
  const [totalCount, setTotalCount] = useState<number | null>(null);
  useEffect(() => {
    if (!db) return;
    getCountFromServer(collection(db, COLLECTIONS.products))
      .then((snap) => setTotalCount(snap.data().count))
      .catch(() => {
        /* sessiz — placeholder yine çalışır */
      });
  }, [db]);

  const productsQuery = useMemoFirebase(
    () =>
      query(
        collection(db, COLLECTIONS.products),
        orderBy('random'),
        startAt(randSeed),
        limit(120),
      ),
    [db, randSeed],
  );
  const { data: products, isLoading } =
    useCollection<CanonicalProduct>(productsQuery);

  // Markaların bağış oranı — ürünün, linkine sahip olduğu markanın oranını kartta göster.
  // firestore brands + affiliate (api) brands birleşiminden brandId/brandName ile eşlenir.
  const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
  const { data: firestoreBrands } = useCollection<Brand>(brandsQuery);
  const [apiBrands, setApiBrands] = useState<Brand[]>([]);
  useEffect(() => {
    fetch('/api/offers')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Brand[]) => setApiBrands(Array.isArray(data) ? data : []))
      .catch(() => setApiBrands([]));
  }, []);
  const brandRate = useMemo(() => {
    const byId = new Map<string, number>();
    const byName = new Map<string, number>();
    for (const b of [...(firestoreBrands || []), ...apiBrands]) {
      const r = Number(b?.donationRate);
      if (!b || !Number.isFinite(r) || r <= 0) continue;
      if (b.id) byId.set(b.id, r);
      if (b.name) byName.set(b.name.trim().toLowerCase(), r);
    }
    return { byId, byName };
  }, [firestoreBrands, apiBrands]);
  const resolveProductRate = (p: CanonicalProduct): number | null => {
    if (typeof p.donationRate === 'number' && p.donationRate > 0) return p.donationRate;
    if (p.brandId && brandRate.byId.has(p.brandId)) return brandRate.byId.get(p.brandId) ?? null;
    const n = p.brandName?.trim().toLowerCase();
    if (n && brandRate.byName.has(n)) return brandRate.byName.get(n) ?? null;
    return null;
  };

  // Kategori filtresi: ürün `category` alanından türetilir; yoksa marka adı
  // ikincil grup olarak kullanılır (her ürünün en az markası vardır).
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products || []) {
      const cat = p.category?.trim() || p.brandName?.trim();
      if (cat) set.add(cat);
    }
    return ['Tümü', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...(products || [])];

    if (activeCategory !== 'Tümü') {
      list = list.filter(
        (p) =>
          (p.category?.trim() || p.brandName?.trim()) === activeCategory,
      );
    }

    const lower = searchTerm.trim().toLowerCase();
    if (lower) {
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(lower) ||
          p.brandName?.toLowerCase().includes(lower),
      );
    }

    switch (sortBy) {
      case 'donationDesc':
        list.sort(
          (a, b) => (b.donationRate ?? 0) - (a.donationRate ?? 0),
        );
        break;
      case 'priceAsc':
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case 'priceDesc':
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case 'popular':
        // Popülerlik proxy'si: en yeni ingest edilen ürün (updatedAt) en üstte.
        list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
        break;
      default:
        // 'recommended' → feed'in rastgele `random` sırası korunur (vitrin).
        break;
    }

    return list;
  }, [products, activeCategory, searchTerm, sortBy]);

  const hasFilters =
    searchTerm.trim() !== '' ||
    activeCategory !== 'Tümü' ||
    sortBy !== 'recommended';

  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('Tümü');
    setSortBy('recommended');
  };

  return (
    <div className="flex h-full flex-col bg-secondary/30">
      {/* Üst sabit başlık + arama + filtre/sırala */}
      <div className="sticky top-12 z-20 shrink-0 space-y-3 border-b border-border bg-background p-4">
        <div className="flex items-center gap-2">
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
          <div className="min-w-0">
            <h1 className="text-xl font-black leading-none text-foreground">
              Ürünleri Keşfet
            </h1>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Her alışveriş bir bağış · umudu büyütüyoruz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Arama */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`${(totalCount ?? products?.length ?? 0).toLocaleString('tr-TR')} ürün içinde ara`}
              className="h-11 rounded-2xl border-none bg-muted/50 pl-10 text-base focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Kategori filtre */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-2xl border-none bg-background shadow-sm"
                aria-label="Kategori filtrele"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel>Kategori</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'flex items-center justify-between gap-2',
                    activeCategory === cat && 'font-bold text-primary',
                  )}
                >
                  <span className="truncate">{cat}</span>
                  {activeCategory === cat && (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sırala */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-2xl border-none bg-background shadow-sm"
                aria-label="Sırala"
              >
                <ArrowDownUp className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sırala</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={cn(
                    'flex items-center justify-between gap-2',
                    sortBy === opt && 'font-bold text-primary',
                  )}
                >
                  <span>{SORT_LABELS[opt]}</span>
                  {sortBy === opt && <Check className="h-4 w-4 shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Aktif kategori/sıralama özeti — yatay kaydırmalı pill şeridi */}
        {hasFilters && (
          <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeCategory !== 'Tümü' && (
              <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {activeCategory}
              </span>
            )}
            {sortBy !== 'recommended' && (
              <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                {SORT_LABELS[sortBy]}
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Temizle
            </button>
          </div>
        )}
      </div>

      {/* Ürün grid */}
      <main className="flex-1 overflow-y-auto p-4 pb-32">
        {isLoading && (!products || products.length === 0) ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(8)].map((_, i) => (
              <Card key={i} variant="glass" className="h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Ürün bulunamadı"
            description={
              hasFilters
                ? 'Aramana uygun ürün yok. Filtreleri temizleyip tekrar dene.'
                : 'Henüz listelenecek ürün yok. Yakında burada olacaklar.'
            }
            action={
              hasFilters
                ? { label: 'Filtreleri temizle', onClick: resetFilters }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} donationRate={resolveProductRate(product)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
