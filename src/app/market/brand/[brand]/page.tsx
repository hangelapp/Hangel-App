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
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Tag, Store as StoreIcon } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCard } from '@/components/market/product-card';
import { BrandLogo } from '@/components/market/brand-logo';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { collection, limit, query, where } from 'firebase/firestore';
import type { CanonicalProduct } from '@/lib/feed/types';
import type { Brand } from '@/lib/types';

export default function BrandProfilePage() {
  const params = useParams();
  const key = decodeURIComponent((params.brand as string) || '');
  const db = useFirestore();

  const productsQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.products), where('productBrandKey', '==', key), limit(120)) : null),
    [db, key],
  );
  const { data: products, isLoading } = useCollection<CanonicalProduct>(productsQuery);

  // Görünen marka adı = ürünlerdeki productBrand (kanonik, tek yazım).
  const brandName = useMemo(() => products?.find((p) => p.productBrand)?.productBrand || key, [products, key]);

  // Ortalama bağış oranı (kartlarda ürün oranı yoksa marka ort.).
  const avgRate = useMemo(() => {
    if (!products?.length) return 0;
    const rates = products.map((p) => Number(p.donationRate)).filter((r) => Number.isFinite(r) && r > 0);
    return rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
  }, [products]);

  // Bu markanın satıldığı MAĞAZALAR (brandName = mağaza) — tekilleştir.
  const stores = useMemo(() => {
    const s = new Set<string>();
    for (const p of products ?? []) if (p.brandName) s.add(p.brandName);
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [products]);

  const brandForLogo = { id: key, slug: key, name: brandName, category: '', type: 'brand', logoUrl: '', targetDomain: '', donationRate: avgRate } as Brand;

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

      {/* Marka başlığı */}
      <div className="flex items-center gap-3.5 border-b border-border bg-background px-4 py-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-card">
          <BrandLogo brand={brandForLogo} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-foreground">{brandName}</h2>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {products?.length ? `${products.length}${products.length >= 120 ? '+' : ''} ürün` : 'Ürünler yükleniyor…'}
            {avgRate > 0 && <> · ort. <span className="text-primary font-bold">%{avgRate}</span> bağış</>}
          </p>
        </div>
      </div>

      {/* Bu markayı satan mağazalar */}
      {stores.length > 0 && (
        <div className="border-b border-border bg-background px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <StoreIcon className="h-3.5 w-3.5" /> Bu markayı satan mağazalar
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stores.map((s) => (
              <Link key={s} href={`/market/products?brand=${encodeURIComponent(s)}`} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary">
                {s}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ürün grid */}
      <main className="w-full max-w-full overflow-x-hidden p-4 pb-32">
        {isLoading && !products?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : !products?.length ? (
          <EmptyState icon={Tag} title="Ürün bulunamadı" description="Bu markaya ait ürün şu an listede yok." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
