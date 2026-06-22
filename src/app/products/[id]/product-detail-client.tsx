'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  ImageOff,
  HeartHandshake,
  PackageCheck,
  ShieldCheck,
  Store,
  TrendingDown,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { openExternalUrl } from '@/lib/capacitor';
import type { CanonicalProduct } from '@/lib/feed/types';

function formatPrice(value: number, currency: string): string {
  return `${value.toLocaleString('tr-TR')} ${currency}`;
}

// Affiliate sub-id ekle: kullanıcıyı dışa giden URL'de izlenebilir kıl. Çoğu ağ
// `subId`/`sub_id` parametresini destekler ama TAM parametre adı ağa göre değişir
// (örn. AWIN=clickref, Admitad=subid) — kesin eşleme ağ bazında doğrulanmalı.
// Şimdilik iki yaygın anahtarı da ekliyoruz; var olan query string'i bozmuyoruz.
function appendSubId(rawUrl: string, subId: string): string {
  if (!subId) return rawUrl;
  try {
    const u = new URL(rawUrl);
    if (!u.searchParams.has('subId')) u.searchParams.set('subId', subId);
    if (!u.searchParams.has('sub_id')) u.searchParams.set('sub_id', subId);
    return u.toString();
  } catch {
    return rawUrl; // geçersiz URL → olduğu gibi bırak
  }
}

export function ProductDetailClient({ id }: { id: string }) {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [isGoing, setIsGoing] = useState(false);
  const productRef = useMemoFirebase(
    () => doc(db, COLLECTIONS.products, id),
    [db, id]
  );
  const { data: product, isLoading } = useDoc<CanonicalProduct>(productRef);

  // Kullanıcının referral kodunu (varsa) oku — affiliate sub-id olarak kullanılır.
  const userDocRef = useMemoFirebase(
    () => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null),
    [db, authUser?.uid]
  );
  const { data: userData } = useDoc<{ referralCode?: string }>(userDocRef);

  // "Ürüne Git" — market marka CTA'sını yansıtır: oturum zorunlu + tıklama/
  // alışveriş izi (userId+brandId+productId) bildirim olarak yazılır + dışa giden
  // URL'e kullanıcının sub-id'si (referralCode varsa o, yoksa uid) eklenir.
  const handleGoToProduct = async () => {
    if (!product) return;
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Giriş Yapmalısınız', description: 'Bağış sürecini başlatmak için lütfen oturum açın.' });
      return;
    }
    if (!product.productUrl) return;

    setIsGoing(true);
    const subId = (userData?.referralCode && userData.referralCode.trim()) || authUser.uid;
    const outboundUrl = appendSubId(product.productUrl, subId);

    // Capacitor Browser ile native aç (iOS popup blocker'a takılmaz).
    void openExternalUrl(outboundUrl);

    toast({
      title: 'Alışveriş başlatıldı',
      description: 'Alışverişini tamamladığında bağışın otomatik hesabına işlenecek. "Bağışlarım" sayfasından takip edebilirsin.',
    });

    // Tıklama izi: bilgilendirme bildirimi (best-effort) — market CTA ile aynı desen.
    // Bağış kaydı DEĞİL; gerçek bağış affiliate webhook'undan gelir.
    if (db) {
      try {
        await addDoc(collection(db, COLLECTIONS.notifications), {
          userId: authUser.uid,
          type: 'donation',
          title: 'Alışveriş başlatıldı',
          body: `${product.brandName} alışverişin tamamlanınca bağışın işlenecek. Bağışlarım sayfasından takip et.`,
          data: { brandId: product.brandId ?? null, productId: product.id, link: '/my-donations' },
          read: false,
          createdAt: serverTimestamp(),
          createdBy: 'product-click',
        });
      } catch {
        // Bildirim yazımı başarısız olsa bile alışveriş akışı devam eder.
      }
    }

    setIsGoing(false);
  };

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
  const effectivePrice = hasSale ? (product.salePrice as number) : product.price;
  const discountPct = hasSale
    ? Math.round((1 - (product.salePrice as number) / product.price) * 100)
    : 0;
  const donationRate =
    typeof product.donationRate === 'number' && product.donationRate > 0
      ? product.donationRate
      : null;
  // Tahmini bağış: ürün fiyatı × bağış oranı (varsa).
  const estimatedDonation =
    donationRate !== null ? Math.round((effectivePrice * donationRate) / 100) : null;
  const inStock = !product.availability || /in.?stock|stokta|mevcut|available/i.test(product.availability);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-secondary/30 pb-28">
      <div className="sticky top-12 z-20 border-b bg-background p-4">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/market/products">
            <ArrowLeft className="h-4 w-4" />
            Ürünler
          </Link>
        </Button>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-5 p-4">
        <Card variant="glass" className="relative overflow-hidden rounded-2xl bg-white">
          {hasSale && (
            <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-black text-white shadow">
              <TrendingDown className="h-3.5 w-3.5" /> %{discountPct} indirim
            </span>
          )}
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
          {/* Marka — kayıtlı marka ise profiline link */}
          {product.brandId ? (
            <Link
              href={`/market/${product.brandId}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-primary hover:underline"
            >
              <Store className="h-3.5 w-3.5" /> {product.brandName}
            </Link>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <Store className="h-3.5 w-3.5" /> {product.brandName}
            </p>
          )}
          <h1 className="text-2xl font-black leading-tight">{product.title}</h1>

          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <Badge variant="secondary">{product.category}</Badge>
            )}
            <Badge variant="outline" className={'gap-1 ' + (inStock ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-amber-700 border-amber-200 bg-amber-50')}>
              <PackageCheck className="h-3 w-3" aria-hidden="true" />
              {inStock ? 'Stokta' : (product.availability || 'Tükendi')}
            </Badge>
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
        </div>

        {/* Sosyal etki kartı — affiliate → bağış hikayesi (hangel değer önerisi) */}
        <Card className="rounded-2xl border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-black text-foreground">Bu alışveriş bağışa dönüşür</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                "Ürüne Git" ile markanın sitesinden alışveriş yaptığında, hangel'in kazandığı
                komisyon <strong className="text-foreground">bağışa</strong> dönüşür. Sen ekstra ödemezsin.
                {estimatedDonation !== null && estimatedDonation > 0 && (
                  <> Bu üründe yaklaşık <strong className="text-primary">{formatPrice(estimatedDonation, product.currency)}</strong> bağış sağlanır.</>
                )}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 border-t border-primary/10 pt-3 text-[11px] font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Güvenli yönlendirme</span>
            <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> Resmi marka sitesi</span>
            <span className="inline-flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5 text-primary" /> Ödeme markada</span>
          </div>
        </Card>

        {product.description && (
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-wide text-muted-foreground">Ürün Açıklaması</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {product.description}
            </p>
          </div>
        )}

        {/* Ürün künyesi */}
        {(product.gtin || product.mpn) && (
          <div className="rounded-2xl border bg-card p-4 text-xs text-muted-foreground">
            <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-foreground">Ürün Bilgileri</h2>
            <div className="space-y-1">
              {product.gtin && <div className="flex justify-between gap-3"><span>Barkod (GTIN)</span><span className="font-semibold text-foreground">{product.gtin}</span></div>}
              {product.mpn && <div className="flex justify-between gap-3"><span>Üretici Kodu (MPN)</span><span className="font-semibold text-foreground">{product.mpn}</span></div>}
              {product.category && <div className="flex justify-between gap-3"><span>Kategori</span><span className="font-semibold text-foreground text-right">{product.category}</span></div>}
            </div>
          </div>
        )}
      </div>

      {/* Sabit alt CTA — her zaman görünür "Ürüne Git" (affiliate deeplink) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/90 px-4 py-3 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <div className="hidden sm:block">
            <p className="text-[11px] text-muted-foreground">Fiyat</p>
            <p className="text-lg font-black text-foreground">{formatPrice(effectivePrice, product.currency)}</p>
          </div>
          <Button
            size="lg"
            className="h-12 flex-1 gap-2 rounded-2xl text-base font-black"
            onClick={handleGoToProduct}
            disabled={isGoing}
          >
            {isGoing ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <>
                Ürüne Git
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl text-center text-[10px] text-muted-foreground">
          Markanın resmi sitesine güvenli yönlendirilirsin · alışverişin bir kısmı bağışa döner
        </p>
      </div>
    </div>
  );
}

export default ProductDetailClient;
