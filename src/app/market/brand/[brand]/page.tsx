'use client';

/**
 * Marka profili — /market/brand/<productBrandKey>
 *
 * "Marka" (Nike, Apple, Ülker) profilidir. Ürünün hangi MAĞAZADA (Media Markt,
 * Sportive...) satıldığından bağımsız olarak, markası bu olan TÜM ürünleri
 * listeler (`products.productBrandKey == key`). Mağaza profili ise /market/<id>.
 *
 * Görünen ad ilk üründen (`productBrand`) alınır. Logo BrandLogo ile marka
 * adından/domaininden çözülür.
 */
import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Tag, Store as StoreIcon, ChevronRight, SlidersHorizontal, ArrowDownUp, Check, Search, Shirt, Home, Smartphone, Baby, Dumbbell, Gem, Package } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCard } from '@/components/market/product-card';
import { DonationStrips } from '@/components/market/donation-strips';
import { ProductCategoryStrips } from '@/components/market/product-category-strips';
import { ProductGridWithAds } from '@/components/market/product-grid-ads';
import { isFalseBrandMatch } from '@/lib/market/brand-extract';
import { donationAmountTRY } from '@/lib/market/donation-value';
import { realCategoryOf } from '@/lib/market/category-utils';
import { BrandLogo } from '@/components/market/brand-logo';
import { BrandCover } from '@/components/market/brand-cover';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { collection, limit, query, where, getCountFromServer } from 'firebase/firestore';
import type { CanonicalProduct } from '@/lib/feed/types';
import type { Brand } from '@/lib/types';

// İki mağaza adını eşleştirmek için gevşek normalize (büyük/küçük + boşluk + TR).
const normStore = (s: string) => (s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
const srcPrefix = (s?: string) => (s === 'affocean' ? 'ao' : s === 'reklamaction' ? 'ra' : s === 'gelirortaklari' ? 'go' : '');

// Kategori adı → temsili ikon (market ana sayfası hızlı kutucuklarıyla aynı desen).
function iconForCategory(name: string): React.ComponentType<{ className?: string }> {
  const n = (name || '').toLocaleLowerCase('tr');
  if (/giyim|moda|tekstil|elbise|ayakkab|çanta|aksesuar|erkek|kadın|kadin|unisex/.test(n)) return Shirt;
  if (/ev|mobilya|dekor|mutfak|bahçe|yaşam/.test(n)) return Home;
  if (/elektronik|telefon|bilgisayar|teknoloji|tablet|mikrofon|kulaklık|kulaklik|ses/.test(n)) return Smartphone;
  if (/bebek|çocuk|anne|oyuncak/.test(n)) return Baby;
  if (/spor|fitness|outdoor|kamp/.test(n)) return Dumbbell;
  if (/kozmetik|güzellik|bakım|takı|mücevher|saat/.test(n)) return Gem;
  return Package;
}

export default function BrandProfilePage() {
  const params = useParams();
  const key = decodeURIComponent((params.brand as string) || '');
  const db = useFirestore();

  const productsQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.products), where('productBrandKey', '==', key), limit(120)) : null),
    [db, key],
  );
  const { data: products, isLoading } = useCollection<CanonicalProduct>(productsQuery);

  // Mağaza (satıcı) katalogu — gerçek logo + oran + profil linki için.
  const storesQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.brands) : null), [db]);
  const { data: allStores } = useCollection<Brand>(storesQuery);
  const storeByName = useMemo(() => {
    const m = new Map<string, Brand>();
    for (const b of allStores ?? []) if (b?.name) m.set(normStore(b.name), b);
    return m;
  }, [allStores]);

  // TAM ürün sayısı (sunucudan) — "120+" değil gerçek toplam.
  const [totalCount, setTotalCount] = useState<number | null>(null);
  useEffect(() => {
    if (!db || !key) return;
    let alive = true;
    getCountFromServer(query(collection(db, COLLECTIONS.products), where('productBrandKey', '==', key)))
      .then((s) => { if (alive) setTotalCount(s.data().count); })
      .catch(() => {});
    return () => { alive = false; };
  }, [db, key]);

  // Görünen marka adı = ürünlerdeki productBrand (kanonik, tek yazım).
  const brandName = useMemo(() => products?.find((p) => p.productBrand)?.productBrand || key, [products, key]);

  // Ortalama bağış oranı (kartlarda ürün oranı yoksa marka ort.).
  const avgRate = useMemo(() => {
    if (!products?.length) return 0;
    const rates = products.map((p) => Number(p.donationRate)).filter((r) => Number.isFinite(r) && r > 0);
    return rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
  }, [products]);

  // Bu markayı satan MAĞAZALAR — logo + bağış oranı + profil linki ile.
  // (topRate stores'a bağlı olduğundan stores tanımından SONRA hesaplanır.)
  const stores = useMemo(() => {
    const map = new Map<string, { name: string; storeId: string; rateSum: number; rateCount: number }>();
    for (const p of products ?? []) {
      if (!p.brandName) continue;
      const cur = map.get(p.brandName) ?? { name: p.brandName, storeId: '', rateSum: 0, rateCount: 0 };
      const r = Number(p.donationRate);
      if (Number.isFinite(r) && r > 0) { cur.rateSum += r; cur.rateCount += 1; }
      if (!cur.storeId) {
        const pre = srcPrefix(p.source);
        cur.storeId = p.brandId || (pre && p.feedId ? `${pre}-${p.feedId}` : '');
      }
      map.set(p.brandName, cur);
    }
    return Array.from(map.values()).map((s) => {
      const doc = storeByName.get(normStore(s.name));
      const rate = doc && Number(doc.donationRate) > 0
        ? Math.round(Number(doc.donationRate))
        : (s.rateCount ? Math.round(s.rateSum / s.rateCount) : 0);
      const brand = (doc ?? { id: s.storeId || s.name, slug: s.storeId || s.name, name: s.name, category: '', type: 'brand', logoUrl: '', targetDomain: '', donationRate: rate }) as Brand;
      const storeId = (doc?.slug || doc?.id || s.storeId || '').toString();
      return { name: s.name, rate, brand, storeId };
    }).sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name, 'tr')); // en çok bağışlayan mağaza önce
  }, [products, storeByName]);

  // EN YÜKSEK bağış oranı — satan mağazaların ve ürünlerin en yükseği (ort. değil).
  const topRate = useMemo(() => {
    let max = 0;
    for (const s of stores) if (s.rate > max) max = s.rate;
    for (const p of products ?? []) {
      const r = Number(p.donationRate);
      if (Number.isFinite(r) && r > max) max = Math.round(r);
    }
    return max;
  }, [stores, products]);

  const brandForLogo = { id: key, slug: key, name: brandName, category: '', type: 'brand', logoUrl: '', targetDomain: '', donationRate: avgRate } as Brand;

  // ── Arama + Kategori ikon çipleri + Filtre/Sırala ──
  const [activeCat, setActiveCat] = useState<string>('Tümü');
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<'default' | 'donation' | 'donationAmount' | 'priceAsc' | 'priceDesc' | 'discount'>('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);

  // Kategori çipleri — ürünlerin GERÇEK kategorisinden (yol değil ilk anlamlı segment),
  // ürün sayısına göre çoktan aza. Her çipin bir ikonu olur.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products ?? []) {
      const c = realCategoryOf(p.category);
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr')).map(([c]) => c);
    return ['Tümü', ...sorted];
  }, [products]);

  const isDeal = (p: CanonicalProduct) => typeof p.salePrice === 'number' && p.salePrice > 0 && p.salePrice < p.price;
  // Marka yanlış eşleşmesini ele (ör. Apple: "apple cider"/"green apple" meyve ürünleri).
  const cleanProducts = useMemo(
    () => (products ?? []).filter((p) => !isFalseBrandMatch(brandName, p.title || '')),
    [products, brandName],
  );
  const shown = useMemo(() => {
    let list = [...cleanProducts];
    if (activeCat !== 'Tümü') list = list.filter((p) => realCategoryOf(p.category) === activeCat);
    const term = q.toLocaleLowerCase('tr-TR').trim();
    if (term) {
      list = list.filter((p) => {
        if ((p.title || '').toLocaleLowerCase('tr-TR').includes(term)) return true;
        return (p.searchTokens ?? []).some((t) => (t || '').toLocaleLowerCase('tr-TR').includes(term));
      });
    }
    if (inStockOnly) list = list.filter((p) => { const a = (p.availability || '').toLowerCase(); return !a || a.includes('stock') || a.includes('stok'); });
    if (dealsOnly) list = list.filter(isDeal);
    const price = (p: CanonicalProduct) => (typeof p.salePrice === 'number' && p.salePrice > 0 ? p.salePrice : p.price);
    const discount = (p: CanonicalProduct) => (isDeal(p) ? 1 - (p.salePrice as number) / p.price : 0);
    switch (sortKey) {
      case 'donation': list.sort((a, b) => (Number(b.donationRate) || 0) - (Number(a.donationRate) || 0)); break;
      case 'donationAmount': list.sort((a, b) => donationAmountTRY(b, Number(b.donationRate) || avgRate) - donationAmountTRY(a, Number(a.donationRate) || avgRate)); break;
      case 'priceAsc': list.sort((a, b) => price(a) - price(b)); break;
      case 'priceDesc': list.sort((a, b) => price(b) - price(a)); break;
      case 'discount': list.sort((a, b) => discount(b) - discount(a)); break;
    }
    return list;
  }, [cleanProducts, activeCat, q, inStockOnly, dealsOnly, sortKey, avgRate]);
  const activeFilterCount = (inStockOnly ? 1 : 0) + (dealsOnly ? 1 : 0);

  return (
    <div className="flex min-h-full w-full max-w-full flex-col overflow-x-hidden bg-secondary/30">
      {/* Üst bar */}
      <div className="sticky top-0 z-20 flex w-full items-center gap-2 border-b border-border bg-background px-4 py-2.5">
        <Link href="/market/brands/all" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl hover:bg-muted" aria-label="Geri">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
          <h1 className="text-sm font-bold text-foreground">Marka</h1>
        </div>
      </div>

      {/* Kapak banner'ı — Trendyol tarzı, marka renginden türetilmiş gradyan */}
      <BrandCover brandName={brandName} brand={brandForLogo} topRate={topRate} />

      {/* Marka başlığı */}
      <div className="flex items-center gap-3.5 border-b border-border bg-background px-4 py-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-card">
          <BrandLogo brand={brandForLogo} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-foreground">{brandName}</h2>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {totalCount != null
              ? `${totalCount.toLocaleString('tr-TR')} ürün`
              : (products?.length ? `${products.length.toLocaleString('tr-TR')} ürün` : 'Ürünler yükleniyor…')}
            {topRate > 0 && <> · en yüksek <span className="text-primary font-bold">%{topRate}</span> bağış</>}
          </p>
        </div>
      </div>

      {/* Bu markayı satan mağazalar */}
      {stores.length > 0 && (
        <div className="border-b border-border bg-background px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <StoreIcon className="h-3.5 w-3.5" /> Bu markayı satan mağazalar
          </div>
          <div className="flex flex-wrap gap-2">
            {stores.map((s) => (
              <Link
                key={s.name}
                href={s.storeId ? `/market/${encodeURIComponent(s.storeId)}` : `/market/products?brand=${encodeURIComponent(s.name)}`}
                className="group flex items-center gap-2.5 rounded-2xl border border-border bg-card px-2.5 py-2 pr-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
                  <BrandLogo brand={s.brand} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-foreground">{s.name}</span>
                  {s.rate > 0 && <span className="block text-[11px] font-semibold text-primary">%{s.rate} bağış</span>}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Arama + Filtre/Sırala + Kategori ikon çipleri */}
      {(products?.length ?? 0) > 0 && (
        <div className="sticky top-[57px] z-10 border-b border-border bg-background px-3 py-2">
          {/* Arama çubuğu (marka ürünlerinde) + Filtre/Sırala */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`${brandName} ürünlerinde ara`}
                className="h-10 w-full rounded-full border border-border bg-secondary/60 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full" aria-label={`Filtre${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}>
                  <span className="relative">
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeFilterCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{activeFilterCount}</span>}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrele</DropdownMenuLabel>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setInStockOnly((v) => !v); }}>
                  {inStockOnly ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-2 w-4" />} Yalnız stokta
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setDealsOnly((v) => !v); }}>
                  {dealsOnly ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-2 w-4" />} Yalnız indirimli
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full" aria-label="Sırala">
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sırala</DropdownMenuLabel>
                {([['default', 'Önerilen'], ['donation', 'Bağış oranı (çok→az)'], ['donationAmount', 'Bağış ₺ (çok→az)'], ['discount', 'İndirim (çok→az)'], ['priceAsc', 'Fiyat (az→çok)'], ['priceDesc', 'Fiyat (çok→az)']] as const).map(([k, label]) => (
                  <DropdownMenuItem key={k} onSelect={() => setSortKey(k)}>
                    {sortKey === k ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-2 w-4" />} {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Kategori ikon çipleri (yatay kaydırma) */}
          {categories.length > 1 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((c) => {
                const Icon = c === 'Tümü' ? Tag : iconForCategory(c);
                const active = activeCat === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveCat(c)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                      active ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/70',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {c}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Ürün grid */}
      <main className="w-full max-w-full overflow-x-hidden p-4 pb-32">
        {/* Bağış şeritleri + KATEGORİ şeritleri (Telefon/Bilgisayar/Tablet…) — filtre yokken */}
        {!isLoading && activeCat === 'Tümü' && activeFilterCount === 0 && !q.trim() && cleanProducts.length >= 3 && (
          <>
            <DonationStrips products={cleanProducts} className="mb-6" />
            <ProductCategoryStrips products={cleanProducts} className="mb-6" />
          </>
        )}
        {isLoading && !products?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : !shown.length ? (
          <EmptyState icon={Tag} title="Ürün bulunamadı" description={activeCat !== 'Tümü' || activeFilterCount > 0 ? 'Seçili filtrelere uygun ürün yok.' : 'Bu markaya ait ürün şu an listede yok.'} />
        ) : (
          <ProductGridWithAds
            items={shown}
            adPlacement="brand"
            adContext={{ brand: key }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            renderCard={(p) => <ProductCard key={p.id} product={p} donationRate={Number(p.donationRate) || avgRate} />}
          />
        )}
      </main>
    </div>
  );
}
