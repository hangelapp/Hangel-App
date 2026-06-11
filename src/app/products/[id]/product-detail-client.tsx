'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  ImageOff,
  HeartHandshake,
  PackageCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { doc } from 'firebase/firestore';
import type { CanonicalProduct } from '@/lib/feed/types';

function formatPrice(value: number, currency: string): string {
  return `${value.toLocaleString('tr-TR')} ${currency}`;
}

export function ProductDetailClient({ id }: { id: string }) {
  const db = useFirestore();
  const productRef = useMemoFirebase(
    () => doc(db, COLLECTIONS.products, id),
    [db, id]
  );
  const { data: product, isLoading } = useDoc<CanonicalProduct>(productRef);

  const images = useMemo(() => {
    if (!product) return [] as string[];
    const all = [product.imageLink, ...(product.additionalImages || [])].filter(
      (src): src is string => !!src
    );
    return Array.from(new Set(all));
  }, [product]);

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const mainImage = activeImage || images[0] || null;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b bg-background p-4">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/market/products">
              <ArrowLeft className="h-4 w-4" />
              Ürünler
            </Link>
          </Button>
        </div>
        <EmptyState
          icon={ImageOff}
          title="Ürün bulunamadı"
          description="Bu ürün kaldırılmış olabilir."
          action={{ label: 'Ürünlere dön', href: '/market/products' }}
        />
      </div>
    );
  }

  const hasSale =
    typeof product.salePrice === 'number' && product.salePrice < product.price;
  const donationRate =
    typeof product.donationRate === 'number' && product.donationRate > 0
      ? product.donationRate
      : null;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-secondary/30 pb-32">
      <div className="sticky top-12 z-20 border-b bg-background p-4">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/market/products">
            <ArrowLeft className="h-4 w-4" />
            Ürünler
          </Link>
        </Button>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
        <Card variant="glass" className="overflow-hidden rounded-2xl bg-white">
          <div className="relative aspect-square w-full">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                <ImageOff className="h-16 w-16" aria-hidden="true" />
              </div>
            )}
          </div>
        </Card>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveImage(src)}
                className={
                  'h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white ' +
                  (mainImage === src ? 'border-primary' : 'border-transparent')
                }
              >
                <img
                  src={src}
                  alt={product.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain p-1"
                />
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {product.brandName}
          </p>
          <h1 className="text-2xl font-black leading-tight">{product.title}</h1>

          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <Badge variant="secondary">{product.category}</Badge>
            )}
            {product.availability && (
              <Badge variant="outline" className="gap-1">
                <PackageCheck className="h-3 w-3" aria-hidden="true" />
                {product.availability}
              </Badge>
            )}
            {donationRate !== null && (
              <Badge className="gap-1 bg-primary text-white">
                <HeartHandshake className="h-3 w-3" aria-hidden="true" />
                ~%{donationRate} bağış
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-3 pt-1">
            {hasSale ? (
              <>
                <span className="text-3xl font-black text-primary">
                  {formatPrice(product.salePrice as number, product.currency)}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.price, product.currency)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-black text-foreground">
                {formatPrice(product.price, product.currency)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="whitespace-pre-line pt-2 text-sm leading-relaxed text-foreground/90">
              {product.description}
            </p>
          )}
        </div>

        <Button asChild size="lg" className="w-full gap-2 rounded-2xl">
          <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
            Ürüne Git
            <ExternalLink className="h-5 w-5" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export default ProductDetailClient;
