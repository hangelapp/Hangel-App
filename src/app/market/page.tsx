'use client';

import { useState, useMemo, useRef, Fragment, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowDownUp, Bot, Sparkles } from 'lucide-react';
import { marketCategories, adBanners, categoryMapping, allEntityLists } from '@/lib/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Brand } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BrandLogo = ({ brand }: { brand: Brand }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError || !brand.logoUrl || brand.logoUrl === "" || brand.logoUrl === "null") {
        return (
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex flex-col items-center justify-center border shadow-inner p-2 text-center overflow-hidden">
                <span className="text-primary font-black text-2xl uppercase">{brand.name.charAt(0)}</span>
                <span className="text-[7px] font-bold text-primary/40 uppercase tracking-tighter truncate w-full px-1">{brand.name}</span>
            </div>
        );
    }

    return (
        <img 
            src={brand.logoUrl} 
            alt={brand.name} 
            className="w-full h-full object-contain p-3 transition-opacity duration-300"
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
};

const AdCarousel = () => {
    const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));
    return (
        <Carousel plugins={[plugin.current]} opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent>
            {adBanners.map((ad) => (
                <CarouselItem key={ad.id}>
                    <Link href={ad.link} passHref>
                        <div className="relative w-full h-8 rounded-lg overflow-hidden bg-primary/10">
                            <div className="absolute inset-0 flex items-center justify-center p-1">
                                <p className="text-primary text-xs text-center truncate">
                                    <span className="font-semibold">{ad.title}</span>
                                    <span className="opacity-80 ml-2">{ad.description}</span>
                                </p>
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
  const { toast } = useToast();
  const [sortKey, setSortKey] = useState('donationRate');
  const [onlyDonating, setOnlyDonating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const brandsToShow = useMemo(() => {
    let combinedList: Brand[] = [...allEntityLists];

    if (searchTerm.trim()) {
        const lowercased = searchTerm.toLowerCase();
        combinedList = combinedList.filter(brand => brand.name.toLowerCase().includes(lowercased));
    }

    if (activeCategory !== 'Tümü' && activeCategory !== 'Öne çıkanlar') {
      const mappedCategories = categoryMapping[activeCategory as keyof typeof categoryMapping];
      if (mappedCategories) {
        combinedList = combinedList.filter(brand => 
            mappedCategories.some(cat => brand.category.toLowerCase().includes(cat.toLowerCase()))
        );
      } else {
        combinedList = combinedList.filter(brand => brand.category.toLowerCase().includes(activeCategory.toLowerCase()));
      }
    }

    if (activeEntityType !== 'all') {
      combinedList = combinedList.filter(item => item.type === activeEntityType);
    }

    if (onlyDonating) {
        combinedList = combinedList.filter(item => item.donationRate > 0);
    }
    
    combinedList.sort((a, b) => sortKey === 'name' ? a.name.localeCompare(b.name, 'tr') : b.donationRate - a.donationRate);

    return combinedList;
  }, [activeCategory, activeEntityType, sortKey, onlyDonating, searchTerm]);
  
  const handleAskAssistant = useCallback(async () => {
    if (!assistantQuestion.trim()) return;
    setIsAssistantLoading(true);
    // Simulate AI response for this turn to keep UI functional while we fix logic
    setTimeout(() => {
        setAssistantResponse("Size en uygun markaları buldum! Sürdürülebilir ürünler için 'Doğa Dostu Giyim' veya 'Patagonia' markalarını inceleyebilirsiniz.");
        setIsAssistantLoading(false);
        setAssistantQuestion('');
    }, 1000);
  }, [assistantQuestion]);

  return (
    <div className="flex flex-col h-full bg-secondary/30">
        <div className="p-4 space-y-4 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Platformda Ara..."
                        className="pl-10 pr-12 h-12 rounded-2xl border-none bg-muted/50 focus-visible:ring-1 text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg border-none">
                            <Bot className="h-6 w-6" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-3xl">
                        <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Bot className="text-primary"/> Alışveriş Asistanı</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {assistantResponse && !isAssistantLoading && (
                                <div className="flex items-start gap-3">
                                    <div className="p-4 bg-muted rounded-2xl rounded-tl-none text-sm leading-relaxed">{assistantResponse}</div>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input
                                    placeholder="Örn: Sürdürülebilir spor ayakkabı..."
                                    value={assistantQuestion}
                                    onChange={(e) => setAssistantQuestion(e.target.value)}
                                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-inner"
                                />
                                <Button onClick={handleAskAssistant} disabled={isAssistantLoading} className="rounded-xl h-11 px-6">Sor</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-background border-none shadow-sm"><Filter className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuLabel>Filtrele</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={onlyDonating} onCheckedChange={setOnlyDonating}>Sadece Bağış Yapanlar</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveEntityType}>
                <TabsList className="grid w-full grid-cols-5 h-10 p-1 bg-muted/50 rounded-xl">
                    <TabsTrigger value="all" className="rounded-lg text-xs">Tümü</TabsTrigger>
                    <TabsTrigger value="brand" className="rounded-lg text-xs">Marka</TabsTrigger>
                    <TabsTrigger value="cooperative" className="rounded-lg text-xs">Koop.</TabsTrigger>
                    <TabsTrigger value="social" className="rounded-lg text-xs">Sosyal</TabsTrigger>
                    <TabsTrigger value="economic" className="rounded-lg text-xs">İktisadi</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-[100px] sm:w-1/4 border-r overflow-y-auto bg-background/50 backdrop-blur-sm">
            <nav className="flex flex-col py-2">
                {marketCategories.map((cat) => (
                <button
                    key={cat.mainCategory}
                    onClick={() => setActiveCategory(cat.mainCategory)}
                    className={cn(
                    "text-left text-[11px] sm:text-sm p-4 whitespace-nowrap truncate transition-all",
                    activeCategory === cat.mainCategory
                        ? "bg-primary/10 text-primary border-l-4 border-primary font-black shadow-sm"
                        : "text-muted-foreground hover:bg-accent/50",
                    (cat.mainCategory === 'Öne çıkanlar') && "text-primary font-black"
                    )}
                >
                    {cat.mainCategory}
                </button>
                ))}
            </nav>
            </aside>

            <main className="flex-1 overflow-y-auto p-4">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h2 className="font-black text-xs sm:text-lg uppercase tracking-tight text-foreground/80">{activeCategory}</h2>
                    </div>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {brandsToShow.length > 0 ? (
                    brandsToShow.map((brand, index) => (
                        <Fragment key={brand.id}>
                            <Link href={`/market/${brand.id}`} className="group">
                                <div className="flex flex-col items-center text-center space-y-2 p-1 transition-all duration-300">
                                    <div className="relative w-full aspect-square">
                                        <div className="w-full h-full rounded-[1.5rem] bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-primary/20 group-hover:shadow-xl transition-all">
                                            <BrandLogo brand={brand} />
                                        </div>
                                        <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white shadow-lg border-2 border-white transform transition-transform group-hover:scale-110">
                                            %{brand.donationRate}
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] sm:text-xs font-bold leading-tight text-foreground group-hover:text-primary line-clamp-2 mt-1">{brand.name}</p>
                                        <p className="text-[8px] font-black uppercase text-primary/60 tracking-tighter">
                                            {brand.agency || 'Aktif Kampanya'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                            {index === 11 && <div className="col-span-full my-4"><AdCarousel /></div>}
                        </Fragment>
                    ))
                ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-[2.5rem] bg-muted/10">
                        <p className="text-foreground font-bold text-sm">Şu an marka bulunamadı.</p>
                    </div>
                )}
                </div>
            </div>
            </main>
        </div>
    </div>
  );
}
