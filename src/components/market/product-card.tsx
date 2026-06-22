'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ImageOff, HeartHandshake, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CanonicalProduct } from '@/lib/feed/types';

function formatPrice(value: number, currency: string): string {
  const sym = currency === 'TRY' ? 'TL' : currency;
  return `${value.toLocaleString('tr-TR')} ${sym}`;
}

export function ProductCard({
  product,
  donationRate: donationRateProp,
}: {
  product: CanonicalProduct;
  /** Markadan çözülen bağış oranı (ürünün kendi oranı yoksa kullanılır). */
  donationRate?: number | null;
}) {
  const hasSale =
    typeof product.salePrice === 'number' && product.salePrice < product.price;
  const salePrice = product.salePrice as number;
  const discountPct = hasSale
    ? Math.round((1 - salePrice / product.price) * 100)
    : 0;
  const rawRate = donationRateProp ?? product.donationRate;
  const donationRate =
    typeof rawRate === 'number' && rawRate > 0 ? rawRate : null;

  // Trendyol imzası: favori kalbi. Şimdilik yerel görsel durum (ileride
  // kullanıcı favorilerine kalıcılaştırılabilir).
  const [fav, setFav] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      {/* Görsel */}
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-card"
      >
        {product.imageLink ? (
          <img
            src={product.imageLink}
            alt={product.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <ImageOff className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        {donationRate !== null && (
          <Badge className="absolute left-1.5 top-1.5 gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            <HeartHandshake className="h-3 w-3" aria-hidden="true" />
            %{donationRate} bağış
          </Badge>
        )}
      </Link>

      {/* Favori kalbi (Link dışında — tıklayınca sayfaya gitmez) */}
      <button
        type="button"
        onClick={() => setFav((v) => !v)}
        aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        className="absolute right-1.5 top-1.5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-card/90 shadow-sm ring-1 ring-border backdrop-blur transition-colors hover:bg-card"
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-colors',
            fav ? 'fill-primary text-primary' : 'text-muted-foreground',
          )}
          aria-hidden="true"
        />
      </button>

      {/* Bilgi */}
      <div className="flex flex-1 flex-col gap-0.5 p-2">
        <div className="flex items-baseline gap-1">
          <span className="truncate text-xs font-bold text-foreground">
            {product.brandName}
          </span>
        </div>
        <Link href={`/products/${product.id}`} className="hover:text-primary">
          <h3 className="line-clamp-2 min-h-[2rem] text-xs leading-tight text-muted-foreground">
            {product.title}
          </h3>
        </Link>

        {/* Fiyat satırı — Trendyol tarzı */}
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {hasSale ? (
            <>
              {discountPct > 0 && (
                <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  %{discountPct}
                </span>
              )}
              <span className="text-[15px] font-extrabold text-primary">
                {formatPrice(salePrice, product.currency)}
              </span>
              <span className="text-[11px] text-muted-foreground line-through">
                {formatPrice(product.price, product.currency)}
              </span>
            </>
          ) : (
            <span className="text-[15px] font-extrabold text-foreground">
              {formatPrice(product.price, product.currency)}
            </span>
          )}
        </div>

        {/* Trendyol turuncu CTA */}
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-xs font-bold text-white transition-colors hover:bg-primary/90"
        >
          Ürüne Git
        </a>
      </div>
    </div>
  );
}

export default ProductCard;
