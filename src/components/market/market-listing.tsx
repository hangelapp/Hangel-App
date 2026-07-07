'use client';

/**
 * MarketListing — Trendyol-tarzı paylaşılan ürün listeleme bloğu.
 *
 * Bir ürün listesi alır; kategori chip'leri + sıralama (bağış %, bağış ₺, fiyat,
 * indirim) + stok/indirim filtreleri + bağış şeritleri (Yüzdeyle/Tutarla) + ürün
 * grid'i render eder. Marka profili, MAĞAZA profili ve KATEGORİ sayfaları paylaşır.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, ArrowDownUp, Check, PackageX, Search, X, Tag } from 'lucide-react';
import { ProductCard } from '@/components/market/product-card';
import { DonationStrips } from '@/components/market/donation-strips';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { CanonicalProduct } from '@/lib/feed/types';
import { donationAmountTRY } from '@/lib/market/donation-value';
import { AdBannerCard } from '@/components/market/ad-banner';
import { useMarketAds } from '@/hooks/use-market-ads';
import type { AdPlacement } from '@/lib/market/ad-banners';

// Grid'de YAKLAŞIK sütun sayısı — yalnız reklam satırı matematiği için (rowSlot × bu =
// banner'ın gireceği ürün indeksi). Grid xl'de 6 sütuna çıktı; bu değer yaklaşık kalır.
const GRID_COLS = 5;
// Reklam banner'ı her kırılımda TÜM sütunları kaplasın (xl'de 6 sütun).
const AD_SPAN = 'col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6';

type SortKey = 'default' | 'donation' | 'donationAmount' | 'priceAsc' | 'priceDesc' | 'discount';

const SORTS: [SortKey, string][] = [
  ['default', 'Önerilen'],
  ['donation', 'Bağış oranı (çok→az)'],
  ['donationAmount', 'Bağış tutarı ₺ (çok→az)'],
  ['discount', 'İndirim (çok→az)'],
  ['priceAsc', 'Fiyat (az→çok)'],
  ['priceDesc', 'Fiyat (çok→az)'],
];

const effPrice = (p: CanonicalProduct) => (typeof p.salePrice === 'number' && p.salePrice > 0 ? p.salePrice : p.price);
const isDeal = (p: CanonicalProduct) => typeof p.salePrice === 'number' && p.salePrice > 0 && p.salePrice < p.price;
const discountPct = (p: CanonicalProduct) => (isDeal(p) ? Math.round((1 - (p.salePrice as number) / p.price) * 100) : 0);
const inStock = (p: CanonicalProduct) => { const a = (p.availability || '').toLowerCase(); return !a || a.includes('stock') || a.includes('stok'); };

export function MarketListing({
  products,
  resolveRate,
  showStrips = true,
  initialPageSize = 24,
  adPlacement,
  adContext,
  searchPlaceholder = 'Ürün ara',
  showSearch = true,
  showBrandFilter = true,
  showPriceFilter = true,
}: {
  products: CanonicalProduct[];
  resolveRate?: (p: CanonicalProduct) => number;
  showStrips?: boolean;
  initialPageSize?: number;
  /** Verilirse grid'e her 5 satırda bir (rowSlot×5. üründen sonra) reklam banner'ı girer. */
  adPlacement?: AdPlacement;
  /** Kategori/marka-hedefli reklam filtresi için bağlam. */
  adContext?: { category?: string | null; brand?: string | null };
  /** Arama input yer tutucusu (ör. mağaza adıyla kişiselleştirmek için). */
  searchPlaceholder?: string;
  /** Arama input'unu gizlemek için (varsayılan görünür). */
  showSearch?: boolean;
  /** Marka filtresini gizlemek için (varsayılan görünür). */
  showBrandFilter?: boolean;
  /** Fiyat aralığı filtresini gizlemek için (varsayılan görünür). */
  showPriceFilter?: boolean;
}) {
  const rate = resolveRate || ((p: CanonicalProduct) => Number(p.donationRate) || 0);
  const ads = useMarketAds(adPlacement ?? 'home', adContext);
  const [activeCat, setActiveCat] = useState('Tümü');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Arama — 300ms debounce (görsel input rawQ, filtreleme debouncedQ üzerinden).
  const [rawQ, setRawQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(rawQ); setPageSize(initialPageSize); }, 300);
    return () => clearTimeout(t);
  }, [rawQ, initialPageSize]);

  // Bu mağazadaki (products listesindeki) MARKA seti — productBrand alanından.
  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const b = (p.productBrand || '').trim();
      if (!b) continue;
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'))
      .map(([name, count]) => ({ name, count }));
  }, [products]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());

  // Ürün listesindeki min/max fiyat — slider/input aralığı için.
  const priceBounds = useMemo(() => {
    let min = Infinity;
    let max = 0;
    for (const p of products) {
      const pr = effPrice(p);
      if (!Number.isFinite(pr) || pr <= 0) continue;
      if (pr < min) min = pr;
      if (pr > max) max = pr;
    }
    if (!Number.isFinite(min)) min = 0;
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [products]);
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');

  // Kategori chip'leri — sayaç ile (birden çok kategoriye giren ürün olmadığından toplam = shown).
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const c = (p.category || '').trim();
      if (!c) continue;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const arr = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], 'tr'));
    return [{ name: 'Tümü', count: products.length }, ...arr.map(([name, count]) => ({ name, count }))];
  }, [products]);

  const shown = useMemo(() => {
    let list = [...products];
    if (activeCat !== 'Tümü') list = list.filter((p) => p.category === activeCat);
    if (inStockOnly) list = list.filter(inStock);
    if (dealsOnly) list = list.filter(isDeal);
    if (selectedBrands.size > 0) {
      list = list.filter((p) => !!p.productBrand && selectedBrands.has(p.productBrand));
    }
    const pMin = priceMin === '' ? null : Number(priceMin);
    const pMax = priceMax === '' ? null : Number(priceMax);
    if (pMin != null && Number.isFinite(pMin)) list = list.filter((p) => effPrice(p) >= pMin);
    if (pMax != null && Number.isFinite(pMax) && pMax > 0) list = list.filter((p) => effPrice(p) <= pMax);
    const term = debouncedQ.toLocaleLowerCase('tr-TR').trim();
    if (term) {
      list = list.filter((p) => {
        if ((p.title || '').toLocaleLowerCase('tr-TR').includes(term)) return true;
        return (p.searchTokens ?? []).some((t) => (t || '').toLocaleLowerCase('tr-TR').includes(term));
      });
    }
    switch (sortKey) {
      case 'donation': list.sort((a, b) => rate(b) - rate(a)); break;
      case 'donationAmount': list.sort((a, b) => donationAmountTRY(b, rate(b)) - donationAmountTRY(a, rate(a))); break;
      case 'discount': list.sort((a, b) => discountPct(b) - discountPct(a)); break;
      case 'priceAsc': list.sort((a, b) => effPrice(a) - effPrice(b)); break;
      case 'priceDesc': list.sort((a, b) => effPrice(b) - effPrice(a)); break;
      default: break;
    }
    return list;
  }, [products, activeCat, sortKey, inStockOnly, dealsOnly, rate, selectedBrands, priceMin, priceMax, debouncedQ]);

  const toggleBrand = (name: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setPageSize(initialPageSize);
  };
  const clearAllFilters = () => {
    setSelectedBrands(new Set());
    setPriceMin('');
    setPriceMax('');
    setInStockOnly(false);
    setDealsOnly(false);
    setActiveCat('Tümü');
    setPageSize(initialPageSize);
  };
  const activeExtraFilters =
    (inStockOnly ? 1 : 0) +
    (dealsOnly ? 1 : 0) +
    (selectedBrands.size > 0 ? 1 : 0) +
    (priceMin !== '' || priceMax !== '' ? 1 : 0);

  const visible = shown.slice(0, pageSize);

  return (
    <div className="space-y-4">
      {/* Arama — 300ms debounce ile ürün adında + searchTokens'ta arar */}
      {showSearch && (
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="text"
            value={rawQ}
            onChange={(e) => setRawQ(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Ürün ara"
            className="h-10 rounded-full border-border bg-secondary/60 pl-9 pr-9 text-sm"
          />
          {rawQ && (
            <button
              type="button"
              onClick={() => setRawQ('')}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Aramayı temizle"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Kategori chip'leri — her chip'te ürün sayısı badge'i */}
      {categories.length > 2 && (
        <div className="flex w-full gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => { setActiveCat(c.name); setPageSize(initialPageSize); }}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors',
                activeCat === c.name ? 'border-primary bg-primary text-white' : 'border-border bg-card text-foreground hover:border-primary/40',
              )}
            >
              <span>{c.name}</span>
              <span
                className={cn(
                  'inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black tracking-tighter',
                  activeCat === c.name ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground',
                )}
              >
                {c.count.toLocaleString('tr-TR')}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Sırala + filtreler (fiyat aralığı + marka + stok/indirim) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{shown.length.toLocaleString('tr-TR')} ürün</span>
        <div className="flex flex-wrap items-center gap-2">
          {showPriceFilter && priceBounds.max > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={priceMin !== '' || priceMax !== '' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 rounded-full text-xs"
                >
                  <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> Fiyat
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Fiyat aralığı ({priceBounds.min.toLocaleString('tr-TR')} ₺ – {priceBounds.max.toLocaleString('tr-TR')} ₺)
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={priceMin}
                      onChange={(e) => { setPriceMin(e.target.value); setPageSize(initialPageSize); }}
                      placeholder={`min ${priceBounds.min}`}
                      aria-label="En düşük fiyat"
                      className="h-9 rounded-xl text-sm"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={priceMax}
                      onChange={(e) => { setPriceMax(e.target.value); setPageSize(initialPageSize); }}
                      placeholder={`max ${priceBounds.max}`}
                      aria-label="En yüksek fiyat"
                      className="h-9 rounded-xl text-sm"
                    />
                  </div>
                  {(priceMin !== '' || priceMax !== '') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full rounded-xl text-xs"
                      onClick={() => { setPriceMin(''); setPriceMax(''); setPageSize(initialPageSize); }}
                    >
                      Sıfırla
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {showBrandFilter && brandOptions.length > 1 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={selectedBrands.size > 0 ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 rounded-full text-xs"
                >
                  <Tag className="mr-1 h-3.5 w-3.5" /> Marka
                  {selectedBrands.size > 0 && (
                    <Badge className="ml-1 h-4 min-w-4 rounded-full bg-white/25 px-1 text-[10px] font-black text-white">
                      {selectedBrands.size}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">Marka</div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {brandOptions.map((b) => {
                    const active = selectedBrands.has(b.name);
                    return (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => toggleBrand(b.name)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', active ? 'border-primary bg-primary text-white' : 'border-border bg-card')}>
                            {active && <Check className="h-3 w-3" />}
                          </span>
                          <span className="truncate font-medium text-foreground">{b.name}</span>
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{b.count.toLocaleString('tr-TR')}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedBrands.size > 0 && (
                  <div className="border-t border-border p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full rounded-xl text-xs"
                      onClick={() => { setSelectedBrands(new Set()); setPageSize(initialPageSize); }}
                    >
                      Seçimi temizle
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}
          <Button variant={inStockOnly ? 'default' : 'outline'} size="sm" className="h-8 rounded-full text-xs" onClick={() => { setInStockOnly((v) => !v); setPageSize(initialPageSize); }}>
            Stokta
          </Button>
          <Button variant={dealsOnly ? 'default' : 'outline'} size="sm" className="h-8 rounded-full text-xs" onClick={() => { setDealsOnly((v) => !v); setPageSize(initialPageSize); }}>
            <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> İndirimli
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-full text-xs"><ArrowDownUp className="mr-1 h-3.5 w-3.5" /> Sırala</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sırala</DropdownMenuLabel>
              {SORTS.map(([k, label]) => (
                <DropdownMenuItem key={k} onSelect={() => setSortKey(k)}>
                  {sortKey === k ? <Check className="mr-2 h-4 w-4" /> : <span className="mr-2 w-4" />} {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {activeExtraFilters > 0 && (
            <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs text-muted-foreground" onClick={clearAllFilters}>
              <X className="mr-1 h-3.5 w-3.5" /> Temizle
            </Button>
          )}
        </div>
      </div>

      {/* Bağış şeritleri — hiçbir filtre/arama aktif değilken */}
      {showStrips && activeCat === 'Tümü' && !dealsOnly && !inStockOnly && selectedBrands.size === 0 && priceMin === '' && priceMax === '' && !debouncedQ && products.length >= 6 && (
        <DonationStrips products={products} resolveRate={resolveRate} className="pt-1" />
      )}

      {/* Grid */}
      {shown.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title="Ürün bulunamadı"
          description={debouncedQ ? `"${debouncedQ}" için sonuç yok. Filtreleri temizlemeyi deneyin.` : 'Seçili filtrelere uygun ürün yok.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visible.map((p, i) => {
              const card = <ProductCard key={p.id} product={p} donationRate={resolveRate ? resolveRate(p) : undefined} />;
              // Reklam: rowSlot×5. üründen sonra tam-genişlik banner (yalnız adPlacement verildiyse).
              if (!adPlacement) return card;
              const slotAds = ads.filter((b) => b.rowSlot * GRID_COLS - 1 === i);
              if (slotAds.length === 0) return card;
              return (
                <React.Fragment key={p.id}>
                  {card}
                  {slotAds.map((b) => (
                    <div key={`ad-${b.id}`} className={AD_SPAN}>
                      <AdBannerCard banner={b} />
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
          {shown.length > visible.length && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" className="rounded-full px-8" onClick={() => setPageSize((n) => n + 24)}>
                Daha fazla göster ({(shown.length - visible.length).toLocaleString('tr-TR')} ürün)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
