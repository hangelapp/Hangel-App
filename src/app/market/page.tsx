'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowDownUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Brand } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { COLLECTIONS } from '@/firebase/collections';

const BrandLogo = ({ brand }: { brand: Brand }) => {
  const [imgSrc, setImgSrc] = useState(brand.logoUrl || '');
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const domain = (() => {
    try { if (brand.link) return new URL(brand.link).hostname; } catch {}
    return `${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.tr`;
  })();

  const fallbacks = [
    `https://logo.uplead.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ].filter(url => url !== brand.logoUrl);

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
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [brandType, setBrandType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  type SortOption = 'default' | 'donationDesc' | 'donationAsc' | 'nameAsc' | 'nameDesc';
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Firestore brands (manually added/approved)
  const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
  const { data: firestoreBrands, isLoading: firestoreLoading } = useCollection<Brand>(brandsQuery);

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

  const isLoading = firestoreLoading || apiLoading;

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
    list = list.filter(b => {
      const rate = Number(b.donationRate);
      return Number.isFinite(rate) && rate >= 1 && rate <= 100;
    });

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(lower));
    }

    if (activeCategory !== 'Tümü') {
      list = list.filter(b => b.category === activeCategory);
    }

    if (brandType !== 'all') {
      list = list.filter(b => b.type === brandType);
    }

    switch (sortBy) {
      case 'donationDesc': list.sort((a, b) => b.donationRate - a.donationRate); break;
      case 'donationAsc':  list.sort((a, b) => a.donationRate - b.donationRate); break;
      case 'nameAsc':      list.sort((a, b) => a.name.localeCompare(b.name, 'tr')); break;
      case 'nameDesc':     list.sort((a, b) => b.name.localeCompare(a.name, 'tr')); break;
      default:             list.sort((a, b) => b.donationRate - a.donationRate); break;
    }
    return list;
  }, [firestoreBrands, apiBrands, activeCategory, searchTerm, brandType, sortBy]);

  // Derive categories dynamically from all loaded brands
  const allCategories = useMemo(() => {
    const cats = new Set(brandsToShow.map(b => b.category).filter(Boolean));
    return ['Tümü', ...Array.from(cats).sort()];
  }, [brandsToShow]);

  return (
    <div className="flex flex-col h-full bg-secondary/30 relative">
      <div className="p-4 space-y-4 border-b bg-background/80 backdrop-blur-xl sticky top-12 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Marka Ara..."
              className="pl-10 h-12 rounded-2xl border-none bg-muted/50 focus-visible:ring-1 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-background border-none shadow-sm" aria-label="Filtrele">
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
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-background border-none shadow-sm" aria-label="Sırala">
                <ArrowDownUp className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('default')} className={sortBy === 'default' ? 'font-bold text-primary' : ''}>Varsayılan</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('donationDesc')} className={sortBy === 'donationDesc' ? 'font-bold text-primary' : ''}>En çok bağış yapan</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('donationAsc')} className={sortBy === 'donationAsc' ? 'font-bold text-primary' : ''}>En az bağış yapan</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('nameAsc')} className={sortBy === 'nameAsc' ? 'font-bold text-primary' : ''}>Alfabetik (A → Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('nameDesc')} className={sortBy === 'nameDesc' ? 'font-bold text-primary' : ''}>Alfabetik (Z → A)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue="all" onValueChange={setBrandType} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="text-[10px]">Tümü</TabsTrigger>
            <TabsTrigger value="brand" className="text-[10px]">Ticari</TabsTrigger>
            <TabsTrigger value="cooperative" className="text-[10px]">Kooperatif</TabsTrigger>
            <TabsTrigger value="social" className="text-[10px]">Sosyal İşletme</TabsTrigger>
            <TabsTrigger value="economic" className="text-[10px]">İktisadi İşletme</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[100px] sm:w-1/4 border-r overflow-y-auto bg-background/50">
          <nav className="flex flex-col py-2">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-left text-[11px] sm:text-sm p-4 whitespace-nowrap truncate transition-all",
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
          {isLoading && brandsToShow.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-muted" />)}
            </div>
          ) : brandsToShow.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground italic">
              Aramanızla eşleşen marka bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {brandsToShow.map((brand) => {
                const safeDonationRate = Math.max(0, Math.min(100, brand.donationRate || 0));
                return (
                  <Link href={`/market/${brand.slug}`} key={brand.id} className="group">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="relative w-full aspect-square">
                        <div className="w-full h-full rounded-[1.5rem] bg-white border border-gray-100 overflow-hidden shadow-sm group-hover:shadow-xl transition-all relative">
                          <BrandLogo brand={brand} />
                        </div>
                        <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white border-2 border-white">
                          %{safeDonationRate}
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs font-bold leading-tight text-foreground group-hover:text-primary line-clamp-2">{brand.name}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
