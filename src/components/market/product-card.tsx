'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ImageOff, HeartHandshake, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CanonicalProduct } from '@/lib/feed/types';

function formatPrice(value: number, currency: string): string {
  const sym = currency === 'TRY' ? 'TL' : currency;
  return `${value.toLocaleString('tr-TR')} ${sym}`;
}

/**
 * Trendyol-app tarzı ürün kartı. Kompakt, yoğun; TÜM kart ürün detayına (/products/{id})
 * tıklanır (büyük CTA buton yok — Trendyol grid kartlarında olmaz). hangel farkı:
 * sol üstte 🧡 BAĞIŞ ORANI rozeti (markadan çözülür) + sağ üstte favori kalbi.
 */
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

  const [fav, setFav] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-md">
      {/* Görsel */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-white">
        {product.imageLink ? (
          <img
            src={product.imageLink}
            alt={product.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <ImageOff className="h-9 w-9" aria-hidden="true" />
          </div>
        )}

        {/* Bağış oranı rozeti — hangel imzası */}
        {donationRate !== null && (
          <span className="pointer-events-none absolute left-1.5 top-1.5 z-[2] inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <HeartHandshake className="h-2.5 w-2.5" aria-hidden="true" />%{donationRate} bağış
          </span>
        )}

        {/* Favori kalbi (örtü-linkin üstünde — sayfaya gitmez) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFav((v) => !v);
          }}
          aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          className="absolute right-1.5 top-1.5 z-[2] flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white"
        >
          <Heart
            className={cn(
              'h-3.5 w-3.5 transition-colors',
              fav ? 'fill-primary text-primary' : 'text-muted-foreground',
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Bilgi — Trendyol kompakt */}
      <div className="flex flex-1 flex-col gap-0.5 px-2 pb-2 pt-1.5">
        <p className="break-words text-xs font-bold text-foreground">{product.brandName}</p>
        <p className="line-clamp-2 min-h-[1.9rem] text-[11px] leading-tight text-muted-foreground">
          {product.title}
        </p>

        {/* Fiyat satırı — Trendyol tarzı */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {hasSale ? (
            <>
              {discountPct > 0 && (
                <span className="rounded bg-emerald-500/15 px-1 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  %{discountPct}
                </span>
              )}
              <span className="text-sm font-extrabold text-primary">
                {formatPrice(salePrice, product.currency)}
              </span>
              <span className="text-[10px] text-muted-foreground line-through">
                {formatPrice(product.price, product.currency)}
              </span>
            </>
          ) : (
            <span className="text-sm font-extrabold text-foreground">
              {formatPrice(product.price, product.currency)}
            </span>
          )}
        </div>
      </div>

      {/* Tüm kartı tıklanır yapan örtü link (Trendyol: kart → ürün detayı) */}
      <Link
        href={`/products/${product.id}`}
        className="absolute inset-0 z-[1]"
        aria-label={product.title}
      />
    </div>
  );
}

export default ProductCard;
