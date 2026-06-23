'use client';

/**
 * Ürünleri Keşfet — Trendyol uygulamasının ANA SAYFASI tarzı pazar-yeri vitrini (PIM).
 *
 * hangel farkı: her ürün yüzeyinde 🧡 BAĞIŞ ORANI rozeti. Klasik pazar yerinde
 * olmayan tek şey bu — kullanıcı alışveriş yaparken hangi ürünün ne kadarının
 * bağışa gittiğini görür ve buna göre seçebilir (SIRALA → "Bağış oranı").
 *
 * Düzen (yukarıdan aşağı):
 *   1. Sabit slim üst bar: geri + arama + filtre/sırala + kategori çip şeridi
 *      (başlık YOK — premium, sade)
 *   2. Kampanya/banner carousel — sayfanın EN ÜST görseli (premium coral hero'lar)
 *   3. Hızlı kategori kutucukları (ikon + ad)
 *   4. Yatay ürün şeritleri ("fırsat" rows): En Çok Bağış, İndirimdekiler,
 *      Öne Çıkanlar + en büyük kategoriler
 *   5. "Tüm Ürünler" ana grid (mevcut 2-kolon Trendyol grid)
 *
 * BAĞIŞ ORANI: resolveProductRate ASLA null dönmez — markaya özgü oran
 * bilinmiyorsa platform ortalaması gösterilir, böylece HER kartta rozet çıkar.
 *
 * PERFORMANS: bütün bölümler ZATEN ÇEKİLEN 120 ürün üzerinden client-side
 * türetilir (sort/filter/slice). Ek Firestore okuması yok.
 *
 * Veri kaynağı: COLLECTIONS.products (kanonik ürün kütüphanesi). Ürünler
 * `random` alanına göre rastgele başlangıçla çekilir (her ziyarette farklı vitrin).
 * Arama, kategori ve sıralama çekilen küme üzerinde uygulanır.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  ArrowLeft,
  ArrowDownUp,
  SlidersHorizontal,
  Check,
  HeartHandshake,
  Tag,
  Sparkles,
  ChevronRight,
  Shirt,
  Home,
  Smartphone,
  Baby,
  Dumbbell,
  Gem,
  Gift,
  Package,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCard } from '@/components/market/product-card';
import { BrandLogo } from '@/components/market/brand-logo';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import {
  collection,
  limit,
  query,
  orderBy,
  startAt,
  getCountFromServer,
} from 'firebase/firestore';
import type { CanonicalProduct } from '@/lib/feed/types';
import type { Brand } from '@/lib/types';

type SortOption =
  | 'recommended' // varsayılan — feed rastgele sırası (popüler vitrin)
  | 'donationDesc' // bağış oranı yüksek → düşük (hangel imzası)
  | 'priceAsc' // fiyat artan
  | 'priceDesc' // fiyat azalan
  | 'popular'; // popülerlik (en yeni ingest — taze ürün proxy'si)

const SORT_LABELS: Record<SortOption, string> = {
  recommended: 'Önerilen',
  donationDesc: 'Bağış oranı (yüksek)',
  priceAsc: 'Fiyat (artan)',
  priceDesc: 'Fiyat (azalan)',
  popular: 'Popülerlik',
};

// Bir ürünün etkin fiyatı: indirimli fiyat varsa o, yoksa ana fiyat.
function effectivePrice(p: CanonicalProduct): number {
  return typeof p.salePrice === 'number' && p.salePrice > 0
    ? p.salePrice
    : p.price;
}

// İndirim yüzdesi (salePrice < price ise) — yoksa 0.
function discountPct(p: CanonicalProduct): number {
  if (typeof p.salePrice === 'number' && p.salePrice > 0 && p.salePrice < p.price) {
    return Math.round((1 - p.salePrice / p.price) * 100);
  }
  return 0;
}

// Bir ürünün hangi gruba ait olduğu: kategori → yoksa marka adı.
// Ham feed kategorisi uzun bir YOL olabilir ("Aksesuar>Kablolar, Dönüştürücüler
// ve Prizler" / "Telefon › Telefon Aksesuarları") → en geniş (ilk) segmenti alıp
// temizliyoruz; böylece çipler/kutucuklar kısa, okunur, Trendyol-vari olur.
function groupOf(p: CanonicalProduct): string {
  const raw = p.category?.trim() || p.brandName?.trim() || '';
  const broad = raw.split(/[>›/]/)[0].trim();
  return broad || raw;
}

// Yatay kaydırma şeritleri için yinelenen "scrollbar gizli" sınıf.
const NO_SCROLLBAR =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

// Kategori adı → temsili ikon (Trendyol hızlı kutucukları gibi). Türkçe/İngilizce
// anahtar kelime eşlemesi; eşleşmezse genel "paket" ikonu.
function iconForCategory(name: string): React.ComponentType<{ className?: string }> {
  const n = name.toLocaleLowerCase('tr');
  if (/giyim|moda|tekstil|elbise|ayakkab|çanta|aksesuar/.test(n)) return Shirt;
  if (/ev|mobilya|dekor|mutfak|bahçe|yaşam/.test(n)) return Home;
  if (/elektronik|telefon|bilgisayar|teknoloji|tablet/.test(n)) return Smartphone;
  if (/bebek|çocuk|anne|oyuncak/.test(n)) return Baby;
  if (/spor|fitness|outdoor|kamp/.test(n)) return Dumbbell;
  if (/kozmetik|güzellik|bakım|takı|mücevher|saat/.test(n)) return Gem;
  return Package;
}

export default function DiscoverPage() {
  const db = useFirestore();
  // Sticky üst-bar offset'i shell'e göre: giriş yapmışta sabit header (top-0 h-12)
  // var → bar top-12 ona yapışır; giriş yapılmamış (gizli mod) shell'de header
  // akışta yer kaplar → top-0 olmalı, yoksa 48px fazla boşluk oluşur.
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  // "Tüm Ürünler" grid'ine kaydırmak için (banner tıklaması).
  const allProductsRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const scrollToAll = () => {
    allProductsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Her yüklemede farklı `random` başlangıç noktası → vitrin rastgele gelir.
  // 0.8 tavanı: imleçten sonra her zaman bolca ürün kalır (limit dolar).
  const [randSeed, setRandSeed] = useState(0);
  useEffect(() => {
    setRandSeed(Math.random() * 0.8);
  }, []);

  // Koleksiyonun GERÇEK toplamı (yalnız çekilen 120 değil) — arama
  // placeholder'ında "X ürün arasında" doğru görünsün diye sayılır.
  const [totalCount, setTotalCount] = useState<number | null>(null);
  useEffect(() => {
    if (!db) return;
    getCountFromServer(collection(db, COLLECTIONS.products))
      .then((snap) => setTotalCount(snap.data().count))
      .catch(() => {
        /* sessiz — placeholder yine çalışır */
      });
  }, [db]);

  const productsQuery = useMemoFirebase(
    () =>
      query(
        collection(db, COLLECTIONS.products),
        orderBy('random'),
        startAt(randSeed),
        limit(120),
      ),
    [db, randSeed],
  );
  const { data: products, isLoading } =
    useCollection<CanonicalProduct>(productsQuery);

  // Markaların bağış oranı — ürünün, linkine sahip olduğu markanın oranını kartta göster.
  // firestore brands + affiliate (api) brands birleşiminden brandId/brandName ile eşlenir.
  const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
  const { data: firestoreBrands } = useCollection<Brand>(brandsQuery);
  const [apiBrands, setApiBrands] = useState<Brand[]>([]);
  useEffect(() => {
    fetch('/api/offers')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Brand[]) => setApiBrands(Array.isArray(data) ? data : []))
      .catch(() => setApiBrands([]));
  }, []);
  // Platform varsayılan bağış oranı: yüklenen markaların oranlarının yuvarlanmış
  // ORTALAMASI (firestore + api birleşik). Hiç oran yoksa sabit %5'e düşer.
  const PLATFORM_DEFAULT_RATE = 5;
  const brandRate = useMemo(() => {
    const byId = new Map<string, number>();
    const byName = new Map<string, number>();
    let sum = 0;
    let count = 0;
    for (const b of [...(firestoreBrands || []), ...apiBrands]) {
      const r = Number(b?.donationRate);
      if (!b || !Number.isFinite(r) || r <= 0) continue;
      if (b.id) byId.set(b.id, r);
      if (b.name) byName.set(b.name.trim().toLowerCase(), r);
      sum += r;
      count += 1;
    }
    const average = count > 0 ? Math.round(sum / count) : PLATFORM_DEFAULT_RATE;
    return { byId, byName, average };
  }, [firestoreBrands, apiBrands]);
  // hangel modelinde her alışveriş bağış üretir; markaya özgü oran bilinmiyorsa
  // platform ortalaması gösterilir. Bu yüzden zincir asla null DÖNMEZ — her ürün
  // kartı bir bağış oranı gösterir.
  const resolveProductRate = (p: CanonicalProduct): number => {
    if (typeof p.donationRate === 'number' && p.donationRate > 0) return p.donationRate;
    if (p.brandId && brandRate.byId.has(p.brandId)) {
      return brandRate.byId.get(p.brandId) ?? brandRate.average;
    }
    const n = p.brandName?.trim().toLowerCase();
    if (n && brandRate.byName.has(n)) {
      return brandRate.byName.get(n) ?? brandRate.average;
    }
    return brandRate.average;
  };

  // En yüksek bağış oranlı 3 marka — kampanya banner'ında logolarını göstermek için.
  const topBrands = useMemo(() => {
    return [...(firestoreBrands || []), ...apiBrands]
      .filter((b) => b && Number.isFinite(Number(b.donationRate)) && Number(b.donationRate) > 0)
      .sort((a, b) => Number(b.donationRate) - Number(a.donationRate))
      .slice(0, 3);
  }, [firestoreBrands, apiBrands]);

  // Kategori filtresi: ürün `category` alanından türetilir; yoksa marka adı
  // ikincil grup olarak kullanılır (her ürünün en az markası vardır).
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products || []) {
      const cat = groupOf(p);
      if (cat) set.add(cat);
    }
    return ['Tümü', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [products]);

  // En büyük kategoriler (ürün sayısına göre) — hızlı kutucuklar + per-kategori şeritler.
  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products || []) {
      const cat = groupOf(p);
      if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...(products || [])];

    if (activeCategory !== 'Tümü') {
      list = list.filter((p) => groupOf(p) === activeCategory);
    }

    const lower = searchTerm.trim().toLowerCase();
    if (lower) {
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(lower) ||
          p.brandName?.toLowerCase().includes(lower),
      );
    }

    switch (sortBy) {
      case 'donationDesc':
        list.sort((a, b) => resolveProductRate(b) - resolveProductRate(a));
        break;
      case 'priceAsc':
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case 'priceDesc':
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case 'popular':
        // Popülerlik proxy'si: en yeni ingest edilen ürün (updatedAt) en üstte.
        list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
        break;
      default:
        // 'recommended' → feed'in rastgele `random` sırası korunur (vitrin).
        break;
    }

    return list;
    // resolveProductRate, brandRate'e bağlı; brandRate değişince yeniden hesap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, activeCategory, searchTerm, sortBy, brandRate]);

  const hasFilters =
    searchTerm.trim() !== '' ||
    activeCategory !== 'Tümü' ||
    sortBy !== 'recommended';

  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('Tümü');
    setSortBy('recommended');
  };

  // ── Vitrin şeritleri — hepsi ÇEKİLEN ürünlerden client-side türetilir ──

  // En Çok Bağış Yapanlar: çözülen bağış oranı yüksek → düşük.
  const topDonationStrip = useMemo(() => {
    return (products || [])
      .map((p) => ({ p, r: resolveProductRate(p) }))
      .sort((a, b) => b.r - a.r)
      .slice(0, 12)
      .map((x) => x.p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, brandRate]);

  // İndirimdekiler: salePrice < price, indirim yüzdesi yüksek → düşük.
  const dealsStrip = useMemo(() => {
    return (products || [])
      .filter((p) => discountPct(p) > 0)
      .sort((a, b) => discountPct(b) - discountPct(a))
      .slice(0, 12);
  }, [products]);

  // Öne Çıkanlar / Sana Özel: rastgele başlangıç sırasından bir dilim.
  // `random` sırası zaten karışık geldiği için ortadan bir dilim alıyoruz.
  const featuredStrip = useMemo(() => {
    const list = products || [];
    const start = Math.min(20, Math.max(0, list.length - 12));
    return list.slice(start, start + 12);
  }, [products]);

  // En büyük 2 kategori için ürün şeritleri (filtre yokken gösterilir).
  const categoryStrips = useMemo(() => {
    return topCategories.slice(0, 2).map((cat) => ({
      name: cat,
      items: (products || []).filter((p) => groupOf(p) === cat).slice(0, 12),
    }));
  }, [topCategories, products]);

  // Hızlı kategori kutucukları — en büyük 8 kategori (Trendyol home tiles).
  const quickTiles = useMemo(() => topCategories.slice(0, 8), [topCategories]);

  // Kampanya banner'ları — premium, Apple-kimlikli pazarlama hero'ları.
  // Tıklayınca ilgili şeride/filtreye yönlendirir (onClick korunur).
  type Banner = {
    key: string;
    eyebrow: string; // küçük üst etiket (kicker)
    title: string;
    subtitle: string;
    cta: string; // CTA chip metni
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    onClick: () => void;
    showBrandLogos?: boolean;
  };
  // En yüksek bağışlı markayı "büyük indirim + bağış kampanyası" banner'ı olarak öne
  // çıkar — marka logosu + adı + bağış oranıyla, koyu premium kimlikte.
  const spotlight = topBrands[0];
  const banners: Banner[] = [
    ...(spotlight
      ? [
          {
            key: 'brand-spotlight',
            eyebrow: spotlight.name,
            title: 'Büyük indirim + bağış kampanyası',
            subtitle: `${spotlight.name} · alışverişin hem indirimli hem %${Math.round(Number(spotlight.donationRate))} bağış.`,
            cta: 'Markaya git',
            icon: Tag,
            gradient: 'from-zinc-900 via-zinc-800 to-zinc-700',
            onClick: () => setSortBy('donationDesc'),
            showBrandLogos: true,
          } satisfies Banner,
        ]
      : []),
    {
      key: 'donation',
      eyebrow: '#wearehangel',
      title: 'Her alışveriş bir bağış',
      subtitle: 'En yüksek bağış oranlı markaları keşfet, umudu birlikte büyütelim.',
      cta: 'Markaları keşfet',
      icon: HeartHandshake,
      gradient: 'from-[#f34723] via-orange-500 to-amber-500',
      onClick: () => setSortBy('donationDesc'),
      showBrandLogos: true,
    },
    {
      key: 'deals',
      eyebrow: 'Fırsatlar',
      title: 'İndirimdeki ürünler',
      subtitle: 'Hem kazan hem bağış yap — sınırlı süre.',
      cta: 'Fırsatları gör',
      icon: Tag,
      gradient: 'from-orange-500 via-[#f34723] to-rose-500',
      onClick: scrollToAll,
    },
    {
      key: 'featured',
      eyebrow: 'Sana özel',
      title: 'Öne çıkan ürünler',
      subtitle: 'Senin için seçtiğimiz, iyiliğe dokunan ürünler.',
      cta: 'Hemen keşfet',
      icon: Sparkles,
      gradient: 'from-rose-500 via-[#f34723] to-orange-500',
      onClick: scrollToAll,
    },
  ];

  const showSections = !hasFilters && !isLoading && (products?.length ?? 0) > 0;

  return (
    <div className="flex h-full w-full max-w-full flex-col overflow-x-hidden bg-secondary/30">
      {/* ── 1. Sabit üst: slim bar — geri + arama + filtre/sırala (başlık YOK) ── */}
      <div className={cn('sticky z-20 w-full max-w-full shrink-0 space-y-2.5 overflow-x-hidden border-b border-border bg-background px-4 py-2.5', user ? 'top-12' : 'top-0')}>
        <div className="flex w-full items-center gap-2">
          {/* Geri */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-2xl"
            aria-label="Geri"
          >
            <Link href="/market">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          {/* Arama */}
          <div className="relative min-w-0 flex-grow">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`${(totalCount ?? products?.length ?? 0).toLocaleString('tr-TR')} ürün içinde ara`}
              className="h-11 rounded-2xl border-none bg-muted/50 pl-10 text-base focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Kategori filtre */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-2xl border-none bg-background shadow-sm"
                aria-label="Kategori filtrele"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto rounded-2xl">
              <DropdownMenuLabel>Kategori</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'flex items-center justify-between gap-2',
                    activeCategory === cat && 'font-bold text-primary',
                  )}
                >
                  <span className="truncate">{cat}</span>
                  {activeCategory === cat && (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sırala */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-2xl border-none bg-background shadow-sm"
                aria-label="Sırala"
              >
                <ArrowDownUp className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sırala</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={cn(
                    'flex items-center justify-between gap-2',
                    sortBy === opt && 'font-bold text-primary',
                  )}
                >
                  <span>{SORT_LABELS[opt]}</span>
                  {sortBy === opt && <Check className="h-4 w-4 shrink-0" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── 2. Kategori çip şeridi (yatay kaydırma) — w-full min-w-0 ile
            kapsayıcıya sınırlı; negatif margin YOK ki viewport'u taşırıp
            sayfayı yatay kaydırmasın. ── */}
        {(products?.length ?? 0) > 0 && (
          <div className={cn('flex w-full min-w-0 items-center gap-2 overflow-x-auto py-0.5', NO_SCROLLBAR)}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Aktif filtre özeti + temizle */}
        {hasFilters && (
          <div className={cn('flex w-full min-w-0 items-center gap-2 overflow-x-auto', NO_SCROLLBAR)}>
            {sortBy !== 'recommended' && (
              <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                {SORT_LABELS[sortBy]}
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Temizle
            </button>
          </div>
        )}
      </div>

      {/* ── Kaydırılabilir gövde — w-full max-w-full + overflow-x-hidden:
          içerideki yatay şeritler kendi kayar, sayfa bloğu yatay kaymaz. ── */}
      <main ref={mainRef} className="w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto pb-32">
        {isLoading && (!products || products.length === 0) ? (
          <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(8)].map((_, i) => (
              <Card key={i} variant="glass" className="h-72 animate-pulse" />
            ))}
          </div>
        ) : (products?.length ?? 0) === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={ShoppingBag}
              title="Ürün bulunamadı"
              description="Henüz listelenecek ürün yok. Yakında burada olacaklar."
            />
          </div>
        ) : (
          <>
            {showSections && (
              <>
                {/* ── 3. Kampanya / banner carousel — sayfanın EN ÜST görseli.
                    Premium Apple-kimlikli hero'lar: katmanlı derinlik (gradient +
                    blur orb'lar), büyük tipografi, CTA chip, marka logo kolajı. ── */}
                <section className="w-full max-w-full pt-2">
                  <div
                    className={cn(
                      'flex w-full min-w-0 gap-3 overflow-x-auto px-4 py-2 snap-x snap-mandatory',
                      NO_SCROLLBAR,
                    )}
                  >
                    {banners.map((b) => {
                      const Icon = b.icon;
                      return (
                        <button
                          key={b.key}
                          type="button"
                          onClick={b.onClick}
                          className={cn(
                            'group relative flex h-[188px] w-[86%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-left text-white shadow-lg shadow-primary/20 ring-1 ring-white/10 transition-transform active:scale-[0.985] sm:w-[440px]',
                            b.gradient,
                          )}
                        >
                          {/* Katmanlı derinlik: yumuşak blur orb'lar + ışık vurgusu */}
                          <span className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
                          <span className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-black/10 blur-2xl" />
                          <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />

                          {/* Üst satır: kicker + ikon rozeti */}
                          <div className="relative flex items-center justify-between gap-2">
                            <span className="inline-flex min-w-0 items-center truncate rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-sm">
                              {b.eyebrow}
                            </span>
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                              <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          </div>

                          {/* Başlık + alt metin */}
                          <div className="relative">
                            <p className="text-lg font-black leading-tight drop-shadow-sm">
                              {b.title}
                            </p>
                            <p className="mt-1 line-clamp-2 max-w-[88%] text-xs font-medium text-white/90">
                              {b.subtitle}
                            </p>
                          </div>

                          {/* Alt satır: CTA chip + marka logo kolajı */}
                          <div className="relative flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-primary shadow-sm">
                              {b.cta}
                              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </span>
                            {b.showBrandLogos && topBrands.length > 0 && (
                              <div className="flex items-center -space-x-2.5">
                                {topBrands.map((brand) => (
                                  <span
                                    key={brand.id}
                                    className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-2 ring-white"
                                  >
                                    <BrandLogo brand={brand} />
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sayfa noktaları (statik gösterge — premium dokunuş) */}
                  {banners.length > 1 && (
                    <div className="mt-2.5 flex items-center justify-center gap-1.5">
                      {banners.map((b, i) => (
                        <span
                          key={b.key}
                          aria-hidden="true"
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            i === 0 ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30',
                          )}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* ── 4. Hızlı kategori kutucukları ── */}
                {quickTiles.length > 0 && (
                  <section className="px-4 pt-5">
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-8">
                      {quickTiles.map((cat) => {
                        const Icon = iconForCategory(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className="flex flex-col items-center gap-1.5"
                          >
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors hover:bg-primary/20">
                              <Icon className="h-6 w-6" />
                            </span>
                            <span className="line-clamp-2 max-w-[64px] text-center text-[11px] font-semibold leading-tight text-foreground">
                              {cat}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* ── 5. Yatay ürün şeritleri ── */}
                <ProductStrip
                  title="En Çok Bağış Yapanlar"
                  emoji="🧡"
                  items={topDonationStrip}
                  resolveRate={resolveProductRate}
                  onSeeAll={() => setSortBy('donationDesc')}
                />
                <ProductStrip
                  title="İndirimdekiler"
                  icon={Tag}
                  items={dealsStrip}
                  resolveRate={resolveProductRate}
                  onSeeAll={scrollToAll}
                />
                <ProductStrip
                  title="Öne Çıkanlar"
                  icon={Sparkles}
                  items={featuredStrip}
                  resolveRate={resolveProductRate}
                  onSeeAll={scrollToAll}
                />
                {categoryStrips.map((strip) =>
                  strip.items.length >= 3 ? (
                    <ProductStrip
                      key={strip.name}
                      title={strip.name}
                      icon={Gift}
                      items={strip.items}
                      resolveRate={resolveProductRate}
                      onSeeAll={() => setActiveCategory(strip.name)}
                    />
                  ) : null,
                )}
              </>
            )}

            {/* ── 6. "Tüm Ürünler" ana grid ── */}
            <section ref={allProductsRef} className="px-4 pt-6 scroll-mt-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-black text-foreground">
                  {hasFilters ? 'Sonuçlar' : 'Tüm Ürünler'}
                </h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  {filtered.length.toLocaleString('tr-TR')} ürün
                </span>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="Ürün bulunamadı"
                  description="Aramana uygun ürün yok. Filtreleri temizleyip tekrar dene."
                  action={{ label: 'Filtreleri temizle', onClick: resetFilters }}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filtered.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      donationRate={resolveProductRate(product)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/**
 * Trendyol "fırsat" satırı — başlık + yatay kaydırmalı kompakt ürün kartları.
 * Her kart bağış oranı rozetiyle (resolveRate) gelir.
 */
function ProductStrip({
  title,
  emoji,
  icon: Icon,
  items,
  resolveRate,
  onSeeAll,
}: {
  title: string;
  emoji?: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: CanonicalProduct[];
  resolveRate: (p: CanonicalProduct) => number;
  onSeeAll?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="w-full max-w-full pt-6">
      <div className="mb-2.5 flex items-center justify-between gap-2 px-4">
        <h2 className="flex min-w-0 items-center gap-1.5 text-base font-black text-foreground">
          {emoji ? <span aria-hidden="true">{emoji}</span> : null}
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
          <span className="truncate">{title}</span>
        </h2>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-primary"
          >
            Tümü <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className={cn('flex w-full min-w-0 gap-2.5 overflow-x-auto px-4 pb-1', NO_SCROLLBAR)}>
        {items.map((p) => (
          <div key={p.id} className="w-36 shrink-0 sm:w-40">
            <ProductCard product={p} donationRate={resolveRate(p)} />
          </div>
        ))}
      </div>
    </section>
  );
}
