'use client';

import Link from 'next/link';
import { ExternalLink, ImageOff, HeartHandshake } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CanonicalProduct } from '@/lib/feed/types';

function formatPrice(value: number, currency: string): string {
  return `${value.toLocaleString('tr-TR')} ${currency}`;
}

export function ProductCard({ product }: { product: CanonicalProduct }) {
  const hasSale =
    typeof product.salePrice === 'number' && product.salePrice < product.price;
  const donationRate =
    typeof product.donationRate === 'number' && product.donationRate > 0
      ? product.donationRate
      : null;

  return (
    <Card variant="glass" className="flex flex-col overflow-hidden rounded-2xl">
      <Link
        href={`/products/${product.id}`}
        className="group relative block aspect-square w-full overflow-hidden bg-white"
      >
        {product.imageLink ? (
          <img
            src={product.imageLink}
            alt={product.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain p-2 transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
            <ImageOff className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        {donationRate !== null && (
          <Badge className="absolute left-2 top-2 gap-1 bg-primary text-white">
            <HeartHandshake className="h-3 w-3" aria-hidden="true" />
            ~%{donationRate} bağış
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {product.brandName}
        </p>
        <Link href={`/products/${product.id}`} className="hover:text-primary">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          {hasSale ? (
            <>
              <span className="text-base font-black text-primary">
                {formatPrice(product.salePrice as number, product.currency)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price, product.currency)}
              </span>
            </>
          ) : (
            <span className="text-base font-black text-foreground">
              {formatPrice(product.price, product.currency)}
            </span>
          )}
        </div>

        <Button asChild size="sm" className="mt-2 w-full rounded-xl gap-2">
          <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
            Ürüne Git
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </Card>
  );
}

export default ProductCard;
