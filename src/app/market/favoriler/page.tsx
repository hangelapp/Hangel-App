'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCard } from '@/components/market/product-card';
import { useFavorites } from '@/hooks/use-favorites';
import type { CanonicalProduct } from '@/lib/feed/types';

/**
 * Favorilerim — kullanıcının favori ürünleri. Fav dokümanlarındaki SNAPSHOT'tan
 * (ekstra okuma olmadan) CanonicalProduct-benzeri obje kurup ProductCard ile listeler.
 */
export default function FavorilerPage() {
  const { favorites, loading, signedIn } = useFavorites();

  // Fav snapshot → ProductCard'ın beklediği CanonicalProduct şekli (eksik alanlar makul varsayılan).
  const products: CanonicalProduct[] = favorites.map((f) => ({
    id: f.productId || f.id,
    source: '',
    feedId: '',
    offerId: '',
    brandName: f.brandName ?? '',
    externalId: f.productId || f.id,
    title: f.title ?? '',
    price: typeof f.price === 'number' ? f.price : 0,
    salePrice: typeof f.salePrice === 'number' ? f.salePrice : null,
    currency: 'TRY',
    imageLink: f.imageLink ?? undefined,
    productUrl: '',
    donationRate: typeof f.donationRate === 'number' ? f.donationRate : undefined,
    updatedAt: 0,
  }));

  return (
    <div className="flex h-full flex-col bg-secondary/30">
      <div className="sticky top-12 z-20 shrink-0 border-b bg-background p-4">
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
          <h1 className="text-xl font-black">Favorilerim</h1>
        </div>
        <p className="mt-1 pl-12 text-xs text-muted-foreground">
          🔔 Favorilerinin fiyatı düşünce sana haber veririz.
        </p>
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-32">
        {!signedIn ? (
          <EmptyState
            icon={Heart}
            title="Favorileriniz için giriş yapın"
            description="Beğendiğiniz ürünleri favorilere ekleyip buradan takip edebilmek için giriş yapmanız gerekir."
            action={{ label: 'Giriş yap', href: '/login' }}
          />
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Henüz favori yok"
            description="Beğendiğiniz ürünlerdeki kalbe dokunarak favorilerinize ekleyin."
            action={{ label: 'Ürünlere göz at', href: '/market/products' }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
