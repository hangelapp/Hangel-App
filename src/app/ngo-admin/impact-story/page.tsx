'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import type { UseEmblaCarouselType } from "embla-carousel-react"
import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { TrendingUp, User, Users, Rocket, Award, Heart, ShieldCheck, Store, Globe, MapPin, School, HeartHandshake } from 'lucide-react';
import { user } from '@/lib/data';

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
        title: `${user.stats.totalDonation.toLocaleString('tr-TR')} ₺ Bağış Yaptın`,
        subtitle: "Finansal Destek",
        content: `Yaptığın alışverişlerle ${user.stats.mostSupportedNgo} gibi kurumlara destek oldun.`,
        stat: `₺${user.stats.totalDonation.toLocaleString('tr-TR')}`,
        icon: Heart,
        image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop",
        imageHint: "donation concept"
    },
    {
        id: 3,
        title: `${user.stats.volunteerHours} Saat Gönüllülük Yaptın`,
        subtitle: "Zamanın Değeri",
        content: `En çok ${user.stats.mostActiveVolunteerArea} alanında aktif olarak topluma zamanını ve yeteneğini ayırdın.`,
        stat: `${user.stats.volunteerHours} Saat`,
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

const STORY_DURATION = 5000;

function StoryViewer() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [progress, setProgress] = React.useState(0);
    const [api, setApi] = React.useState<UseEmblaCarouselType[1]>();

    const stories: ImpactSlide[] = React.useMemo(() => {
        switch (category) {
            case 'user':
                return userImpactStories;
            case 'community':
                return communityImpactStories;
            case 'hangel':
            default:
                return hangelImpactStories;
        }
    }, [category]);

    const nextSlide = React.useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            router.back();
        }
    }, [currentIndex, stories.length, router]);
    
    const prevSlide = React.useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    }, [currentIndex]);
    
    const handleClose = React.useCallback(() => {
        router.back();
    }, [router]);

    React.useEffect(() => {
        if (!api) return;

        const handleSelect = () => {
            setCurrentIndex(api.selectedScrollSnap());
            setProgress(0);
        };
        api.on("select", handleSelect);

        const progressInterval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    api.scrollNext();
                    return 0;
                }
                return p + (100 / (STORY_DURATION / 50));
            });
        }, 50);

        return () => {
            clearInterval(progressInterval);
            api.off("select", handleSelect);
        };
    }, [api]);

    const currentSlide = stories[currentIndex];

    if (!currentSlide) {
        return (
            <div className="flex items-center justify-center h-full bg-black text-white">
                Hikaye bulunamadı.
            </div>
        );
    }
    const Icon = currentSlide.icon;
    
    return (
         <div className="relative w-full h-full bg-white md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            {/* Progress Bars */}
            <div className="absolute top-4 inset-x-0 px-4 flex gap-1 z-50">
                {stories.map((s, idx) => (
                    <div key={s.id} className="h-1 flex-1 bg-black/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#f34723] transition-all duration-50 ease-linear"
                            style={{
                                width: idx < currentIndex ? '100%' : (idx === currentIndex ? `${progress}%` : '0%')
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 inset-x-0 px-6 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center border border-black/5 shadow-sm">
                        <HangelLogo className="text-[10px] scale-75" />
                    </div>
                    <div className="text-left drop-shadow-sm">
                        <p className="text-black font-black text-xs uppercase tracking-widest">{currentSlide.subtitle}</p>
                        <p className="text-black/40 text-[10px] font-bold">ETKİ HİKAYESİ</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-black hover:bg-black/5 rounded-full h-10 w-10 backdrop-blur-md bg-white/20" onClick={handleClose}>
                    <X className="h-6 w-6" />
                </Button>
            </div>
            
            <Carousel setApi={setApi} className="w-full h-full">
                <CarouselContent>
                    {stories.map((slide) => {
                        const CurrentIcon = slide.icon;
                        return (
                            <CarouselItem key={slide.id}>
                                <div className="flex-1 relative flex flex-col h-full">
                                    <div className="absolute inset-0 z-0">
                                        <Image
                                            src={slide.image}
                                            alt={slide.title}
                                            fill
                                            className="object-cover"
                                            priority={slide.id === stories[0].id}
                                            data-ai-hint={slide.imageHint}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/90" />
                                    </div>
                                    <div className="relative z-10 flex-1 flex flex-col justify-end p-8 pb-32 space-y-6">
                                        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
                                            <div className="w-14 h-14 rounded-2xl bg-[#f34723] flex items-center justify-center text-white mb-6 shadow-xl shadow-[#f34723]/30">
                                                <CurrentIcon className="h-8 w-8" />
                                            </div>
                                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black leading-[1.1] mb-4">
                                                {slide.title}
                                            </h2>
                                            <p className="text-base text-black/70 font-medium leading-relaxed max-w-sm">
                                                {slide.content}
                                            </p>
                                            {slide.stat && (
                                                <div className="mt-8">
                                                    <div className="inline-flex flex-col">
                                                        <span className="text-5xl font-black text-black tracking-tighter">{slide.stat}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
                 <CarouselPrevious onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 z-40 h-10 w-10 bg-black/20 text-white border-none hover:bg-black/40" />
                 <CarouselNext onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 z-40 h-10 w-10 bg-black/20 text-white border-none hover:bg-black/40" />
            </Carousel>
        </div>
    );
}

export default function ImpactStoryPage() {
    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <div className="relative w-full max-w-[450px] h-full max-h-[800px] aspect-[9/16] bg-card rounded-2xl overflow-hidden">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Yükleniyor...</div>}>
                    <StoryViewer />
                </Suspense>
            </div>
        </div>
    );
}
