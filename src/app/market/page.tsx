
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Loader2, ArrowDownUp } from 'lucide-react';
import { marketCategories, allEntityLists, adBanners } from '@/lib/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Brand } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";

const BrandLogo = ({ brand }: { brand: Brand }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !brand.logoUrl) {
    return (
      <div className="w-full h-full rounded-2xl bg-primary/10 flex items-center justify-center p-2">
        <span className="text-primary font-black text-xl">{brand.name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <img 
      src={brand.logoUrl} 
      alt={brand.name} 
      className="w-full h-full object-contain p-3"
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

const AdCarousel = () => {
    const plugin = useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
    );

    return (
         <Carousel
            plugins={[plugin.current]}
            opts={{
            align: 'start',
            loop: true,
            }}
            className="w-full rounded-xl overflow-hidden"
        >
            <CarouselContent>
            {adBanners.map((ad) => (
                <CarouselItem key={ad.id}>
                    <Link href={ad.link} passHref>
                        <div className="relative h-40">
                            <Image
                            src={ad.imageUrl}
                            alt={ad.title}
                            fill
                            className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                                <h3 className="font-bold text-xl">{ad.title}</h3>
                                <p className="text-base">{ad.description}</p>
                            </div>
                        </div>
                    </Link>
                </CarouselItem>
            ))}
            </CarouselContent>
        </Carousel>
    )
}

export default function MarketPage() {
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [brandType, setBrandType] = useState('all');
  const [sortKey, setSortKey] = useState('donationRate');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const brandsToShow = useMemo(() => {
    let list = [...allEntityLists];

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

    list.sort((a, b) => {
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name, 'tr');
      }
      return b.donationRate - a.donationRate;
    });
    
    return list;
  }, [activeCategory, sortKey, searchTerm, brandType]);

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
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-background border-none shadow-sm">
                <Filter className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveCategory('Tümü')}>Tüm Kategoriler</DropdownMenuItem>
              {marketCategories.filter(c => c.mainCategory !== 'Tümü').map(cat => (
                <DropdownMenuItem key={cat.mainCategory} onClick={() => setActiveCategory(cat.mainCategory)}>
                  {cat.mainCategory}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-background border-none shadow-sm">
                <ArrowDownUp className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortKey('donationRate')}>En Yüksek Bağış</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortKey('name')}>İsme Göre (A-Z)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue="all" onValueChange={setBrandType} className="w-full">
            <TabsList>
                <TabsTrigger value="all">Tümü</TabsTrigger>
                <TabsTrigger value="brand">Ticari Şirket</TabsTrigger>
                <TabsTrigger value="cooperative">Kooperatif</TabsTrigger>
                <TabsTrigger value="economic">İktisadi İşletme</TabsTrigger>
                <TabsTrigger value="social">Sosyal Şirket</TabsTrigger>
            </TabsList>
        </Tabs>

      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[100px] sm:w-1/4 border-r overflow-y-auto bg-background/50">
          <nav className="flex flex-col py-2">
            {marketCategories.map((cat) => (
              <button
                key={cat.mainCategory}
                onClick={() => setActiveCategory(cat.mainCategory)}
                className={cn(
                  "text-left text-[11px] sm:text-sm p-4 whitespace-nowrap truncate transition-all",
                  activeCategory === cat.mainCategory
                    ? "bg-primary/10 text-primary border-l-4 border-primary font-black shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50"
                )}
              >
                {cat.mainCategory}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto">
              {brandsToShow.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground italic">
                  Aramanızla eşleşen marka bulunamadı.
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {brandsToShow.map((brand, index) => (
                    <React.Fragment key={brand.id}>
                        <Link href={`/market/${brand.slug}`} className="group">
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="relative w-full aspect-square">
                            <div className="w-full h-full rounded-[1.5rem] bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-xl transition-all">
                                <BrandLogo brand={brand} />
                            </div>
                            <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white border-2 border-white">
                                %{brand.donationRate}
                            </div>
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold leading-tight text-foreground group-hover:text-primary line-clamp-2">{brand.name}</p>
                        </div>
                        </Link>
                         {(index + 1) % 15 === 0 && (
                            <div className="col-span-full my-4">
                                <AdCarousel />
                            </div>
                        )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
        </main>
      </div>
    </div>
  );
}
