'use client';

import { useState, useMemo, useRef, Fragment, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Camera, Filter, ArrowDownUp, Bot } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Brand } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { askMarketAssistant } from '@/ai/flows/marketplace-ai-assistant';
import { Skeleton } from '@/components/ui/skeleton';
import { HangelLogo } from '@/components/icons';


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

const VisualAdCarousel = () => {
    const plugin = useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
    )

    return (
         <Carousel
            plugins={[plugin.current]}
            opts={{
            align: 'start',
            loop: true,
            }}
            className="w-full rounded-lg overflow-hidden"
        >
            <CarouselContent>
            {adBanners.map((ad) => (
                <CarouselItem key={ad.id}>
                    <Link href={ad.link} passHref>
                        <div className="relative h-32">
                            <Image
                            src={ad.imageUrl}
                            alt={ad.title}
                            fill
                            className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                                <h3 className="font-bold text-lg">{ad.title}</h3>
                                <p className="text-sm">{ad.description}</p>
                            </div>
                        </div>
                    </Link>
                </CarouselItem>
            ))}
            </CarouselContent>
        </Carousel>
    )
}

const fallbackColors = [
    { bg: 'bg-red-500', text: 'text-white' },
    { bg: 'bg-blue-500', text: 'text-white' },
    { bg: 'bg-green-500', text: 'text-white' },
    { bg: 'bg-amber-500', text: 'text-white' },
    { bg: 'bg-purple-500', text: 'text-white' },
    { bg: 'bg-pink-500', text: 'text-white' },
    { bg: 'bg-indigo-500', text: 'text-white' },
    { bg: 'bg-teal-500', text: 'text-white' },
];

export default function MarketPage() {
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [activeEntityType, setActiveEntityType] = useState('all');
  const { toast } = useToast();
  const [sortKey, setSortKey] = useState('followers');
  const [onlyDonating, setOnlyDonating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // AI Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const brandsToShow = useMemo(() => {
    let filteredList: Brand[] = allEntityLists;

    if (searchTerm.trim()) {
        const lowercased = searchTerm.toLowerCase();
        filteredList = filteredList.filter(brand => brand.name.toLowerCase().includes(lowercased));
    }

    if (activeEntityType !== 'all') {
      filteredList = filteredList.filter(item => item.type === activeEntityType);
    }

    if (onlyDonating) {
        filteredList = filteredList.filter(item => item.donationRate > 0);
    }

    if (activeCategory !== 'Tümü' && activeCategory !== 'Öne çıkanlar') {
      const brandCategories = categoryMapping[activeCategory as keyof typeof categoryMapping];
      if (brandCategories && brandCategories.length > 0) {
        filteredList = filteredList.filter(brand => brandCategories.includes(brand.category));
      } else {
        filteredList = [];
      }
    }
    
    // Sorting logic
    filteredList.sort((a, b) => {
        switch(sortKey) {
            case 'donationRate':
                return (b.donationRate || 0) - (a.donationRate || 0);
            case 'name':
                return a.name.localeCompare(b.name);
            case 'followers':
            default:
                return (b.followers || 0) - (a.followers || 0);
        }
    });

    if (activeCategory === 'Öne çıkanlar') {
        return filteredList.slice(0, 18);
    }
    
    return filteredList;

  }, [activeCategory, activeEntityType, sortKey, onlyDonating, searchTerm]);
  
  const handleAskAssistant = useCallback(async () => {
    if (!assistantQuestion.trim()) return;

    setIsAssistantLoading(true);
    setAssistantResponse('');

    try {
        const brandsContext = allEntityLists.map(b => 
            `Marka: ${b.name}, Kategori: ${b.category}, Bağış Oranı: %${b.donationRate}, Tür: ${b.type}, Hakkında: ${b.about || 'Bilgi yok.'}`
        ).join('\n---\n');

      const result = await askMarketAssistant({
        userQuestion: assistantQuestion,
        brandsContext: brandsContext,
      });

      if (result.answer) {
        setAssistantResponse(result.answer);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Bir hata oluştu",
        description: "Yapay zeka asistanı yanıt verirken bir sorun oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsAssistantLoading(false);
      setAssistantQuestion('');
    }
  }, [assistantQuestion, toast]);

  return (
    <div className="flex flex-col h-full">
        <div className="p-2 space-y-2 border-b shrink-0">
            <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="hangel'da Ara"
                        className="pl-10 pr-12 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: 'Görselle arama özelliği yakında gelecek!'})}>
                        <Camera className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                            <Bot className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                        <DialogTitle>Yapay Zeka Alışveriş Asistanı</DialogTitle>
                        <DialogDescription>
                            Ne aradığınızı yazın, asistanımız size en uygun sosyal etki odaklı markaları önersin.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {assistantResponse && !isAssistantLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 bg-primary/10">
                                       <HangelLogo className="h-5 w-5 text-primary m-auto"/>
                                    </Avatar>
                                    <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">{assistantResponse}</div>
                                </div>
                            )}
                             {isAssistantLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 bg-primary/10">
                                       <HangelLogo className="h-5 w-5 text-primary m-auto"/>
                                    </Avatar>
                                    <div className="space-y-2 p-2">
                                        <Skeleton className="h-4 w-[250px]" />
                                        <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Sürdürülebilir bir koşu ayakkabısı arıyorum..."
                                    value={assistantQuestion}
                                    onChange={(e) => setAssistantQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAskAssistant()}
                                    disabled={isAssistantLoading}
                                />
                                <Button onClick={handleAskAssistant} disabled={isAssistantLoading}>Öneri Al</Button>
                            </div>
                            <Button variant="link" asChild className="text-xs text-muted-foreground p-0 h-auto">
                                <Link href="/support/ai-assistants">Nasıl çalışır?</Link>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                            <Filter className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtrele</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={onlyDonating} onCheckedChange={setOnlyDonating}>
                            Sadece Bağış Yapanlar
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                            <ArrowDownUp className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Sırala</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSortKey('followers')}>Takipçi Sayısı</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('donationRate')}>Bağış Oranı</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('name')}>İsme Göre (A-Z)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <Tabs defaultValue="all" className="w-full flex justify-center" onValueChange={(value) => setActiveEntityType(value as any)}>
                <TabsList className="grid-cols-none">
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="cooperative">Kooperatif</TabsTrigger>
                    <TabsTrigger value="economic">İktisadi İşl.</TabsTrigger>
                    <TabsTrigger value="brand">Marka</TabsTrigger>
                    <TabsTrigger value="social">Sosyal İşl.</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
        <div className="flex flex-1 overflow-hidden min-h-0">
            <aside className="w-1/4 border-r overflow-y-auto bg-background">
            <nav className="flex flex-col">
                {marketCategories.map((cat) => (
                <button
                    key={cat.mainCategory}
                    onClick={() => setActiveCategory(cat.mainCategory)}
                    className={cn(
                    "text-left text-xs sm:text-sm p-1 sm:p-1.5 whitespace-nowrap truncate",
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {brandsToShow.length > 0 ? brandsToShow.map((brand, index) => {
                    const color = fallbackColors[index % fallbackColors.length];
                    return (
                    <Fragment key={brand.id}>
                        <Link href={`/market/${brand.id}`}>
                            <div className="flex flex-col items-center text-center space-y-1 p-1">
                                <div className="relative w-full aspect-square">
                                <Avatar className="w-full h-full bg-white">
                                    <AvatarImage src={brand.logoUrl} alt={brand.name} className="object-contain p-2" />
                                    <AvatarFallback className={cn("text-xl font-bold", color.bg, color.text)}>
                                        {brand.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {brand.donationRate > 0 && (
                                    <div className="absolute top-0 right-0 flex h-12 w-12 transform translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-destructive text-base font-bold text-destructive-foreground ring-4 ring-background">
                                    %{brand.donationRate}
                                    </div>
                                )}
                                </div>
                                <p className="mt-1 text-xs font-medium text-center leading-tight">{brand.name}</p>
                            </div>
                        </Link>
                        {index === 5 && (
                           <div className="col-span-3 sm:col-span-4 md:col-span-5 lg:grid-cols-6 xl:col-span-8 my-2">
                               <AdCarousel />
                           </div>
                        )}
                        {index >= 14 && (index - 14) % 30 === 0 && (
                           <div className="col-span-3 sm:col-span-4 md:col-span-5 lg:grid-cols-6 xl:col-span-8 my-2">
                               <VisualAdCarousel />
                           </div>
                        )}
                    </Fragment>
                )}) : (
                    <p className="col-span-full text-center text-muted-foreground mt-8 text-sm">Bu kriterlere uygun sonuç bulunmuyor.</p>
                )}
                </div>
            </div>
            </main>
        </div>
    </div>
  );
}
