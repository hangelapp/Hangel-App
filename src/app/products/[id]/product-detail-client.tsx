'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  ImageOff,
  HeartHandshake,
  PackageCheck,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { BrandLogo } from '@/components/market/brand-logo';
import { ProductOtherSellers } from '@/components/market/product-other-sellers';
import { DonationImpact } from '@/components/market/donation-impact';
import { ProductBoughtTogether } from '@/components/market/product-bought-together';
import { ProductBrandOtherStores } from '@/components/market/product-brand-other-stores';
import { ProductCard } from '@/components/market/product-card';
import { ShareButton } from '@/components/market/share-button';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { doc, collection, addDoc, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { openExternalUrl } from '@/lib/capacitor';
import { goToAffiliate } from '@/lib/affiliate-go';
import type { CanonicalProduct } from '@/lib/feed/types';
import type { Brand } from '@/lib/types';
import { canonicalBrand } from '@/lib/market/brand-extract';
import { curatedCategoryOf } from '@/lib/market/curated-categories';
import { recordView } from '@/lib/market/recently-viewed';
import { useFavorites } from '@/hooks/use-favorites';

function formatPrice(value: number, currency: string): string {
  const sym = currency === 'TRY' ? 'TL' : currency;
  return `${value.toLocaleString('tr-TR')} ${sym}`;
}

// Ham kategori yolunu ("Bilgisayar&Tablet>Tablet Aksesuarı>Tablet Kılıfı")
// ayrı ayrı TIKLANABİLİR parçalara böler. Her parça /market/products?q=<parça>
// aramasına gider (deep-link products sayfasında q ile ön-doldurulur).
function categorySegments(category?: string | null): string[] {
  if (!category) return [];
  return category
    .split(/[>›/|»]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40);
}

// Bilinen mağazalar için arama URL şablonu. `productUrl` bir mağaza ana sayfasına
// düşerse (ör. affiliate deep-link kırılmış) kullanıcıyı en azından mağaza içi
// arama sonuç sayfasına götürürüz. `brand.link` üzerinde encoded query bırakır.
const STORE_SEARCH_URLS: Array<{ match: RegExp; url: (q: string) => string }> = [
  { match: /trendyol/i,     url: (q) => `https://www.trendyol.com/sr?q=${encodeURIComponent(q)}` },
  { match: /hepsiburada/i,  url: (q) => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}` },
  { match: /n11\b/i,        url: (q) => `https://www.n11.com/arama?q=${encodeURIComponent(q)}` },
  { match: /amazon/i,       url: (q) => `https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}` },
  { match: /gittigidiyor/i, url: (q) => `https://www.gittigidiyor.com/arama?k=${encodeURIComponent(q)}` },
  { match: /modanisa/i,     url: (q) => `https://www.modanisa.com/tr/arama?q=${encodeURIComponent(q)}` },
  { match: /beymen/i,       url: (q) => `https://www.beymen.com/search?q=${encodeURIComponent(q)}` },
  { match: /media[\s-]?markt/i, url: (q) => `https://www.mediamarkt.com.tr/tr/search.html?query=${encodeURIComponent(q)}` },
  { match: /morhipo/i,      url: (q) => `https://www.morhipo.com/arama?SearchTerm=${encodeURIComponent(q)}` },
  { match: /vatan bilg/i,   url: (q) => `https://www.vatanbilgisayar.com/arama/${encodeURIComponent(q)}/` },
  { match: /teknosa/i,      url: (q) => `https://www.teknosa.com/arama/?s=${encodeURIComponent(q)}` },
  { match: /boyner/i,       url: (q) => `https://www.boyner.com.tr/arama?q=${encodeURIComponent(q)}` },
];

// productUrl'in gerçek ürün linki olup olmadığını sezgisel doğrular. Mağaza ana
// sayfası ("/", boş path) ise search fallback tetiklenir.
function isRealProductUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, '');
    // Ana sayfa (path yok) veya sadece "www.x.com/" → gerçek ürün değil.
    if (!path || path === '/') return false;
    return true;
  } catch {
    return false;
  }
}

// Kullanıcıyı ürün başlığıyla mağaza içi aramaya götürecek URL üretir. Şablonu
// olmayan mağazalar için null döner (o zaman "Ürüne Git" disabled kalır).
function buildStoreSearchUrl(storeName: string, productName: string, productBrand?: string | null): string | null {
  const q = [productBrand, productName].filter(Boolean).join(' ').trim();
  if (!q) return null;
  const tpl = STORE_SEARCH_URLS.find((t) => t.match.test(storeName));
  return tpl ? tpl.url(q) : null;
}

export function ProductDetailClient({ id }: { id: string }) {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [isGoing, setIsGoing] = useState(false);
  // Kalıcı favori (users/{uid}/favorites) — fiyat-düşüş cron'u (price-drop-alerts)
  // bu koleksiyonu izleyip fiyat düşünce bildirir. Eski local useState kaldırıldı
  // (kaydolmuyordu). fav = bu ürün favoride mi.
  const { isFavorite, toggle: toggleFavorite, signedIn: favSignedIn } = useFavorites();
  const fav = isFavorite(id);
  const onToggleFav = (asAlarm = false) => {
    if (!favSignedIn) {
      toast({ variant: 'destructive', title: 'Giriş yapmalısın', description: 'Favori ve fiyat alarmı için oturum aç.' });
      return;
    }
    if (!product) return;
    const willAdd = !fav;
    toggleFavorite(product);
    toast(
      willAdd
        ? asAlarm
          ? { title: '🔔 Fiyat alarmı kuruldu', description: 'Bu ürün daha ucuz olunca sana bildirim göndereceğiz.' }
          : { title: '🧡 Favorilere eklendi', description: 'Fiyatı düşünce haber vereceğiz.' }
        : { title: 'Favorilerden çıkarıldı', description: 'Fiyat alarmı kapandı.' }
    );
  };

  const productRef = useMemoFirebase(
    () => doc(db, COLLECTIONS.products, id),
    [db, id]
  );
  const { data: product, isLoading } = useDoc<CanonicalProduct>(productRef);

  // "Son görüntülenenler" sinyali (kişiselleştirme için) — ürün yüklendiğinde
  // hafif meta'yı localStorage'a yazar. Sunucu çağrısı yok, best-effort.
  useEffect(() => {
    if (product?.id) {
      recordView({
        id: product.id,
        category: product.category,
        productBrandKey: product.productBrandKey,
        brandName: product.brandName,
      });
    }
  }, [product?.id, product?.category, product?.productBrandKey, product?.brandName]);

  // MAĞAZA (satıcı) — ürünün geldiği 3-ajans offer'ı. `brandName` mağaza adıdır.
  // Mağaza doc id: brandId varsa o; yoksa source+feedId'den türetilir
  // (ao-/ra-/go-<feedId>). Mağaza logosu + profil linki + bağış oranı için.
  const storeId = useMemo(() => {
    if (product?.brandId) return product.brandId;
    const pre =
      product?.source === 'affocean' ? 'ao'
      : product?.source === 'reklamaction' ? 'ra'
      : product?.source === 'gelirortaklari' ? 'go'
      : '';
    return pre && product?.feedId ? `${pre}-${product.feedId}` : null;
  }, [product?.brandId, product?.source, product?.feedId]);

  const brandRef = useMemoFirebase(
    () => (storeId ? doc(db, COLLECTIONS.brands, storeId) : null),
    [db, storeId]
  );
  // `brand` = MAĞAZA dokümanı (logo/ad/oran). Değişken adı geriye uyum için korunur.
  const { data: brand } = useDoc<Brand>(brandRef);

  // MARKA (ürün markası: Nike/Apple/Ülker) — başlıktan çıkarılmış `productBrand`.
  // Mağazadan bağımsız; marka profiline (/market/brand/<key>) gider. Boş olabilir.
  // canonicalBrand: saklı "iPad"/"Galaxy" ürün serilerini ANA markaya (Apple/
  // Samsung) indirger → mevcut ürünlerde backfill'siz doğru marka gösterimi.
  const productBrand = (canonicalBrand(product?.productBrand) || '').trim();
  const productBrandKey = (product?.productBrandKey || '').trim();

  // "Ürüne Git" — market marka CTA'sını yansıtır: oturum zorunlu + tıklama/
  // alışveriş izi (userId+brandId+productId) bildirim olarak yazılır. Dışa giden
  // link artık `/api/affiliate/go?brandId=...` üzerinden açılır: route clickId
  // üretip affiliateClicks doc'unu yazar ve subId'i affiliate URL'ine enjekte
  // ederek 302 ile markaya yönlendirir (conversion postback'i bağışa çevirir).
  // Ürün markaya bağlı değilse (brandId yok) izleme yapılamaz; doğrudan açılır.
  //
  // productUrl gerçek bir ürün linki değilse (mağaza ana sayfası vb.) `productLinkTarget`
  // bir mağaza içi arama URL'ine düşer. İkisi de yoksa buton disabled — kullanıcıya
  // "Mağazada arayın" tooltip'i gösterilir (aşağıdaki `canGo`).
  const productLinkTarget = useMemo(() => {
    if (!product) return null;
    if (isRealProductUrl(product.productUrl)) return product.productUrl;
    const search = buildStoreSearchUrl(product.brandName || '', product.title, productBrand);
    return search;
  }, [product, productBrand]);
  const canGo = !!(product?.brandId || productLinkTarget);

  const handleGoToProduct = async () => {
    if (!product) return;
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Giriş Yapmalısınız', description: 'Bağış sürecini başlatmak için lütfen oturum açın.' });
      return;
    }
    if (!canGo) return;

    setIsGoing(true);

    if (product.brandId) {
      // Affiliate redirect endpoint'i (subId enjeksiyonu + click kaydı route'ta).
      // Gerçek ürün linki yoksa mağaza arama URL'ini fallback olarak veririz.
      await goToAffiliate({
        brandId: product.brandId,
        authUser,
        fallbackUrl: productLinkTarget,
      });
    } else if (productLinkTarget) {
      // Markaya bağlı değil → izlenemez; kullanıcıyı yine de mağazaya götür.
      void openExternalUrl(productLinkTarget);
    }

    toast({
      title: 'Alışveriş başlatıldı',
      description: 'Alışverişini tamamladığında bağışın otomatik hesabına işlenecek. "Bağışlarım" sayfasından takip edebilirsin.',
    });

    // Tıklama izi (best-effort): "bağışın işleniyor" durumunu /my-donations'ta
    // göstermek için işaretli bir bildirim yazılır. Bağış kaydı DEĞİL — gerçek
    // bağış conversion onayı gelince affiliate postback'inden oluşur ve donations
    // listesinde "İşleme Alındı" olarak görünür. createdBy = uid (rules gereği).
    // data.affiliatePending: my-donations bunu "bağışın işleniyor 🧡" olarak ayıklar.
    if (db) {
      try {
        await addDoc(collection(db, COLLECTIONS.notifications), {
          userId: authUser.uid,
          type: 'donation',
          title: 'Alışveriş başlatıldı',
          body: `${product.brandName} alışverişin tamamlanınca bağışın işlenecek. Bağışlarım sayfasından takip et.`,
          data: {
            affiliatePending: true,
            brandId: product.brandId ?? null,
            brandName: product.brandName ?? null,
            productId: product.id,
            link: '/my-donations',
          },
          read: false,
          createdAt: serverTimestamp(),
          createdBy: authUser.uid,
        });
      } catch {
        // Bildirim yazımı başarısız olsa bile alışveriş akışı devam eder.
      }
    }

    setIsGoing(false);
  };

  // Native paylaşım (varsa) — Trendyol'daki paylaş ikonu. Yoksa sessiz geçer.
  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.title,
      text: `${product.brandName} · ${product.title}`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Kullanıcı iptal etti — sessiz.
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({ title: 'Bağlantı kopyalandı', description: 'Ürün bağlantısı panoya kopyalandı.' });
      } catch {
        // Pano erişimi yok — sessiz.
      }
    }
  };

  const images = useMemo(() => {
    if (!product) return [] as string[];
    const all = [product.imageLink, ...(product.additionalImages || [])].filter(
      (src): src is string => !!src
    );
    return Array.from(new Set(all));
  }, [product]);

  const [activeIdx, setActiveIdx] = useState(0);

  // "Benzer Ürünler" — aynı kategoriden tek hafif sorgu (limit 10). Mevcut ürün
  // sonradan istemcide elenir; orderBy yok (kategori where + limit yeterli, indeks
  // gerektirmez). Yalnızca kategori varsa çalışır.
  const similarQuery = useMemoFirebase(
    () =>
      product?.category
        ? query(
            collection(db, COLLECTIONS.products),
            where('category', '==', product.category),
            limit(12)
          )
        : null,
    [db, product?.category]
  );
  const { data: similarRaw } = useCollection<CanonicalProduct>(similarQuery);
  const similarProducts = useMemo(() => {
    const list = (similarRaw || []).filter((p) => p.id !== id);
    // Aynı ürün markası (productBrandKey) daha alakalı → öne al.
    const key = product?.productBrandKey;
    if (key) {
      list.sort(
        (a, b) =>
          (b.productBrandKey === key ? 1 : 0) - (a.productBrandKey === key ? 1 : 0)
      );
    }
    return list.slice(0, 10);
  }, [similarRaw, id, product?.productBrandKey]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
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

  // Bağış oranı — #7 (eksik bilgi olmasın): ürün oranı → marka oranı → platform
  // tabanı %2 (api-clients DEFAULT_DONATION_RATE; o modül API anahtarlı olduğu
  // için client'a import edilmez, sabit inline). Böylece HER üründe oran görünür,
  // asla boş/null kalmaz (market kartları da resolveProductRate ile hep gösterir).
  const PLATFORM_MIN_RATE = 2;
  const donationRate =
    typeof product.donationRate === 'number' && product.donationRate > 0
      ? product.donationRate
      : typeof brand?.donationRate === 'number' && brand.donationRate > 0
        ? brand.donationRate
        : PLATFORM_MIN_RATE;
  // Tahmini bağış: etkin fiyat × bağış oranı.
  const estimatedDonation = Math.round((effectivePrice * donationRate) / 100);

  // #7 eksik-bilgi (SIFIR yazma — render anında türetme):
  // • Kategori yolu boşsa kürasyon kategorisini (başlık/marka/mağazadan) türet.
  // • Açıklama boşsa başlık/marka/mağaza/orandan güvenli bir açıklama üret.
  const catSegments = categorySegments(product.category);
  const derivedCategory = catSegments.length === 0
    ? curatedCategoryOf(product.category, product.title, product.brandName)
    : null;
  const displayDescription = (product.description && product.description.trim())
    ? product.description
    : `${product.title}${productBrand ? ` — ${productBrand}` : ''}. ${product.brandName || 'Anlaşmalı mağaza'} üzerinden hangel ile alışverişte tutarın yaklaşık %${donationRate}'i (${formatPrice(estimatedDonation, product.currency)}) desteklediğin STK'ya bağışa dönüşür. Ürünü markanın resmi sitesinde inceleyip satın alabilirsin; sen ekstra ödemezsin.`;
  const inStock =
    !product.availability ||
    /in.?stock|stokta|mevcut|available/i.test(product.availability);

  const mainImage = images[activeIdx] || images[0] || null;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-secondary/30 pb-[calc(9rem+var(--sab))] sm:pb-[calc(8rem+var(--sab))]">
      {/* 1. Üst bar — geri + paylaş + favori (Trendyol detay başlığı) */}
      <div className="sticky top-12 z-20 flex items-center justify-between border-b bg-background px-2 py-2">
        <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-xl" aria-label="Geri">
          <Link href="/market/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={handleShare}
            aria-label="Paylaş"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={() => onToggleFav(false)}
            aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Heart className={cn('h-5 w-5 transition-colors', fav ? 'fill-primary text-primary' : 'text-foreground')} />
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl lg:max-w-6xl">
        {/* Masaüstü 2-kolon (Trendyol): SOL görsel galerisi · SAĞ satın alma bilgisi.
            Mobilde (default) tek kolon, üst üste — mevcut görünüm korunur. */}
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        {/* SOL kolon — 2. Büyük ürün görseli — swipe galeri + nokta göstergesi.
            Masaüstünde scroll ederken görünür kalır (sticky). */}
        <div className="relative bg-white lg:sticky lg:top-4 lg:self-start lg:rounded-2xl lg:border lg:overflow-hidden">
          <div className="relative aspect-[1/1.2] w-full lg:aspect-square lg:max-h-[70vh]">
            {images.length > 1 ? (
              <div
                className="flex h-full w-full snap-x snap-mandatory overflow-x-auto"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollLeft / el.clientWidth);
                  setActiveIdx((cur) => (cur === idx ? cur : idx));
                }}
              >
                {images.map((src, i) => (
                  <div key={src} className="relative h-full w-full shrink-0 snap-center">
                    <img
                      src={src}
                      alt={product.title}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain p-6"
                    />
                  </div>
                ))}
              </div>
            ) : mainImage ? (
              <img
                src={mainImage}
                alt={product.title}
                loading="eager"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain p-6"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <ImageOff className="h-20 w-20" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* İndirim rozeti (sol üst) */}
          {hasSale && (
            <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-black text-white shadow">
              %{discountPct} indirim
            </span>
          )}

          {/* Favori kalbi (sağ üst, görsel üzerinde) */}
          <button
            type="button"
            onClick={() => onToggleFav(false)}
            aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white"
          >
            <Heart className={cn('h-4 w-4 transition-colors', fav ? 'fill-primary text-primary' : 'text-muted-foreground')} />
          </button>

          {/* Galeri nokta göstergesi */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
              {images.map((src, i) => (
                <span
                  key={src}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === activeIdx ? 'w-4 bg-primary' : 'w-1.5 bg-foreground/25'
                  )}
                />
              ))}
            </div>
          )}

          {/* Küçük resim seçici (çoklu görsel) */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto bg-white px-4 pb-3 pt-1">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    'h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-white',
                    i === activeIdx ? 'border-primary' : 'border-border'
                  )}
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
        </div>

        {/* SAĞ kolon — satın alma bilgisi (breadcrumb, marka, başlık, fiyat,
            CTA/bağış, satıcı, diğer satıcılar, ürün künyesi). */}
        <div className="space-y-4 p-4">
          {/* Breadcrumb — Market › kategori › ürün */}
          <nav className="flex items-center gap-1 overflow-x-auto text-[11px] text-muted-foreground">
            <Link href="/market" className="shrink-0 hover:text-foreground">Market</Link>
            {/* Kategori yolunun HER parçası ayrı tıklanabilir (Bilgisayar&Tablet ›
                Tablet Aksesuarı › Tablet Kılıfı) → o parçanın araması. */}
            {catSegments.map((seg) => (
              <span key={seg} className="flex shrink-0 items-center gap-1">
                <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                <Link href={`/market/products?q=${encodeURIComponent(seg)}`} className="shrink-0 hover:text-foreground">
                  {seg}
                </Link>
              </span>
            ))}
            {/* Kategori yolu boşsa türetilen kürasyon kategorisi (eksik-bilgi #7). */}
            {catSegments.length === 0 && derivedCategory && (
              <span className="flex shrink-0 items-center gap-1">
                <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                <Link href={`/market/kategori/${encodeURIComponent(derivedCategory)}`} className="shrink-0 hover:text-foreground">
                  {derivedCategory}
                </Link>
              </span>
            )}
            {/* Marka parçası (Apple) → marka profili */}
            {productBrand && productBrandKey && (
              <span className="flex shrink-0 items-center gap-1">
                <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                <Link href={`/market/brand/${encodeURIComponent(productBrandKey)}`} className="shrink-0 hover:text-foreground">
                  {productBrand}
                </Link>
              </span>
            )}
            <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate text-foreground/70">{product.title}</span>
          </nav>

          {/* 3. MARKA satırı — ürünün markası (Nike/Apple/Ülker). Trendyol'da olduğu
              gibi başlığın üstünde; marka profiline (/market/brand/<key>) gider.
              Marka çıkarılamadıysa satır gizlenir (yalnız mağazada listelenir). */}
          {productBrand && productBrandKey ? (
            <Link
              href={`/market/brand/${encodeURIComponent(productBrandKey)}`}
              className="inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-primary hover:underline"
            >
              <Tag className="h-4 w-4" aria-hidden="true" />
              {productBrand}
            </Link>
          ) : null}

          {/* 4. Ürün başlığı — tam, kesilmemiş */}
          <h1 className="text-xl font-bold leading-snug text-foreground">{product.title}</h1>

          {/* Durum rozetleri */}
          <div className="flex flex-wrap items-center gap-2">
            {product.category && <Badge variant="secondary">{product.category}</Badge>}
            <Badge
              variant="outline"
              className={cn(
                'gap-1',
                inStock
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              )}
            >
              <PackageCheck className="h-3 w-3" aria-hidden="true" />
              {inStock ? 'Stokta' : product.availability || 'Tükendi'}
            </Badge>
          </div>

          {/* 5. Fiyat bloğu — Trendyol tarzı */}
          <div className="flex items-center gap-3">
            {hasSale ? (
              <>
                <span className="rounded-md bg-primary px-2 py-0.5 text-sm font-black text-white">
                  %{discountPct}
                </span>
                <span className="text-3xl font-black text-primary">
                  {formatPrice(product.salePrice as number, product.currency)}
                </span>
                <span className="text-base text-muted-foreground line-through">
                  {formatPrice(product.price, product.currency)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-black text-foreground">
                {formatPrice(product.price, product.currency)}
              </span>
            )}
          </div>

          {/* 6. BAĞIŞ VURGUSU — hangel imzası (Trendyol'un kargo/promo alanı yerine) */}
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                <HeartHandshake className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                {donationRate !== null ? (
                  <>
                    <p className="text-sm font-black text-foreground">
                      Bu üründen <span className="text-primary">%{donationRate}</span> bağışa gidiyor
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Alışverişin iyiliğe dönüşür — sen ekstra ödemezsin.
                      {estimatedDonation !== null && estimatedDonation > 0 && (
                        <> Bu üründe yaklaşık{' '}
                          <strong className="text-primary">{formatPrice(estimatedDonation, product.currency)}</strong>{' '}
                          bağış sağlanır.
                        </>
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-black text-foreground">Alışverişin iyiliğe dönüşür</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      &quot;Ürüne Git&quot; ile markanın resmi sitesinden alışveriş yaptığında, hangel&apos;in
                      kazandığı komisyon bağışa dönüşür. Sen ekstra ödemezsin.
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-primary/15 pt-3 text-[11px] font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Güvenli yönlendirme</span>
              <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> Resmi marka sitesi</span>
              <span className="inline-flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5 text-primary" /> Ödeme markada</span>
            </div>
          </div>

          {/* Favorilere Ekle + Fiyat Alarmı — ikisi de kalıcı favoriye yazar;
              fiyat-düşüş cron'u favorileri izleyip daha ucuz olunca bildirir. */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={fav ? 'secondary' : 'outline'}
              className="h-11 rounded-xl gap-2 font-bold"
              onClick={() => onToggleFav(false)}
            >
              <Heart className={cn('h-4 w-4', fav ? 'fill-primary text-primary' : '')} />
              {fav ? 'Favoride' : 'Favorilere Ekle'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn('h-11 rounded-xl gap-2 font-bold', fav && 'border-primary/40 text-primary')}
              onClick={() => onToggleFav(true)}
              title="Bu ürün daha ucuz olunca bildirim göndeririz"
            >
              🔔 {fav ? 'Alarm Kurulu' : 'Fiyat Alarmı Kur'}
            </Button>
          </div>

          {/* 7. MAĞAZA (Satıcı) kartı — ürünü hangi mağazanın sitesinden çektiğimiz.
              Trendyol'daki "Satıcı" kutusu; tıklanınca o mağazanın profiline gider.
              Alt satırlar: MARKA (ürün markası → /market/brand/<key>) + Bağış Oranı. */}
          {product.brandName && (
            <div className="rounded-2xl border bg-card">
              {/* Satıcı Mağaza satırı — tıklanınca mağaza profili. */}
              <Link
                href={storeId ? `/market/${storeId}` : `/market/products?brand=${encodeURIComponent(product.brandName)}`}
                className="flex items-center gap-3 rounded-t-2xl p-3.5 transition-colors hover:bg-primary/5"
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border bg-white">
                  {brand ? (
                    <BrandLogo brand={brand} />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-primary">
                      <Store className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Satıcı Mağaza
                  </p>
                  {/* Mağaza adı (feed doc'undan gelir; brands doc varsa küratörlü ad).
                      İsim ASLA kesilmez — uzunsa alt satıra sarar. */}
                  <p className="text-sm font-black text-foreground break-words">{brand?.name || product.brandName}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
              {/* MARKA satırı — Nike/Apple gibi ürün markası; tıklanınca marka profili.
                  Sadece marka çıkarılabildiyse gösterilir. */}
              {productBrand && productBrandKey && (
                <Link
                  href={`/market/brand/${encodeURIComponent(productBrandKey)}`}
                  className="flex items-center gap-3 border-t border-border/60 px-3.5 py-2.5 transition-colors hover:bg-primary/5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white text-primary">
                    <Tag className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Marka
                    </p>
                    {/* Marka adı ASLA kesilmez — uzunsa alt satıra sarar. */}
                    <p className="text-sm font-black text-foreground break-words">{productBrand}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              )}
              {/* Bağış oranı satırı — mağazanın bu ürüne uyguladığı oran (özet). */}
              {donationRate !== null && donationRate > 0 && (
                <div className="flex items-center gap-3 border-t border-border/60 px-3.5 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white text-primary">
                    <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Bağış Oranı
                    </p>
                    <p className="truncate text-sm font-black text-primary">%{donationRate}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7a. BAĞIŞ ETKİSİ — kullanıcının seçtiği STK(ları) ve bu alışverişten
              gidecek bağış tutarını (alıcı ekstra ödemez) isimleriyle vurgular. */}
          {donationRate !== null && donationRate > 0 && (
            <DonationImpact product={product} donationRate={donationRate} />
          )}

          {/* 7b. Diğer satıcılar — aynı ürünü (GTIN/MPN) satan mağazalar, bağış oranıyla */}
          <ProductOtherSellers product={product} />

          {/* 8b. Ürün künyesi / özellikler */}
          {(product.gtin || product.mpn || product.category) && (
            <div className="rounded-2xl border bg-card p-4">
              <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-foreground">Ürün Bilgileri</h2>
              <div className="space-y-1 text-xs text-muted-foreground">
                {product.category && (
                  <div className="flex items-start justify-between gap-3 border-b border-border/50 py-1.5">
                    <span className="shrink-0">Kategori</span>
                    {/* Her kategori parçası ayrı tıklanabilir. */}
                    <span className="flex flex-wrap items-center justify-end gap-1 text-right">
                      {categorySegments(product.category).map((seg, i, arr) => (
                        <span key={seg} className="inline-flex items-center gap-1">
                          <Link href={`/market/products?q=${encodeURIComponent(seg)}`} className="font-semibold text-primary hover:underline">
                            {seg}
                          </Link>
                          {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {product.gtin && (
                  <div className="flex justify-between gap-3 border-b border-border/50 py-1.5">
                    <span>Barkod (GTIN)</span>
                    <span className="font-semibold text-foreground">{product.gtin}</span>
                  </div>
                )}
                {product.mpn && (
                  <div className="flex justify-between gap-3 py-1.5">
                    <span>Üretici Kodu (MPN)</span>
                    <span className="font-semibold text-foreground">{product.mpn}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* /SAĞ kolon — masaüstü 2-kolon grid burada kapanır */}
        </div>

        {/* Aşağıdaki bölümler masaüstünde grid'in ALTINDA tam genişlik (Trendyol). */}

        {/* 7d. Bu Ürün Başka Mağazalarda — yatay ürün şeridi, fiyat + indirim +
            bağış oranıyla. Birlikte Alınanlar'ın ÜSTÜNDE: kullanıcı tek sayfada
            en uygun mağazayı görür, başka sayfaya gitmeden karşılaştırır. */}
        <div className="p-4 pb-0">
          <ProductBrandOtherStores product={product} />
        </div>

        {/* 7c. Birlikte Alınanlar — aynı mağazadan tamamlayıcı ürünler (tek teslimat) */}
        <div className="p-4 pt-4">
          <ProductBoughtTogether product={product} />
        </div>

        {/* 8. Ürün açıklaması */}
        {/* Açıklama — boşsa türetilen güvenli metin (eksik-bilgi #7, sıfır yazma). */}
        <div className="px-4 pb-4">
          <div className="space-y-2 rounded-2xl border bg-card p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Ürün Açıklaması</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {displayDescription}
            </p>
          </div>
        </div>

        {/* 9. Benzer Ürünler — yatay şerit (aynı kategori) */}
        {similarProducts.length > 0 && (
          <div className="space-y-3 px-4 pb-2">
            <h2 className="text-base font-black text-foreground">Benzer Ürünler</h2>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {similarProducts.map((p) => (
                <div key={p.id} className="w-36 shrink-0">
                  {/* Her benzer ürün KENDİ oranını çözsün — mevcut ürünün oranı yanıltıcı. */}
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7. Sabit alt CTA — "Ürüne Git" (affiliate deeplink, login gating korunur) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur-lg"
        style={{ paddingBottom: 'calc(0.75rem + var(--sab))' }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 lg:max-w-6xl">
          <div className="hidden shrink-0 sm:block">
            <p className="text-[11px] text-muted-foreground">Fiyat</p>
            <p className="text-lg font-black text-foreground">{formatPrice(effectivePrice, product.currency)}</p>
          </div>
          <Button
            size="lg"
            className="h-12 flex-1 gap-2 rounded-2xl text-base font-black"
            onClick={handleGoToProduct}
            disabled={isGoing || !canGo}
            title={!canGo ? 'Bu ürünün doğrudan linki yok — mağazada arayın' : undefined}
          >
            {isGoing ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <>
                {canGo ? 'Ürüne Git' : 'Mağazada Arayın'}
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
              </>
            )}
          </Button>
          {/* Paylaş — bağış vurgulu viral paylaşım (CTA'nın yanında). */}
          <ShareButton product={product} donationRate={donationRate || 0} />
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl text-center text-[10px] text-muted-foreground lg:max-w-6xl">
          {canGo
            ? 'Markanın resmi sitesine güvenli yönlendirilirsin · alışverişin bir kısmı bağışa döner'
            : 'Bu ürünün doğrudan linki yok — mağaza sayfasından arayarak ulaşabilirsin'}
        </p>
      </div>
    </div>
  );
}

export default ProductDetailClient;
