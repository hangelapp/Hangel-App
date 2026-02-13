
'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { 
    TrendingUp, User, Users, Rocket, Award, Heart, ShieldCheck, Store, Globe, MapPin, School, HeartHandshake,
    ShoppingBag, Leaf, Megaphone
} from 'lucide-react';
import { user } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// --- Story Data ---
export type ImpactSlide = {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  icon: any; // Using any to avoid LucideIcon type issues in this context
  image: string;
  imageHint: string;
  stat?: string;
};

export const hangelImpactStories: ImpactSlide[] = [
    {
        id: 1,
        title: "2024 Sosyal Etki Raporu",
        subtitle: "hangel A.Ş.",
        content: "Birlikte büyüttüğümüz iyilik hareketinin somut sonuçlarını keşfedin. Her adımda daha güçlüyüz.",
        icon: TrendingUp,
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
        imageHint: "data charts analysis"
    },
    {
        id: 2,
        title: "1 Milyon+ Hayata Dokunduk",
        subtitle: "Toplumsal Erişim",
        content: "Türkiye'nin dört bir yanında projelerimizle umudu yeşerttik. Bu başarı hepimizin.",
        stat: "1.240.000",
        icon: Users,
        image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop",
        imageHint: "happy group people"
    },
    {
        id: 3,
        title: "500.000 ₺+ Aktarılan Bağış",
        subtitle: "Finansal Katkı",
        content: "Alışverişlerinizden doğan ek ödemesiz bağışlar, STK'larımız için can suyu oldu.",
        stat: "₺524.850",
        icon: Award,
        image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop",
        imageHint: "coins money donation"
    },
    {
        id: 4,
        title: "12.000+ Saat Gönüllülük",
        subtitle: "İmece Gücü",
        content: "Zamanını ve yeteneklerini toplumsal fayda için seferber eden binlerce gönüllümüzle sahadayız.",
        stat: "12.450 Saat",
        icon: Heart,
        image: "https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop",
        imageHint: "volunteers working together"
    },
    {
        id: 5,
        title: "128 Şeffaf STK Ortağı",
        subtitle: "Kurumsal Güven",
        content: "Şeffaflık endeksimize katılan ve hesap verebilirliği önceliğine alan dev ağımız.",
        icon: ShieldCheck,
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop",
        imageHint: "modern building glass"
    },
    {
        id: 6,
        title: "542 Bilinçli Marka",
        subtitle: "İş Birliği",
        content: "Satışlarını sosyal faydaya dönüştüren vizyoner markalarla alışverişi iyiliğe dönüştürüyoruz.",
        icon: Store,
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
        imageHint: "clothing store interior"
    },
    {
        id: 7,
        title: "Gelirlerin %85'i Faydaya",
        subtitle: "Sosyal Girişim",
        content: "Operasyonel gelirlerimizin büyük kısmını platformu geliştirmek ve sosyal etkiyi büyütmek için kullanıyoruz.",
        stat: "%85",
        icon: Globe,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
        imageHint: "network connections digital"
    },
    {
        id: 8,
        title: "21 Şehirde Aktif Etki",
        subtitle: "Yerel Yayılım",
        content: "Sadece merkezde değil, Anadolu'nun her köşesinde yerel sorunlara dijital çözümler üretiyoruz.",
        icon: MapPin,
        image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=2071&auto=format&fit=crop",
        imageHint: "city view turkey"
    },
    {
        id: 9,
        title: "21 Üniversite Temsilciliği",
        subtitle: "Gençlik Hareketi",
        content: "Geleceğin liderleri kampüslerinde sosyal etkiyi örgütlüyor, kulüplerini iyiliğe dahil ediyor.",
        icon: School,
        image: "https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop",
        imageHint: "university campus students"
    },
    {
        id: 10,
        title: "Seninle Daha Güçlüyüz",
        subtitle: "Birlikte Başaralım",
        content: "Bu başarı hikayesinin en önemli parçası sensin. İyiliği paylaşmaya ve büyütmeye devam edelim.",
        icon: Rocket,
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop",
        imageHint: "team high five"
    }
];

export const userImpactStories: ImpactSlide[] = [
    {
        id: 1,
        title: "Senin Etki Raporun",
        subtitle: user.name,
        content: "Bu yılki yolculuğunda yarattığın pozitif değişime yakından bakalım.",
        icon: User,
        image: user.avatarUrl,
        imageHint: "person portrait"
    },
    {
        id: 2,
        title: user.stats.totalDonation.toLocaleString('tr-TR') + ' ₺ Bağış Yaptın',
        subtitle: "Finansal Destek",
        content: 'Yaptığın alışverişlerle ' + user.stats.mostSupportedNgo + ' gibi kurumlara destek oldun.',
        stat: '₺' + user.stats.totalDonation.toLocaleString('tr-TR'),
        icon: Heart,
        image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop",
        imageHint: "donation concept"
    },
    {
        id: 3,
        title: user.stats.volunteerHours + ' Saat Gönüllülük Yaptın',
        subtitle: "Zamanın Değeri",
        content: 'En çok ' + user.stats.mostActiveVolunteerArea + ' alanında aktif olarak topluma zamanını ve yeteneğini ayırdın.',
        stat: user.stats.volunteerHours + ' Saat',
        icon: HeartHandshake,
        image: "https://images.unsplash.com/photo-1618423417959-c8c7f9c73331?q=80&w=1974&auto=format&fit=crop",
        imageHint: "volunteers hands"
    },
];

export const communityImpactStories: ImpactSlide[] = [
    {
        id: 1,
        title: "Gönüllüler Sahada",
        subtitle: "Ahbap Derneği",
        content: "Hatay'daki gıda dağıtımında gönüllülerimiz harikalar yarattı. Her birine minnettarız!",
        icon: Users,
        image: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop",
        imageHint: "food donation"
    },
    {
        id: 2,
        title: "Geleceğe Nefes",
        subtitle: "TEMA Vakfı",
        content: "Balıkesir'de gerçekleştirdiğimiz fidan dikme etkinliği ile 200 yeni ağacı toprakla buluşturduk.",
        icon: Heart,
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop",
        imageHint: "planting trees"
    },
];

export const adStories: ImpactSlide[] = [
    {
        id: 1,
        title: "Okul Alışverişiyle Destek Ol!",
        subtitle: "TEGV & Hepsiburada",
        content: "Kırtasiye ihtiyaçlarınızı Hepsiburada'dan alın, her alışverişinizle Türkiye Eğitim Gönüllüleri Vakfı'na bağış yapın. Eğitime bir ışık da siz yakın!",
        icon: ShoppingBag,
        image: "https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=2022&auto=format&fit=crop",
        imageHint: "school supplies student"
    },
    {
        id: 2,
        title: "Patili Dostlarımıza Umut Ol",
        subtitle: "HAYTAP & Petzzshop",
        content: "Petzzshop'tan yapacağınız mama ve bakım ürünü alışverişlerinizle, HAYTAP aracılığıyla barınaklardaki dostlarımıza destek olun.",
        icon: Heart,
        image: "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?q=80&w=1974&auto=format&fit=crop",
        imageHint: "cat looking at camera"
    },
    {
        id: 3,
        title: "Yeni Sezon, Yeni Bir Başlangıç",
        subtitle: "Doğa Dostu Giyim & TEMA Vakfı",
        content: "Sürdürülebilir yeni sezon koleksiyonumuzu keşfedin. Her parçayla hem stilinizi yenileyin hem de TEMA Vakfı'nın ağaçlandırma çalışmalarına katkıda bulunun.",
        icon: Leaf,
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
        imageHint: "clothing store interior"
    },
];

const STORY_DURATION = 5000;

function StoryViewer() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)

    const stories: ImpactSlide[] = React.useMemo(() => {
        switch (category) {
            case 'user':
                return userImpactStories;
            case 'community':
                return communityImpactStories;
            case 'ads':
                return adStories;
            case 'hangel':
            default:
                return hangelImpactStories;
        }
    }, [category]);
    
    const handleClose = useCallback(() => router.back(), [router]);

    const handleAnimationEnd = () => {
        if (current === count) {
            handleClose();
        } else {
            api?.scrollNext();
        }
    };

    const prevSlide = useCallback(() => {
        api?.scrollPrev()
    }, [api]);

    const nextSlide = useCallback(() => {
        api?.scrollNext()
    }, [api]);

    useEffect(() => {
        if (!api) {
          return;
        }
    
        const onSelect = (api: CarouselApi) => {
          setCurrent(api.selectedScrollSnap() + 1);
        };
    
        api.on("select", onSelect);
        api.on("reInit", onSelect);
        
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);
    
        return () => {
          api.off("select", onSelect);
          api.off("reInit", onSelect);
        };
    }, [api]);

    const currentSlide = stories[current - 1];
    if (!currentSlide) return <div className="h-full w-full bg-background" />;

    return (
        <div className="relative w-full h-full bg-white md:rounded-[2.5rem] overflow-hidden flex flex-col">
            {/* Progress Bars */}
            <div className="absolute top-4 inset-x-4 flex gap-1 z-50">
                {Array.from({ length: count }).map((_, idx) => (
                    <div key={idx} className="h-0.5 flex-1 bg-black/10 rounded-full overflow-hidden">
                        <div
                            key={current} // Using key to re-mount and restart animation
                            className={cn(
                                "h-full bg-white",
                                idx < current - 1 && "w-full",
                                idx === current - 1 && "animate-story-progress"
                            )}
                            style={{ animationDuration: `${STORY_DURATION}ms` }}
                            onAnimationEnd={handleAnimationEnd}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 inset-x-4 px-2 flex justify-between items-center z-50 text-foreground">
                <div className="flex items-center gap-3">
                     <Link href={category === 'user' ? '/profile' : '/about'}>
                        <div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center border shadow-sm">
                           {category === 'user' ? (
                                <Image src={user.avatarUrl} alt={user.name} width={40} height={40} className="rounded-full object-cover" />
                           ) : (
                                <HangelLogo className="text-lg text-primary" />
                           )}
                        </div>
                    </Link>
                    <div className="text-left">
                        <p className="font-bold text-xs">{currentSlide.subtitle}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-black/10 rounded-full h-10 w-10 backdrop-blur-md bg-white/20" onClick={handleClose}>
                    <X className="h-6 w-6" />
                </Button>
            </div>
            
            <Carousel setApi={setApi} className="w-full h-full">
                <CarouselContent>
                    {stories.map((slide) => {
                        const CurrentIcon = slide.icon;
                        return (
                            <CarouselItem key={slide.id}>
                                <div className="w-full h-full flex flex-col bg-white">
                                    <div className="relative flex-1 w-full min-h-0">
                                        <Image
                                            src={slide.image}
                                            alt={slide.title}
                                            fill
                                            className="object-cover"
                                            priority={slide.id === stories[0].id}
                                            data-ai-hint={slide.imageHint}
                                        />
                                        {/* Invisible click areas for navigation */}
                                        <div className="absolute left-0 top-0 h-full w-1/2 z-20" onClick={prevSlide}></div>
                                        <div className="absolute right-0 top-0 h-full w-1/2 z-20" onClick={nextSlide}></div>
                                    </div>
                                    <div className="p-8 md:p-10 text-foreground bg-white">
                                        <div className="animate-in fade-in-0 slide-in-from-bottom-5 duration-700">
                                            <div className="w-14 h-14 rounded-2xl bg-muted border flex items-center justify-center text-primary mb-5">
                                                <CurrentIcon className="h-7 w-7" />
                                            </div>
                                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                                                {slide.title}
                                            </h2>
                                            <p className="mt-3 text-base md:text-lg text-muted-foreground leading-relaxed max-w-sm">
                                                {slide.content}
                                            </p>
                                            {slide.stat && (
                                                <p className="text-6xl font-bold tracking-tighter mt-6 text-primary">{slide.stat}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
            </Carousel>
        </div>
    );
}

export default function ImpactStoryPage() {
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-0 md:p-8">
            <div className="relative w-full max-w-[450px] h-full max-h-full md:max-h-[800px] aspect-[9/16] bg-card rounded-none md:rounded-[2.5rem] overflow-hidden">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Yükleniyor...</div>}>
                    <StoryViewer />
                </Suspense>
            </div>
        </div>
    );
}
