
'use client';

import { useState, useMemo, useRef, Fragment, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Camera, Filter, ArrowDownUp, Bot, Loader2 } from 'lucide-react';
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
import { HangelLogo } from '@/components/icons';
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

// Server Action equivalent for fetching API data
async function getApiOffers() {
    const API_KEY = "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54";
    const url = "https://api.reklamaction.com/v1/offer?network=reklamaction";

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`
            }
        });
        if (!response.ok) return null;
        const result = await response.json();
        return result.data || [];
    } catch (e) {
        console.error("API Error:", e);
        return null;
    }
}

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
                            priority
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

export default function MarketPage() {
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [activeEntityType, setActiveEntityType] = useState('all');
  const { toast } = useToast();
  const [sortKey, setSortKey] = useState('followers');
  const [onlyDonating, setOnlyDonating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiBrands, setApiBrands] = useState<Brand[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // AI Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  // Visual Search State
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [visualSearchImage, setVisualSearchImage] = useState<string | null>(null);
  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch API Data on Mount
  useEffect(() => {
    const fetchOffers = async () => {
        setIsApiLoading(true);
        const data = await getApiOffers();
        if (data && Array.isArray(data)) {
            const mappedBrands: Brand[] = data.map((offer: any) => ({
                id: `ra-${offer.id}`,
                name: offer.name,
                category: (offer.categories && offer.categories[0]?.name) || 'Diğer',
                type: 'brand',
                logoUrl: offer.logo_url || offer.thumbnail_url || 'https://placehold.co/400x400?text=' + encodeURIComponent(offer.name),
                donationRate: parseFloat(offer.payout?.replace('%', '')) || 5,
                followers: Math.floor(Math.random() * 100000) + 1000,
                about: offer.description || offer.name + " markası hangel ekosisteminde sosyal fayda sağlamaktadır.",
                link: offer.preview_url
            }));
            setApiBrands(mappedBrands);
        }
        setIsApiLoading(false);
    };
    fetchOffers();
  }, []);

  const brandsToShow = useMemo(() => {
    // Combine static and API brands
    let filteredList: Brand[] = [...allEntityLists, ...apiBrands];

    // Remove duplicates by name if any (API might return brands already in static list)
    const uniqueBrands = Array.from(new Map(filteredList.map(item => [item.name.toLowerCase(), item])).values());
    filteredList = uniqueBrands;

    if (searchTerm.trim()) {
        const lowercased = searchTerm.toLowerCase();
        filteredList = filteredList.filter(brand => brand.name.toLowerCase().includes(lowercased));
    }

    if (activeCategory !== 'Tümü' && activeCategory !== 'Öne çıkanlar') {
      const brandCategories = categoryMapping[activeCategory as keyof typeof categoryMapping];
      if (brandCategories && brandCategories.length > 0) {
        filteredList = filteredList.filter(brand => brandCategories.includes(brand.category));
      } else {
        // Simple fallback check for categories not explicitly in mapping but present in API
        filteredList = filteredList.filter(brand => brand.category.toLowerCase().includes(activeCategory.toLowerCase()));
      }
    }

    if (activeEntityType !== 'all') {
      filteredList = filteredList.filter(item => item.type === activeEntityType);
    }

    if (onlyDonating) {
        filteredList = filteredList.filter(item => item.donationRate > 0);
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

  }, [activeCategory, activeEntityType, sortKey, onlyDonating, searchTerm, apiBrands]);
  
  const handleAskAssistant = useCallback(async () => {
    if (!assistantQuestion.trim()) return;

    setIsAssistantLoading(true);
    setAssistantResponse('');

    try {
        const brandsContext = brandsToShow.slice(0, 50).map(b => 
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
  }, [assistantQuestion, brandsToShow, toast]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVisualSearchImage(reader.result as string);
        setIsVisualSearching(true);
        setTimeout(() => {
          setIsVisualSearching(false);
          toast({
            title: "Özellik Yakında",
            description: "Görsel arama sonuçları yakında bu ekranda görüntülenecektir.",
          });
        }, 3000); 
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="flex flex-col h-full">
        <div className="p-2 space-y-2 border-b shrink-0">
            <div className="flex items-center gap-2">
                <HangelLogo className="text-2xl" />
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="hangel'da Ara"
                        className="pl-10 pr-12 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                       <Dialog open={isVisualSearchOpen} onOpenChange={(open) => {
                            setIsVisualSearchOpen(open);
                            if (!open) {
                                setVisualSearchImage(null);
                                setIsVisualSearching(false);
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Camera className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Görselle Ara</DialogTitle>
                                    <DialogDescription>
                                        Bir ürünün fotoğrafını yükleyerek benzer ürünleri ve markaları bulun.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 text-center">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    {!visualSearchImage && (
                                        <div 
                                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground">Fotoğraf yüklemek için tıklayın</p>
                                        </div>
                                    )}
                                    {visualSearchImage && (
                                        <div className="relative w-full aspect-square max-w-sm mx-auto flex items-center justify-center">
                                            <Image src={visualSearchImage} alt="Yüklenen görsel" fill className="object-contain rounded-lg" />
                                            {isVisualSearching && (
                                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg">
                                                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                                                    <p className="text-white mt-2">Benzer ürünler aranıyor...</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
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
                                       <Bot className="h-5 w-5 text-primary m-auto"/>
                                    </Avatar>
                                    <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">{assistantResponse}</div>
                                </div>
                            )}
                             {isAssistantLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 bg-primary/10">
                                       <Bot className="h-5 w-5 text-primary m-auto"/>
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
                            Sadece Bağış Yapanlar {isApiLoading && <Loader2 className="ml-2 h-3 w-3 animate-spin inline" />}
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
            
            <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveEntityType(value)}>
                <TabsList className="grid w-full grid-cols-5">
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
                    (cat.mainCategory === 'Öne çıkanlar') && "font-bold"
                    )}
                >
                    {cat.mainCategory}
                </button>
                ))}
            </nav>
            </aside>

            <main className="w-3/4 flex-1 overflow-y-auto p-2">
            <div>
                <div className="flex items-center justify-between px-2 mb-2">
                    <h2 className="font-bold text-sm sm:text-base">
                        {activeCategory}
                    </h2>
                    {isApiLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {brandsToShow.length > 0 ? brandsToShow.map((brand, index) => {
                    return (
                    <Fragment key={brand.id}>
                        <Link href={brand.link || `/market/${brand.id}`} target={brand.id.startsWith('ra-') ? "_blank" : "_self"} className="group">
                            <div className="flex flex-col items-center text-center space-y-2 p-1 transition-all duration-300">
                                <div className="relative w-full aspect-square">
                                    <div className="w-full h-full rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-primary/30 group-hover:shadow-md transition-all p-2 sm:p-3">
                                        <div className="relative w-full h-full">
                                            <Image 
                                                src={brand.logoUrl} 
                                                alt={brand.name} 
                                                fill
                                                className="object-contain"
                                                sizes="(max-width: 768px) 33vw, 10vw"
                                            />
                                        </div>
                                    </div>
                                    {brand.donationRate > 0 && (
                                        <div className="absolute top-0 right-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#f34723] text-[9px] sm:text-[11px] font-bold text-white shadow-md border-2 border-white translate-x-1 translate-y-0">
                                        %{brand.donationRate}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] sm:text-[12px] font-bold text-[#042654] leading-tight group-hover:text-primary transition-colors px-1 line-clamp-2">{brand.name}</p>
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
