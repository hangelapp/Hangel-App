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
  // En doğru domain: targetDomain → link → contact.website → marka adından türet.
  const domain = (() => {
    const clean = (h: string) => h.replace(/^www\./, '');
    if (brand.targetDomain) return clean(brand.targetDomain.replace(/^https?:\/\//, '').split('/')[0]);
    try { if (brand.link) return clean(new URL(brand.link).hostname); } catch {}
    const web = brand.contact?.website;
    try { if (web) return clean(new URL(web.startsWith('http') ? web : `https://${web}`).hostname); } catch {}
    return `${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.tr`;
  })();

  // Keskin logo kaynak zinciri — kötü/bulanık logoyu otomatik en iyisiyle değiştirir:
  //  1) markanın yüklediği gerçek logo (clearbit DEĞİLse) — en iyi
  //  2) unavatar.io — çoklu kaynaktan GERÇEK marka logosunu getirir (keskin; yoksa 404)
  //  3) Google favicon sz=256 — güvenli son çare (eski sz=128 bulanıktı)
  // Clearbit kapandı (DNS yok) → DB'deki logo.clearbit.com URL'leri atlanır.
  const realLogo = (() => {
    const url = brand.logoUrl || '';
    return !url || url.includes('logo.clearbit.com/') ? '' : url;
  })();

  const sources = [
    realLogo,
    `https://unavatar.io/${domain}?fallback=false`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
  ].filter(Boolean);

  const [srcIndex, setSrcIndex] = useState(0);
  const [hasError, setHasError] = useState(sources.length === 0);

  if (hasError || !sources[srcIndex]) {
    return (
      <div className="absolute inset-0 rounded-2xl bg-primary/10 flex items-center justify-center p-2">
        <span className="text-primary font-black text-xl">{brand.name.charAt(0)}</span>
      </div>
    );
  }

  const tryNext = () => {
    setSrcIndex((i) => {
      if (i < sources.length - 1) return i + 1;
      setHasError(true);
      return i;
    });
  };

  return (
    <img
      src={sources[srcIndex]}
      alt={brand.name}
      className="absolute inset-0 w-full h-full object-contain p-3"
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth < 16 || img.naturalHeight < 16) tryNext();
      }}
      onError={tryNext}
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
    <div className="flex flex-col h-full bg-secondary/30 backdrop-blur-sm relative">
      <div className="p-4 space-y-4 border-b border-border bg-background sticky top-12 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('marketPage.searchPlaceholder')}
              className="pl-10 h-12 rounded-2xl border-none bg-muted/50 focus-visible:ring-1 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-background border-none shadow-sm" aria-label={t('marketPage.filterAria')}>
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
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-background border-none shadow-sm" aria-label={t('marketPage.sortAria')}>
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

        <Button asChild variant="outline" className="w-full rounded-2xl gap-2 border-none bg-primary/10 text-primary font-bold shadow-sm hover:bg-primary/15">
          <Link href="/market/discover">
            <ShoppingBag className="h-5 w-5" />
            Ürünleri Keşfet
          </Link>
        </Button>

        <Tabs defaultValue="all" onValueChange={setBrandType} className="w-full">
          <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <TabsTrigger value="all" className="shrink-0 sm:shrink whitespace-nowrap text-xs px-3">{t('marketPage.tabAll')}</TabsTrigger>
            <TabsTrigger value="brand" className="shrink-0 sm:shrink whitespace-nowrap text-xs px-3">{t('marketPage.tabCommercial')}</TabsTrigger>
            <TabsTrigger value="cooperative" className="shrink-0 sm:shrink whitespace-nowrap text-xs px-3">{t('marketPage.tabCooperative')}</TabsTrigger>
            <TabsTrigger value="social" className="shrink-0 sm:shrink whitespace-nowrap text-xs px-3">{t('marketPage.tabSocial')}</TabsTrigger>
            <TabsTrigger value="economic" className="shrink-0 sm:shrink whitespace-nowrap text-xs px-3">{t('marketPage.tabEconomic')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden sm:block sm:w-1/4 lg:w-1/5 border-r border-border overflow-y-auto bg-background/50">
          <nav className="flex flex-col py-2">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-left text-sm px-3 min-h-[44px] flex items-center whitespace-nowrap truncate transition-all",
                  activeCategory === cat
                    ? "bg-primary/10 text-primary border-l-4 border-primary font-black"
                    : "text-muted-foreground hover:bg-accent/50"
                )}
              >
                {cat}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 pb-32">
          {activeCategory === 'Ürünler' ? (
            productsLoading && (allProducts?.length ?? 0) === 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => <Card key={i} variant="glass" className="h-64 animate-pulse" />)}
              </div>
            ) : productsToShow.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Ürün bulunamadı"
                description={searchTerm ? 'Aramanıza uygun ürün yok.' : 'Henüz listelenecek ürün yok.'}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {productsToShow.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )
          ) : isLoading && brandsToShow.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => <Card key={i} variant="glass" className="h-32 animate-pulse" />)}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {brandsToShow.map((brand) => {
                const safeDonationRate = Math.max(0, Math.min(100, brand.donationRate || 0));
                return (
                  <Link href={`/market/${brand.slug}`} key={brand.id} className="group">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="relative w-full aspect-square">
                        <div className="w-full h-full rounded-2xl bg-card border border-border overflow-hidden shadow-sm group-hover:shadow-md transition-all relative">
                          <BrandLogo brand={brand} />
                        </div>
                        <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-black text-white border-2 border-background">
                          %{safeDonationRate}
                        </div>
                      </div>
                      <p className="text-xs font-bold leading-tight text-foreground group-hover:text-primary line-clamp-2">{brand.name}</p>
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
