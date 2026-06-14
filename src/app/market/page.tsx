'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowDownUp, HeartHandshake, ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Brand } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, limit, query, orderBy, startAt } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { ProductCard } from '@/components/market/product-card';
import type { CanonicalProduct } from '@/lib/feed/types';
import { COLLECTIONS } from '@/firebase/collections';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/components/providers/language-provider';

const BrandLogo = ({ brand }: { brand: Brand }) => {
  const domain = (() => {
    try { if (brand.link) return new URL(brand.link).hostname; } catch {}
    return `${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.tr`;
  })();

  // FIX: Firestore brands collection'da hala logo.clearbit.com URL'leri var.
  // Render etmeden önce auto-replace — Google favicon'a çevir. Clearbit
  // servisi kapandı (DNS resolve etmiyor), her render console error spam.
  const sanitizedLogoUrl = (() => {
    const url = brand.logoUrl || '';
    if (url.includes('logo.clearbit.com/')) {
      const cbDomain = url.split('logo.clearbit.com/')[1]?.split(/[?#]/)[0] || domain;
      return `https://www.google.com/s2/favicons?domain=${cbDomain}&sz=128`;
    }
    return url;
  })();

  const [imgSrc, setImgSrc] = useState(sanitizedLogoUrl);
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const fallbacks = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ].filter(url => url !== sanitizedLogoUrl);

  if (hasError || !imgSrc) {
    return (
      <div className="absolute inset-0 rounded-2xl bg-primary/10 flex items-center justify-center p-2">
        <span className="text-primary font-black text-xl">{brand.name.charAt(0)}</span>
      </div>
    );
  }

  const tryNextFallback = () => {
    if (fallbackIndex < fallbacks.length) {
      setImgSrc(fallbacks[fallbackIndex]);
      setFallbackIndex(i => i + 1);
    } else {
      setHasError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={brand.name}
      className="absolute inset-0 w-full h-full object-contain p-3"
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth < 10 || img.naturalHeight < 10) tryNextFallback();
      }}
      onError={tryNextFallback}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};

export default function MarketPage() {
  const db = useFirestore();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [brandType, setBrandType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  type SortOption = 'default' | 'donationDesc' | 'donationAsc' | 'nameAsc' | 'nameDesc';
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Firestore brands (manually added/approved)
  const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
  const { data: firestoreBrands, isLoading: firestoreLoading } = useCollection<Brand>(brandsQuery);

  // "Ürünler" kategorisi: tüm markaların ürünleri (feed ile çekilmiş).
  // Her yüklemede `random` alanına rastgele başlangıç → ürünler her seferinde farklı gelir.
  const [productsRandSeed, setProductsRandSeed] = useState(0);
  useEffect(() => { setProductsRandSeed(Math.random() * 0.8); }, []);
  const productsQuery = useMemoFirebase(() => query(collection(db, COLLECTIONS.products), orderBy('random'), startAt(productsRandSeed), limit(120)), [db, productsRandSeed]);
  const { data: allProducts, isLoading: productsLoading } = useCollection<CanonicalProduct>(productsQuery);
  const productsToShow = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();
    const list = allProducts || [];
    return lower ? list.filter((p) => p.title?.toLowerCase().includes(lower) || p.brandName?.toLowerCase().includes(lower)) : list;
  }, [allProducts, searchTerm]);

  // API brands from affiliate networks (Tune/ReklamAction + others)
  const [apiBrands, setApiBrands] = useState<Brand[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    fetch('/api/offers')
      .then(res => res.ok ? res.json() : [])
      .then((data: Brand[]) => {
        setApiBrands(Array.isArray(data) ? data : []);
      })
      .catch(() => setApiBrands([]))
      .finally(() => setApiLoading(false));
  }, []);

  // Onboarding'i "Formu daha sonra dolduracağım" ile atlayan kullanıcılar için
  // hoşgeldin popup'ı: settings/volunteer flag'i kontrol eder, bir kez gösterip
  // localStorage'dan siler.
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (localStorage.getItem('showWelcomeBenefitsPopup') === '1') {
        setShowWelcome(true);
        localStorage.removeItem('showWelcomeBenefitsPopup');
      }
    } catch { /* localStorage erişilemedi — popup atlanır */ }
  }, []);

  const isLoading = firestoreLoading || apiLoading;

  // Per-session random seed: Math.random() lives in an effect (pure-in-render
  // compliant); the shuffle below is deterministic given this seed.
  const [shuffleSeed, setShuffleSeed] = useState(0);
  useEffect(() => { setShuffleSeed(Math.floor(Math.random() * 2_147_483_646) + 1); }, []);

  // Lint-clean simple-expression key over the unique brand-id set.
  const brandIdKey = useMemo(
    () => Array.from(new Set([...(firestoreBrands || []), ...apiBrands].map(b => b?.id).filter(Boolean))).sort().join(','),
    [firestoreBrands, apiBrands],
  );

  // Stable randomized rank for the 'default' (Önerilen) sort. Reshuffles only
  // when the brand-id set or the session seed changes — never on search/filter
  // or ordinary re-renders. Seeded PRNG (mulberry32) keeps this useMemo pure.
  const randomRank = useMemo(() => {
    const uniqueIds = brandIdKey ? brandIdKey.split(',') : [];
    let s = shuffleSeed || 1;
    const rand = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const shuffled = [...uniqueIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const rank = new Map<string, number>();
    shuffled.forEach((id, index) => rank.set(id, index));
    return rank;
  }, [brandIdKey, shuffleSeed]);

  const brandsToShow = useMemo(() => {
    // Merge: Firestore brands take priority over API brands
    const combined = [...(firestoreBrands || []), ...apiBrands];

    const uniqueMap = new Map<string, Brand>();
    combined.forEach(b => {
      if (!b?.name) return;
      const key = b.id;
      if (!uniqueMap.has(key)) uniqueMap.set(key, b);
    });

    let list = Array.from(uniqueMap.values());

    // Hide brands whose donation rate is outside a meaningful range
    // (PDF audit #3: bazı markalar %0 / %100 gösteriyor). Anything <1 or >100
    // is treated as missing/bogus and excluded from the public list.
    // 2026-05-23: ayrıca super-admin tarafından Pasif/Silindi işaretlenen
    // markalar public listede görünmez (API kataloğundan gelse bile Firestore
    // doc'u öncelikli olduğundan status alanı buraya yansır).
    list = list.filter(b => {
      const status = (b as Brand & { status?: string }).status;
      if (status === 'Silindi' || status === 'Pasif' || status === 'Reddedildi') return false;
      const rate = Number(b.donationRate);
      return Number.isFinite(rate) && rate >= 1 && rate <= 100;
    });

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(lower));
    }

    if (activeCategory !== 'Tümü') {
      // BUG-26: Marka birincil kategorisi VEYA çoklu kategori listesi (categories[])
      // ile aktif kategoride görünür. Bir markanın birden fazla kategoride ürünü
      // varsa categories[] alanına eklenir → her ilgili kategori sekmesinde çıkar.
      list = list.filter(b => {
        const cats = (b as Brand & { categories?: string[] }).categories;
        if (Array.isArray(cats) && cats.includes(activeCategory)) return true;
        return b.category === activeCategory;
      });
    }

    if (brandType !== 'all') {
      list = list.filter(b => b.type === brandType);
    }

    switch (sortBy) {
      case 'donationDesc': list.sort((a, b) => b.donationRate - a.donationRate); break;
      case 'donationAsc':  list.sort((a, b) => a.donationRate - b.donationRate); break;
      case 'nameAsc':      list.sort((a, b) => a.name.localeCompare(b.name, 'tr')); break;
      case 'nameDesc':     list.sort((a, b) => b.name.localeCompare(a.name, 'tr')); break;
      default:             list.sort((a, b) => (randomRank.get(a.id) ?? 0) - (randomRank.get(b.id) ?? 0)); break;
    }
    return list;
  }, [firestoreBrands, apiBrands, activeCategory, searchTerm, brandType, sortBy, randomRank]);

  // Derive categories dynamically from all loaded brands.
  // Marka çoklu kategori desteği: primary `category` + `categories[]` array'i birleşir.
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const b of brandsToShow) {
      if (b.category) cats.add(b.category);
      const multi = (b as Brand & { categories?: string[] }).categories;
      if (Array.isArray(multi)) {
        for (const c of multi) if (c) cats.add(c);
      }
    }
    return ['Ürünler', 'Tümü', ...Array.from(cats).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [brandsToShow]);

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Apple-style header: generous whitespace, large tracking-tight title,
          minimal borders. All data/filter/search/sort behaviour preserved. */}
      <div className="px-5 sm:px-8 pt-7 pb-5 space-y-6 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-12 z-20 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t('marketPage.title') !== 'marketPage.title' ? t('marketPage.title') : 'market'}
            </h1>
            <p className="text-sm text-muted-foreground tracking-tight">
              {t('marketPage.subtitle') !== 'marketPage.subtitle' ? t('marketPage.subtitle') : 'Alışverişin kalbiyle buluştuğu yer.'}
            </p>
          </div>
          <Button asChild variant="ghost" className="h-11 self-start sm:self-auto rounded-full gap-2 px-5 text-primary font-medium hover:bg-primary/5">
            <Link href="/market/products">
              <ShoppingBag className="h-5 w-5" />
              Ürünleri Keşfet
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('marketPage.searchPlaceholder')}
              className="pl-11 h-12 rounded-full border border-border/50 bg-muted/40 focus-visible:ring-1 focus-visible:bg-background text-base tracking-tight transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0 rounded-full border border-border/50 bg-background hover:bg-muted/60" aria-label={t('marketPage.filterAria')}>
                <Filter className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {allCategories.map(cat => (
                <DropdownMenuItem key={cat} onClick={() => setActiveCategory(cat)}>
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0 rounded-full border border-border/50 bg-background hover:bg-muted/60" aria-label={t('marketPage.sortAria')}>
                <ArrowDownUp className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('default')} className={sortBy === 'default' ? 'font-bold text-primary' : ''}>{t('marketPage.sortRecommended')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('donationDesc')} className={sortBy === 'donationDesc' ? 'font-bold text-primary' : ''}>{t('marketPage.sortDonationDesc')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('donationAsc')} className={sortBy === 'donationAsc' ? 'font-bold text-primary' : ''}>{t('marketPage.sortDonationAsc')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('nameAsc')} className={sortBy === 'nameAsc' ? 'font-bold text-primary' : ''}>{t('marketPage.sortNameAsc')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('nameDesc')} className={sortBy === 'nameDesc' ? 'font-bold text-primary' : ''}>{t('marketPage.sortNameDesc')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Brand-type filter as pill segmented control (Apple-style). */}
        <Tabs defaultValue="all" onValueChange={setBrandType} className="w-full">
          <TabsList className="flex w-full justify-start gap-2 bg-transparent p-0 h-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <TabsTrigger value="all" className="shrink-0 rounded-full border border-border/50 px-4 py-1.5 text-xs font-medium tracking-tight data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary data-[state=active]:shadow-none">{t('marketPage.tabAll')}</TabsTrigger>
            <TabsTrigger value="brand" className="shrink-0 rounded-full border border-border/50 px-4 py-1.5 text-xs font-medium tracking-tight data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary data-[state=active]:shadow-none">{t('marketPage.tabCommercial')}</TabsTrigger>
            <TabsTrigger value="cooperative" className="shrink-0 rounded-full border border-border/50 px-4 py-1.5 text-xs font-medium tracking-tight data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary data-[state=active]:shadow-none">{t('marketPage.tabCooperative')}</TabsTrigger>
            <TabsTrigger value="social" className="shrink-0 rounded-full border border-border/50 px-4 py-1.5 text-xs font-medium tracking-tight data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary data-[state=active]:shadow-none">{t('marketPage.tabSocial')}</TabsTrigger>
            <TabsTrigger value="economic" className="shrink-0 rounded-full border border-border/50 px-4 py-1.5 text-xs font-medium tracking-tight data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary data-[state=active]:shadow-none">{t('marketPage.tabEconomic')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Category rail: borderless, airy, pill active-state. */}
        <aside className="w-[108px] sm:w-1/5 overflow-y-auto bg-background [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <nav className="flex flex-col gap-1 py-4 px-2 sm:px-4">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-left text-[12px] sm:text-sm rounded-full px-3 py-2 whitespace-nowrap truncate tracking-tight transition-colors",
                  activeCategory === cat
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 pb-32">
          {activeCategory === 'Ürünler' ? (
            productsLoading && (allProducts?.length ?? 0) === 0 ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => <Card key={i} variant="glass" className="h-64 animate-pulse rounded-3xl" />)}
              </div>
            ) : productsToShow.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Ürün bulunamadı"
                description={searchTerm ? 'Aramanıza uygun ürün yok.' : 'Henüz listelenecek ürün yok.'}
              />
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {productsToShow.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )
          ) : isLoading && brandsToShow.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => <Card key={i} variant="glass" className="h-40 animate-pulse rounded-3xl" />)}
            </div>
          ) : brandsToShow.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={t('emptyStates.marketTitle')}
              description={searchTerm || activeCategory !== 'Tümü' || brandType !== 'all' ? t('marketPage.noMatch') : t('emptyStates.marketDesc')}
              action={searchTerm || activeCategory !== 'Tümü' || brandType !== 'all' ? {
                label: t('emptyStates.marketAction'),
                onClick: () => {
                  setSearchTerm('');
                  setActiveCategory('Tümü');
                  setBrandType('all');
                },
              } : undefined}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
              {brandsToShow.map((brand) => {
                const safeDonationRate = Math.max(0, Math.min(100, brand.donationRate || 0));
                return (
                  <Link href={`/market/${brand.slug}`} key={brand.id} className="group">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="relative w-full aspect-square">
                        <div className="w-full h-full rounded-[1.75rem] bg-muted/30 overflow-hidden transition-all duration-300 group-hover:bg-muted/50 relative">
                          <BrandLogo brand={brand} />
                        </div>
                        <div className="absolute top-2 right-2 flex h-9 min-w-9 px-1.5 items-center justify-center rounded-full bg-background/90 backdrop-blur text-[11px] font-bold text-primary shadow-sm">
                          %{safeDonationRate}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-medium tracking-tight leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">{brand.name}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-2">
              <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E34234' }}>
                <HeartHandshake className="h-7 w-7 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-black">{t('marketPage.welcomeTitle')}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-left pt-2 text-foreground leading-relaxed">
                <p>{t('marketPage.welcomeP1')}</p>
                <p>{t('marketPage.welcomeP2')}</p>
                <p>{t('marketPage.welcomeP3')}</p>
                <p className="font-bold">{t('marketPage.welcomeP4')}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowWelcome(false)} className="w-full rounded-xl">{t('marketPage.welcomeCta')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
