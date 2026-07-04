'use client';

/**
 * MarketListing — Trendyol-tarzı paylaşılan ürün listeleme bloğu.
 *
 * Bir ürün listesi alır; kategori chip'leri + sıralama (bağış %, bağış ₺, fiyat,
 * indirim) + stok/indirim filtreleri + bağış şeritleri (Yüzdeyle/Tutarla) + ürün
 * grid'i render eder. Marka profili, MAĞAZA profili ve KATEGORİ sayfaları paylaşır.
 */

import React, { useMemo, useState } from 'react';
import { SlidersHorizontal, ArrowDownUp, Check, PackageX } from 'lucide-react';
import { ProductCard } from '@/components/market/product-card';
import { DonationStrips } from '@/components/market/donation-strips';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
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
}: {
  products: CanonicalProduct[];
  resolveRate?: (p: CanonicalProduct) => number;
  showStrips?: boolean;
  initialPageSize?: number;
  /** Verilirse grid'e her 5 satırda bir (rowSlot×5. üründen sonra) reklam banner'ı girer. */
  adPlacement?: AdPlacement;
}) {
  const rate = resolveRate || ((p: CanonicalProduct) => Number(p.donationRate) || 0);
  const ads = useMarketAds(adPlacement ?? 'home');
  const [activeCat, setActiveCat] = useState('Tümü');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const categories = useMemo(() => {
    const c = new Set<string>();
    for (const p of products) if (p.category) c.add(p.category);
    return ['Tümü', ...Array.from(c).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [products]);

  const shown = useMemo(() => {
    let list = [...products];
    if (activeCat !== 'Tümü') list = list.filter((p) => p.category === activeCat);
    if (inStockOnly) list = list.filter(inStock);
    if (dealsOnly) list = list.filter(isDeal);
    switch (sortKey) {
      case 'donation': list.sort((a, b) => rate(b) - rate(a)); break;
      case 'donationAmount': list.sort((a, b) => donationAmountTRY(b, rate(b)) - donationAmountTRY(a, rate(a))); break;
      case 'discount': list.sort((a, b) => discountPct(b) - discountPct(a)); break;
      case 'priceAsc': list.sort((a, b) => effPrice(a) - effPrice(b)); break;
      case 'priceDesc': list.sort((a, b) => effPrice(b) - effPrice(a)); break;
      default: break;
    }
    return list;
  }, [products, activeCat, sortKey, inStockOnly, dealsOnly, rate]);

  const visible = shown.slice(0, pageSize);

  return (
    <div className="space-y-4">
      {/* Kategori chip'leri */}
      {categories.length > 2 && (
        <div className="flex w-full gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => { setActiveCat(c); setPageSize(initialPageSize); }}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors',
                activeCat === c ? 'border-primary bg-primary text-white' : 'border-border bg-card text-foreground hover:border-primary/40',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Sırala + filtreler */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{shown.length.toLocaleString('tr-TR')} ürün</span>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Bağış şeritleri — filtre yokken */}
      {showStrips && activeCat === 'Tümü' && !dealsOnly && products.length >= 6 && (
        <DonationStrips products={products} resolveRate={resolveRate} className="pt-1" />
      )}

      {/* Grid */}
      {shown.length === 0 ? (
        <EmptyState icon={PackageX} title="Ürün bulunamadı" description="Seçili filtrelere uygun ürün yok." />
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
