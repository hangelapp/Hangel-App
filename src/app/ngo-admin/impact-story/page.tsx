'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { 
    TrendingUp, User, Users, Rocket, Award, Heart, ShieldCheck, Store, Globe, MapPin, School, HeartHandshake,
    ShoppingBag, Leaf, Sparkles
} from 'lucide-react';
import { user } from '@/lib/data';
import { cn } from '@/lib/utils';

// --- Story Data ---
export type ImpactSlide = {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  icon: any;
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
        title: "1.250 ₺ Bağış Yaptın",
        subtitle: "Finansal Destek",
        content: "Yaptığın alışverişlerle TEMA Vakfı gibi kurumlara destek oldun.",
        stat: "₺1.250",
        icon: Heart,
        image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop",
        imageHint: "donation concept"
    },
    {
        id: 3,
        title: "48 Saat Gönüllülük Yaptın",
        subtitle: "Zamanın Değeri",
        content: "En çok Hayvan Hakları alanında aktif olarak topluma zamanını ve yeteneğini ayırdın.",
        stat: "48 Saat",
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

export const opportunityStories: ImpactSlide[] = [
    {
        id: 1,
        title: "Sosyal Etki Temsilcisi Ol",
        subtitle: "hangel Kampüs",
        content: "Kampüsünde sosyal etki rüzgarı estir. Üniversite temsilcimiz olarak liderlik yeteneklerini geliştir.",
        icon: School,
        image: "https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop",
        imageHint: "university students"
    },
    {
        id: 2,
        title: "Okul Alışverişiyle Destek Ol",
        subtitle: "TEGV & Hepsiburada",
        content: "Kırtasiye ihtiyaçlarınızı Hepsiburada'dan alın, TEGV'e bağış yapın. Eğitime bir ışık da siz yakın!",
        icon: ShoppingBag,
        image: "https://images.unsplash.com/photo-1503676260728-1c00da096a0b?q=80&w=2022&auto=format&fit=crop",
        imageHint: "student school supplies"
    },
    {
        id: 3,
        title: "Afet Bölgesi Lojistik Destek",
        subtitle: "Ahbap Derneği",
        content: "Hatay ve Adıyaman'da yardım kolilerinin dağıtımında görev alacak gönüllüler arıyoruz.",
        icon: HeartHandshake,
        image: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop",
        imageHint: "food donation"
    },
];

const STORY_DURATION = 5000;

function StoryViewer() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    const stories: ImpactSlide[] = React.useMemo(() => {
        switch (category) {
            case 'user': return userImpactStories;
            case 'community': return communityImpactStories;
            case 'opportunities': return opportunityStories;
            case 'hangel':
            default: return hangelImpactStories;
        }
    }, [category]);
    
    const handleClose = useCallback(() => router.back(), [router]);

    useEffect(() => {
        if (!api) return;
        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    const handleNext = useCallback(() => {
        if (!api) return;
        if (api.canScrollNext()) {
            api.scrollNext();
        } else {
            handleClose();
        }
    }, [api, handleClose]);

    const handlePrev = useCallback(() => {
        if (!api) return;
        api.scrollPrev();
    }, [api]);

    return (
        <div className="relative w-full h-full bg-white md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            {/* Progress Bars */}
            <div className="absolute top-4 inset-x-4 flex gap-1.5 z-50">
                {Array.from({ length: stories.length }).map((_, idx) => (
                    <div key={`${idx}-${current === idx + 1}`} className="h-1 flex-1 bg-black/5 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full bg-primary transition-all",
                                idx < current - 1 && "w-full",
                                idx === current - 1 && "animate-story-progress"
                            )}
                            style={{ animationDuration: `${STORY_DURATION}ms` }}
                            onAnimationEnd={(e) => {
                                if (e.animationName === 'story-progress') {
                                    handleNext();
                                }
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-10 inset-x-4 px-2 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-xl flex items-center justify-center border shadow-sm overflow-hidden">
                        {category === 'user' ? (
                            <Image src={user.avatarUrl} alt={user.name} width={40} height={40} className="object-cover h-full w-full" />
                        ) : (
                            <HangelLogo className="text-xl" />
                        )}
                    </div>
                    <div className="text-left drop-shadow-sm">
                        <p className="font-black text-xs uppercase tracking-widest text-foreground">
                            {stories[current - 1]?.subtitle || 'hangel'}
                        </p>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-foreground hover:bg-black/5 rounded-full h-10 w-10 backdrop-blur-md bg-white/40 border shadow-sm" 
                    onClick={handleClose}
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>
            
            {/* Click Nav Regions */}
            <div className="absolute inset-0 z-30 flex">
                <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
                <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
            </div>

            <Carousel setApi={setApi} className="w-full h-full">
                <CarouselContent className="h-full">
                    {stories.map((slide) => {
                        const Icon = slide.icon;
                        return (
                            <CarouselItem key={slide.id} className="h-full">
                                <div className="w-full h-full flex flex-col bg-white">
                                    <div className="relative flex-1 w-full min-h-0 bg-[#f5f5f7]">
                                        <Image
                                            src={slide.image}
                                            alt={slide.title}
                                            fill
                                            className="object-cover"
                                            priority
                                            data-ai-hint={slide.imageHint}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white" />
                                    </div>
                                    <div className="p-8 md:p-12 text-foreground bg-white border-t border-black/5 relative z-10">
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                                <Icon className="h-7 w-7" />
                                            </div>
                                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.95] mb-4">
                                                {slide.title}
                                            </h2>
                                            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium max-w-sm">
                                                {slide.content}
                                            </p>
                                            {slide.stat && (
                                                <div className="mt-8 pt-8 border-t border-black/5">
                                                    <p className="text-6xl md:text-7xl font-black tracking-tighter text-primary">{slide.stat}</p>
                                                </div>
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
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-0 md:p-8 backdrop-blur-sm">
            <div className="relative w-full max-w-[450px] h-full max-h-full md:max-h-[850px] aspect-[9/16] bg-white rounded-none md:rounded-[3rem] overflow-hidden">
                <Suspense fallback={<div className="flex items-center justify-center h-full bg-white"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                    <StoryViewer />
                </Suspense>
            </div>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}
