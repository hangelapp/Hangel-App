'use client';

import { useState, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Camera, Filter, ArrowDownUp } from 'lucide-react';
import { marketCategories, allEntityLists, adBanners, categoryMapping } from '@/lib/data';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const AdCarousel = () => {
    const plugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true })
    );

    return (
        <Carousel
            plugins={[plugin.current]}
            opts={{
            align: 'start',
            loop: true,
            }}
            className="w-full"
        >
            <CarouselContent>
            {adBanners.map((ad) => (
                <CarouselItem key={ad.id}>
                    <Link href={ad.link} passHref>
                        <div className="relative w-full h-12 rounded-lg overflow-hidden bg-primary/10">
                            <div className="absolute inset-0 flex items-center justify-center p-2">
                                <p className="font-semibold text-primary text-sm text-center truncate">{ad.title} - <span className='font-normal text-primary/80'>{ad.description}</span></p>
                            </div>
                        </div>
                    </Link>
                </CarouselItem>
            ))}
            </CarouselContent>
        </Carousel>
    );
};

export default function MarketPage() {
  const [activeCategory, setActiveCategory] = useState('Öne çıkanlar');
  const [activeEntityType, setActiveEntityType] = useState('all');

  const brandsToShow = useMemo(() => {
    let filteredList = allEntityLists;

    // 1. Filter by Entity Type
    if (activeEntityType !== 'all') {
      filteredList = filteredList.filter(item => item.type === activeEntityType);
    }

    // 2. Filter by Category
    if (activeCategory === 'Tümü') {
      return filteredList;
    }
    if (activeCategory === 'Öne çıkanlar') {
      return [...filteredList].sort((a, b) => (b.followers || 0) - (a.followers || 0)).slice(0, 18);
    }
    
    const brandCategories = categoryMapping[activeCategory as keyof typeof categoryMapping];
    if (!brandCategories || brandCategories.length === 0) {
      return [];
    }

    return filteredList.filter(brand => brandCategories.includes(brand.category));

  }, [activeCategory, activeEntityType]);
  
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
        <div className="p-2 space-y-2 border-b shrink-0">
            <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="hangel'da Ara"
                        className="pl-10 h-10 rounded-full bg-muted border-none"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <Camera className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                    <Filter className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                    <ArrowDownUp className="h-5 w-5" />
                </Button>
            </div>

            <AdCarousel />
            
            <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveEntityType(value as any)}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="cooperative">Kooperatif</TabsTrigger>
                    <TabsTrigger value="brand">Marka</TabsTrigger>
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="economic">İktisadi İşl.</TabsTrigger>
                    <TabsTrigger value="social">Sosyal İşl.</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
        <div className="flex flex-1 overflow-y-hidden">
            <aside className="w-1/4 border-r overflow-y-auto">
            <nav className="flex flex-col">
                {marketCategories.map((cat) => (
                <button
                    key={cat.mainCategory}
                    onClick={() => setActiveCategory(cat.mainCategory)}
                    className={cn(
                    "text-left text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap truncate",
                    activeCategory === cat.mainCategory
                        ? "bg-primary/10 text-primary border-l-4 border-primary font-bold"
                        : "text-muted-foreground hover:bg-accent",
                    cat.mainCategory === 'Öne çıkanlar' && "font-bold"
                    )}
                >
                    {cat.mainCategory}
                </button>
                ))}
            </nav>
            </aside>

            <main className="w-3/4 flex-1 overflow-y-auto p-2">
            <div>
                <h2 className="font-bold text-sm sm:text-base mb-2 px-2">
                {activeCategory}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                {brandsToShow.length > 0 ? brandsToShow.map((brand) => (
                    <Link href={brand.link || '#'} key={brand.id}>
                    <div className="flex flex-col items-center text-center space-y-1 p-1">
                        <div className="relative w-full aspect-square">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                            <Image
                            src={brand.logoUrl}
                            alt={brand.name}
                            fill
                            className="object-contain"
                            />
                        </div>
                        {brand.donationRate > 0 && (
                            <div className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background h-6 w-6 md:h-8 md:w-8 md:text-xs">
                            {brand.donationRate}%
                            </div>
                        )}
                        </div>
                        <p className="mt-1 text-xs font-medium text-center leading-tight">{brand.name}</p>
                    </div>
                    </Link>
                )) : (
                    <p className="col-span-full text-center text-muted-foreground mt-8 text-sm">Bu kategoride sonuç bulunmuyor.</p>
                )}
                </div>
            </div>
            </main>
        </div>
    </div>
  );
}
