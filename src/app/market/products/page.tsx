'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, ArrowLeft } from 'lucide-react';
import { ProductSortChips, type SortMode } from '@/components/market/product-sort-chips';
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
import { collection, limit, query, orderBy, startAt, where, getCountFromServer } from 'firebase/firestore';
import type { CanonicalProduct } from '@/lib/feed/types';

export default function ProductsPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBrand, setActiveBrand] = useState('Tümü');
  // Arama sonuçları üstündeki sıralama/filtre çipi (sadece arama yapılınca görünür).
  const [sortMode, setSortMode] = useState<SortMode>(null);

  // Her yüklemede farklı `random` başlangıç noktası → ürünler rastgele gelir.
  // 0.8 tavanı: imleçten sonra her zaman bolca ürün kalır (limit dolar).
  const [randSeed, setRandSeed] = useState(0);
  useEffect(() => { setRandSeed(Math.random() * 0.8); }, []);

  // "Tüm Markalar" (/market/brands/all) listesinden gelen ?brand=<ad> — o
  // markanın ürünleri sunucudan (where brandName) çekilir, chip önseçili gelir.
  // useSearchParams yerine window (Suspense sınırı gerektirmesin).
  const [brandParam, setBrandParam] = useState('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const b = sp.get('brand') || '';
    if (b) { setBrandParam(b); setActiveBrand(b); }
    // Kategori breadcrumb segment linki (?q=Tablet Kılıfı) → aramayı ön-doldur.
    const q = sp.get('q') || '';
    if (q) setSearchTerm(q);
  }, []);

  // Arama: yazma durunca (350ms) tetiklenir; kelimelere bölünür (Türkçe İ/ı normalize).
  // Boşsa rastgele "gözat" modu; doluysa TÜM katalogda searchTokens araması.
  const [debounced, setDebounced] = useState('');
  useEffect(() => { const t = setTimeout(() => setDebounced(searchTerm), 350); return () => clearTimeout(t); }, [searchTerm]);
  const searchTokens = useMemo(
    () => Array.from(new Set(debounced.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2))),
    [debounced]
  );

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
    () =>
      // Marka görünümü: arama yoksa o markanın ürünlerini sunucudan getir.
      brandParam && searchTokens.length === 0
        ? query(collection(db, COLLECTIONS.products), where('brandName', '==', brandParam), limit(120))
        : searchTokens.length > 0
        // Tüm katalogda kelime araması (ilk token sunucuda; çoklu kelime aşağıda daraltılır).
        ? query(collection(db, COLLECTIONS.products), where('searchTokens', 'array-contains', searchTokens[0]), limit(120))
        : query(collection(db, COLLECTIONS.products), orderBy('random'), startAt(randSeed), limit(120)),
    [db, randSeed, searchTokens, brandParam]
  );
  const { data: products, isLoading } =
    useCollection<CanonicalProduct>(productsQuery);

  // Bağış oranı brands koleksiyonundan çözülür (scrape ürünlerinde donationRate yok).
  const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
  const { data: brands } = useCollection<{ name?: string; donationRate?: number }>(brandsQuery);
  const normBrand = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase().trim();
  const donationByBrand = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of brands || []) {
      if (b.name && typeof b.donationRate === 'number' && b.donationRate > 0) m.set(normBrand(b.name), b.donationRate);
    }
    return m;
  }, [brands]);

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
    // Çoklu kelime: sunucu ilk token'ı getirdi; kalan kelimeleri istemcide daralt.
    if (searchTokens.length > 1) {
      list = list.filter((p) => {
        const hay = `${p.title} ${p.brandName}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase();
        return searchTokens.every((t) => hay.includes(t));
      });
    }
    // Arama çipi: sıralama/filtre (yalnızca arama sonuçlarına uygulanır).
    const eff = (p: CanonicalProduct) => (p.salePrice != null && p.salePrice > 0 ? p.salePrice : p.price);
    const ts = (p: CanonicalProduct) => {
      const u = (p as CanonicalProduct & { updatedAt?: number; importedAt?: { seconds?: number } });
      return typeof u.updatedAt === 'number' ? u.updatedAt : (u.importedAt?.seconds ?? 0);
    };
    const rateOf = (p: CanonicalProduct) => (typeof p.donationRate === 'number' && p.donationRate > 0 ? p.donationRate : (donationByBrand.get(normBrand(p.brandName || '')) ?? 0));
    if (sortMode === 'discount') {
      // İndirim oranı en yüksek üstte; indirimi olmayan (salePrice yok) alta.
      const disc = (p: CanonicalProduct) => (p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? 1 - p.salePrice / p.price : -1);
      list = [...list].sort((a, b) => disc(b) - disc(a));
    } else if (sortMode === 'donation') {
      list = [...list].sort((a, b) => rateOf(b) - rateOf(a));
    } else if (sortMode === 'price') {
      list = [...list].sort((a, b) => eff(a) - eff(b));
    } else if (sortMode === 'new') {
      list = [...list].sort((a, b) => ts(b) - ts(a));
    }
    return list;
  }, [products, activeBrand, searchTokens, sortMode, donationByBrand]);

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
        {/* Her zaman görünür ürün/sonuç sayacı (placeholder yazınca kaybolduğu için). */}
        <p className="px-1 text-xs font-semibold text-muted-foreground">
          {searchTokens.length > 0
            ? `${filtered.length.toLocaleString('tr-TR')}${filtered.length >= 120 ? '+' : ''} sonuç`
            : `${(totalCount ?? products?.length ?? 0).toLocaleString('tr-TR')} ürün listeleniyor`}
        </p>
        {/* Arama yapılınca sonuçların üstünde sıralama çipleri (paylaşılan pazaryeri component'i). */}
        {searchTokens.length > 0 && (
          <ProductSortChips value={sortMode} onChange={setSortMode} />
        )}
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
