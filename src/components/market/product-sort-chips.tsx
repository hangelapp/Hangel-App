'use client';

/**
 * Ürün listelerinin üstünde pazaryeri tarzı sıralama çipleri (İndirimliler / En çok
 * bağış / En uygun fiyat / Yeni gelenler). Arama sonuçları, kategori ve marka/ürün
 * sayfalarında (ör. /market/apple) ortak kullanılır.
 *
 * `sortProducts` saf yardımcı: basit sayfalar (tek bağış oranı) için fallbackRate ile
 * sıralar. Bağış oranı markaya göre değişen sayfalar (market/products) kendi resolver'ını
 * kullanıp yalnız <ProductSortChips/> görselini paylaşabilir.
 */
import { Percent, HeartHandshake, ArrowDownWideNarrow, Sparkles } from 'lucide-react';
import type { CanonicalProduct } from '@/lib/feed/types';

export type SortMode = 'discount' | 'donation' | 'price' | 'new' | null;

const CHIPS = [
  ['discount', 'İndirimliler', Percent],
  ['donation', 'En çok bağış', HeartHandshake],
  ['price', 'En uygun fiyat', ArrowDownWideNarrow],
  ['new', 'Yeni gelenler', Sparkles],
] as const;

export function sortProducts(list: CanonicalProduct[], mode: SortMode, fallbackRate = 0): CanonicalProduct[] {
  if (!mode) return list;
  const eff = (p: CanonicalProduct) => (p.salePrice != null && p.salePrice > 0 ? p.salePrice : p.price);
  const disc = (p: CanonicalProduct) => (p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? 1 - p.salePrice / p.price : -1);
  const rate = (p: CanonicalProduct) => (typeof p.donationRate === 'number' && p.donationRate > 0 ? p.donationRate : fallbackRate);
  const ts = (p: CanonicalProduct) => {
    const u = p as CanonicalProduct & { updatedAt?: number; importedAt?: { seconds?: number } };
    return typeof u.updatedAt === 'number' ? u.updatedAt : (u.importedAt?.seconds ?? 0);
  };
  const l = [...list];
  if (mode === 'discount') l.sort((a, b) => disc(b) - disc(a));
  else if (mode === 'donation') l.sort((a, b) => rate(b) - rate(a));
  else if (mode === 'price') l.sort((a, b) => eff(a) - eff(b));
  else if (mode === 'new') l.sort((a, b) => ts(b) - ts(a));
  return l;
}

export function ProductSortChips({ value, onChange, className }: { value: SortMode; onChange: (m: SortMode) => void; className?: string }) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ''}`}>
      {CHIPS.map(([key, label, Icon]) => (
        <button
          key={key}
          onClick={() => onChange(value === key ? null : key)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${value === key ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background text-foreground/70 hover:border-primary/50'}`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );
}
