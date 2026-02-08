
'use client';

import { useState, useMemo, useRef, Fragment, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Camera, Filter, ArrowDownUp, Bot, Loader2, ShoppingBag } from 'lucide-react';
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
import { getApiOffers } from '@/app/actions/market';

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

/**
 * Güvenli Logo Bileşeni (Next.js Image Proxy ve DNS Hatalarını Aşar)
 */
const BrandLogo = ({ brand }: { brand: Brand }) => {
    const [hasError, setHasError] = useState(false);

    // Görsel yüklenemezse veya URL yoksa markanın baş harfini içeren şık bir Avatar göster
    if (hasError || !brand.logoUrl) {
        return (
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col items-center justify-center border shadow-inner p-2">
                <span className="text-primary font-black text-3xl uppercase">{brand.name.charAt(0)}</span>
                <span className="text-[8px] font-bold text-primary/40 uppercase tracking-tighter truncate w-full text-center">{brand.name}</span>
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

  // API Verilerini Çekme
  useEffect(() => {
    const fetchOffers = async () => {
        setIsApiLoading(true);
        try {
            const data = await getApiOffers();
            if (data && Array.isArray(data)) {
                setApiBrands(data);
            }
        } catch (e) {
            console.error("Market API load error:", e);
        } finally {
            setIsApiLoading(false);
        }
    };
    fetchOffers();
  }, []);

  const brandsToShow = useMemo(() => {
    let filteredList: Brand[] = [...allEntityLists, ...apiBrands];

    // Tekilleştirme (İsim bazlı)
    const uniqueBrandsMap = new Map();
    filteredList.forEach(item => {
        const key = item.name.toLowerCase().trim();
        if (!uniqueBrandsMap.has(key)) {
            uniqueBrandsMap.set(key, item);
        } else {
            // Eğer aynı isimde marka varsa, API'den geleni veya daha yüksek oranlıyı tercih et
            const existing = uniqueBrandsMap.get(key);
            if (item.donationRate > existing.donationRate) {
                uniqueBrandsMap.set(key, item);
            }
        }
    });
    filteredList = Array.from(uniqueBrandsMap.values());

    if (searchTerm.trim()) {
        const lowercased = searchTerm.toLowerCase();
        filteredList = filteredList.filter(brand => brand.name.toLowerCase().includes(lowercased));
    }

    if (activeCategory !== 'Tümü' && activeCategory !== 'Öne çıkanlar') {
      const brandCategories = categoryMapping[activeCategory as keyof typeof categoryMapping];
      if (brandCategories && brandCategories.length > 0) {
        filteredList = filteredList.filter(brand => 
            brandCategories.some(cat => brand.category.toLowerCase().includes(cat.toLowerCase()))
        );
      } else {
        filteredList = filteredList.filter(brand => brand.category.toLowerCase().includes(activeCategory.toLowerCase()));
      }
    }

    if (activeEntityType !== 'all') {
      filteredList = filteredList.filter(item => item.type === activeEntityType);
    }

    if (onlyDonating) {
        filteredList = filteredList.filter(item => (item.donationRate || 0) > 0);
    }
    
    filteredList.sort((a, b) => {
        switch(sortKey) {
            case 'donationRate':
                return (b.donationRate || 0) - (a.donationRate || 0);
            case 'name':
                return a.name.localeCompare(b.name, 'tr');
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
            `Marka: ${b.name}, Kategori: ${b.category}, Bağış: ${b.donationRateDisplay || '%' + b.donationRate}`
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
        description: "Yapay zeka asistanı şu an yanıt veremiyor.",
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
            title: "Görsel Analiz Tamamlandı",
            description: "Görseldeki ürüne en yakın bağışçı markalar listeleniyor.",
          });
        }, 2000); 
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="flex flex-col h-full bg-secondary/30">
        <div className="p-2 space-y-2 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-2">
                <HangelLogo className="text-2xl" />
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="hangel'da Ara"
                        className="pl-10 pr-12 h-10 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                       <Dialog open={isVisualSearchOpen} onOpenChange={(open) => {
                            setIsVisualSearchOpen(open);
                            if (!open) {
                                setVisualSearchImage(null);
                                setIsVisualSearching(false);
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <Camera className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-3xl">
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
                                            className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2rem] cursor-pointer hover:bg-accent transition-colors bg-muted/20"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Camera className="h-12 w-12 text-primary/40 mb-2" />
                                            <p className="text-sm font-medium text-muted-foreground">Fotoğraf yüklemek için tıklayın</p>
                                        </div>
                                    )}
                                    {visualSearchImage && (
                                        <div className="relative w-full aspect-square max-w-sm mx-auto flex items-center justify-center">
                                            <img src={visualSearchImage} alt="Yüklenen görsel" className="w-full h-full object-contain rounded-2xl shadow-xl" />
                                            {isVisualSearching && (
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-2xl backdrop-blur-sm">
                                                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                                                    <p className="text-white mt-4 font-bold">Analiz ediliyor...</p>
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
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-primary text-white hover:bg-primary/90 hover:text-white">
                            <Bot className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-3xl">
                        <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Bot className="text-primary"/> Alışveriş Asistanı</DialogTitle>
                        <DialogDescription>
                            Ne aradığınızı yazın, size en uygun sosyal etki odaklı markaları bulalım.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {assistantResponse && !isAssistantLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 border">
                                       <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4"/></AvatarFallback>
                                    </Avatar>
                                    <div className="p-4 bg-muted rounded-2xl rounded-tl-none text-sm leading-relaxed">{assistantResponse}</div>
                                </div>
                            )}
                             {isAssistantLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 animate-pulse">
                                       <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4"/></AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2 p-2 w-full">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input
                                    placeholder="Örn: Sürdürülebilir spor ayakkabı..."
                                    value={assistantQuestion}
                                    onChange={(e) => setAssistantQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAskAssistant()}
                                    disabled={isAssistantLoading}
                                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <Button onClick={handleAskAssistant} disabled={isAssistantLoading || !assistantQuestion.trim()} className="rounded-xl h-11 px-6">Sor</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl">
                            <Filter className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuLabel>Filtrele</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={onlyDonating} onCheckedChange={setOnlyDonating}>
                            Sadece Bağış Yapanlar
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl">
                            <ArrowDownUp className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => setSortKey('followers')}>Popülerlik</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('donationRate')}>Bağış Oranı</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortKey('name')}>İsme Göre (A-Z)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveEntityType(value)}>
                <TabsList className="grid w-full grid-cols-5 h-9 p-1 bg-muted/50 rounded-xl">
                    <TabsTrigger value="all" className="rounded-lg text-[10px] sm:text-xs">Tümü</TabsTrigger>
                    <TabsTrigger value="cooperative" className="rounded-lg text-[10px] sm:text-xs">Kooperatif</TabsTrigger>
                    <TabsTrigger value="economic" className="rounded-lg text-[10px] sm:text-xs">İktisadi</TabsTrigger>
                    <TabsTrigger value="brand" className="rounded-lg text-[10px] sm:text-xs">Marka</TabsTrigger>
                    <TabsTrigger value="social" className="rounded-lg text-[10px] sm:text-xs">Sosyal</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
        <div className="flex flex-1 overflow-hidden min-h-0">
            <aside className="w-[85px] sm:w-1/4 border-r overflow-y-auto bg-background/50 backdrop-blur-sm">
            <nav className="flex flex-col py-2">
                {marketCategories.map((cat) => (
                <button
                    key={cat.mainCategory}
                    onClick={() => setActiveCategory(cat.mainCategory)}
                    className={cn(
                    "text-left text-[10px] sm:text-sm p-3 sm:p-4 whitespace-nowrap truncate transition-all",
                    activeCategory === cat.mainCategory
                        ? "bg-primary/10 text-primary border-l-4 border-primary font-bold shadow-sm"
                        : "text-muted-foreground hover:bg-accent/50",
                    (cat.mainCategory === 'Öne çıkanlar') && "font-black uppercase tracking-tighter"
                    )}
                >
                    {cat.mainCategory}
                </button>
                ))}
            </nav>
            </aside>

            <main className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="font-black text-xs sm:text-lg uppercase tracking-tight text-foreground/80">
                        {activeCategory}
                    </h2>
                    {isApiLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {brandsToShow.length > 0 ? brandsToShow.map((brand, index) => {
                    const isApiBrand = brand.id.startsWith('agency-');
                    return (
                    <Fragment key={brand.id}>
                        <Link 
                            href={isApiBrand ? (brand.link || '#') : `/market/${brand.id}`} 
                            target={isApiBrand ? "_blank" : "_self"} 
                            rel={isApiBrand ? "noopener noreferrer" : undefined} 
                            className="group"
                        >
                            <div className="flex flex-col items-center text-center space-y-2 p-1 transition-all duration-300">
                                <div className="relative w-full aspect-square">
                                    <div className="w-full h-full rounded-[1.5rem] bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-primary/20 group-hover:shadow-xl transition-all p-0">
                                        <BrandLogo brand={brand} />
                                    </div>
                                    {(brand.donationRate > 0 || brand.donationRateDisplay) && (
                                        <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white shadow-lg border-2 border-white transform transition-transform group-hover:scale-110">
                                            {brand.donationRateDisplay || `%${brand.donationRate}`}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] sm:text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors px-1 line-clamp-2 mt-1">
                                    {brand.name}
                                </p>
                            </div>
                        </Link>
                        {index === 5 && (
                           <div className="col-span-full my-4">
                               <AdCarousel />
                           </div>
                        )}
                        {index >= 14 && (index - 14) % 24 === 0 && (
                           <div className="col-span-full my-4">
                               <VisualAdCarousel />
                           </div>
                        )}
                    </Fragment>
                )}) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-[2.5rem] bg-muted/10">
                        <div className="text-center space-y-2">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                            <p className="text-muted-foreground text-sm font-medium">Bu kategoride marka bulunamadı.</p>
                        </div>
                    </div>
                )}
                </div>
            </div>
            </main>
        </div>
    </div>
  );
}
