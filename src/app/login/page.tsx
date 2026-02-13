
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Menu, ShoppingBag, HeartHandshake, MapPin, Award, BookOpen, ArrowRight, TrendingUp, Users, ShieldCheck, FileText, Globe, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { HangelLogo } from '@/components/icons';
import { allEntityLists, volunteeringOpportunities } from '@/lib/data';
import type { Brand, Volunteering } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Badge } from '@/components/ui/badge';
import { PublicFooter } from '@/components/layout/public-footer';

const BrandLogo = ({ brand }: { brand: Brand }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false); // Reset error state when brand changes
  }, [brand]);

  if (hasError || !brand.logoUrl) {
    return (
      <div className="w-full h-full rounded-lg bg-white flex items-center justify-center p-1">
        <span className="text-muted-foreground font-bold text-sm">{brand.name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <img 
      src={brand.logoUrl} 
      alt={brand.name} 
      className="w-full h-full object-contain p-2"
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};


const ProductShowcaseSection = ({
    title,
    subtitle,
    description,
    cta1 = "Daha Fazla Bilgi",
    cta1Href = "#",
    cta2,
    cta2Href,
    theme = 'light',
    imageUrl,
    imageHint,
    id,
    className,
    children
}: {
    title: string,
    subtitle?: string,
    description?: string,
    cta1?: string,
    cta1Href?: string,
    cta2?: string,
    cta2Href?: string,
    theme?: 'light' | 'dark',
    imageUrl?: string,
    imageHint?: string,
    id?: string;
    className?: string;
    children?: React.ReactNode;
}) => (
    <section id={id} className={cn(
        "relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 text-center overflow-hidden border-b border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-4 px-6 max-w-4xl">
            {subtitle && <p className="text-xl md:text-2xl font-semibold opacity-90 tracking-tight" style={{color: theme === 'dark' ? '#00A8E8' : 'var(--primary)'}}>{subtitle}</p>}
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">{title}</h2>
            {description && <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto leading-relaxed font-medium">{description}</p>}
            
            <div className="flex items-center justify-center gap-6 pt-4">
                <Link href={cta1Href} className={cn("hover:underline flex items-center text-lg font-medium", theme === 'dark' ? 'text-[#2997ff]' : 'text-primary')}>
                    {cta1} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
                {cta2 && cta2Href && (
                    <Link href={cta2Href} className={cn("hover:underline flex items-center text-lg font-medium", theme === 'dark' ? 'text-[#2997ff]' : 'text-primary')}>
                        {cta2} <ChevronRight className="h-5 w-5 ml-0.5" />
                    </Link>
                )}
            </div>
        </div>

        {children}
        
        {imageUrl && (
            <div className="relative w-full flex-1 flex items-end justify-center mt-16 px-4 max-w-7xl mx-auto">
                <div className="relative w-full aspect-[21/9] rounded-t-[2rem] md:rounded-t-[3rem] overflow-hidden shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.1)]">
                    <Image 
                        src={imageUrl} 
                        alt={title} 
                        fill 
                        className="object-cover" 
                        data-ai-hint={imageHint}
                    />
                </div>
            </div>
        )}
    </section>
);

const ProjectCard = ({ title, subtitle, cta, ctaHref, imageUrl, imageHint }: any) => (
    <Link href={ctaHref} className="block group h-full">
        <div className={cn(
            "relative rounded-[1.75rem] p-6 text-left flex flex-col overflow-hidden h-[450px] text-white",
        )}>
            <div className="absolute inset-0 z-0">
                 <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" data-ai-hint={imageHint} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"/>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-end">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
                    <p className="text-sm opacity-80 max-w-xs">{subtitle}</p>
                </div>
                <div className="mt-4">
                    <span className="text-white hover:underline flex items-center text-sm font-semibold">
                        {cta} <ChevronRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                </div>
            </div>
        </div>
    </Link>
);

const projectCardsData = [
    { 
      title: "Sosyal Şirket Mevzuatı",
      subtitle: "Sosyal faydayı yasal statüye kavuşturan kanun teklifi.",
      cta: "Taslağı İncele",
      ctaHref: "/hangelassociation/legislation",
      imageUrl: "https://picsum.photos/seed/legislation/600/800",
      imageHint: "legal document gavel",
    },
    { 
      title: "Etki Odaklı İstihdam",
      subtitle: "Gönüllülüğü kariyere dönüştüren ilk model.",
      cta: "Protokolü İncele",
      ctaHref: "/hangelassociation/projects/istihdam-protokolu",
      imageUrl: "https://picsum.photos/seed/protocol/600/800",
      imageHint: "handshake meeting",
    },
    { 
      title: "Akademik Programlar",
      subtitle: "Üniversitelerde sosyal inovasyon müfredatı.",
      cta: "Programları Gör",
      ctaHref: "/hangelassociation/workshop",
      imageUrl: "https://picsum.photos/seed/academy/600/800",
      imageHint: "university graduation",
    },
    { 
      title: "Sosyal Etki Atlası",
      subtitle: "Türkiye'nin iyilik haritasını çiziyoruz.",
      cta: "Atlası Keşfet",
      ctaHref: "/hangelassociation/projects/etki-atlasi",
      imageUrl: "https://picsum.photos/seed/atlas/600/800",
      imageHint: "digital map",
    },
    { 
      title: "Girişimcilik Kütüphanesi",
      subtitle: "21 merkezde bilgi ve tecrübe temelli yol haritaları.",
      cta: "Kütüphaneye Git",
      ctaHref: "/hangelassociation/workshop",
      imageUrl: "https://picsum.photos/seed/library/600/800",
      imageHint: "library books",
    }
];


const Header = () => {
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
                <HangelLogo className="text-xl" />
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1d1d1f]/80">
                    <Link href="#bagis" className="hover:text-primary transition-colors">Bağış</Link>
                    <Link href="#gonulluluk" className="hover:text-primary transition-colors">Gönüllülük</Link>
                </nav>
                <div className="flex items-center gap-2">
                    <Button asChild size="sm" className="h-8 rounded-full px-5 text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                        <Link href="/login/selection?action=login">Giriş Yap</Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}

const VolunteeringCard = ({ opportunity }: { opportunity: Volunteering }) => {
    return (
        <Link href={`/volunteering/${opportunity.id}`} className="group block h-full">
            <Card className="rounded-[1.75rem] hover:shadow-xl transition-shadow bg-black/50 backdrop-blur-sm border-white/10 h-full flex flex-col p-6 text-white">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/10 rounded-xl text-white/80">
                         <HeartHandshake className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                         <p className="font-bold text-lg">{opportunity.points} Puan</p>
                         <p className="text-xs text-white/70">Etki Puanı</p>
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-white/70 uppercase tracking-wider">{opportunity.organization}</p>
                    <h4 className="font-bold text-lg leading-tight mt-1">{opportunity.title}</h4>
                </div>
                <div className="text-xs font-medium text-white/70 flex items-center gap-1.5 pt-4 mt-4 border-t border-white/20">
                    <MapPin className="h-4 w-4" />
                    <span>{opportunity.location.city} ({opportunity.location.type})</span>
                </div>
            </Card>
        </Link>
    );
};

const DiscoveryCarouselCard = ({ title, description, href, imageUrl, imageHint }: { title: string, description: string, href: string, imageUrl: string, imageHint: string }) => (
    <div className="h-full rounded-2xl bg-[#f5f5f7] overflow-hidden group flex flex-col shadow-lg hover:shadow-xl transition-shadow">
        <div className="relative w-full aspect-video">
            <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={imageHint} />
        </div>
        <div className="p-6 text-left flex flex-col flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 flex-1">{description}</p>
            <div className="mt-4">
                <Link href={href} className="text-sm font-semibold text-primary hover:underline flex items-center">
                    Daha Fazla Bilgi <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
            </div>
        </div>
    </div>
);


export default function LoginPage() {
    const discoveryCarouselPlugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true })
    );

    const discoveryItems = [
        { 
            title: "hangel STK", 
            description: "Dijitalleşin, kaynaklarınızı verimli kullanın ve daha fazla destekçiye ulaşın.", 
            href: "/ngo-onboarding",
            imageUrl: "https://images.unsplash.com/photo-1526375568935-e57a76cc0f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8Y2hhcmNvYWwlMjBjaGFyaXR5JTIwZHJhd2luZ3xlbnwwfHx8fDE3NzAyNjgxMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
            imageHint: "charcoal charity drawing"
        },
        { 
            title: "hangel Marka", 
            description: "Ticareti sosyal faydayla birleştirin, müşteri sadakatini ve marka değerinizi artırın.", 
            href: "/merchant",
            imageUrl: "https://picsum.photos/seed/merc-char/1080/1080",
            imageHint: "charcoal merchant store drawing"
        },
        { 
            title: "hangel Clubs", 
            description: "Kampüsteki sosyal etkiyi büyütün, kariyer fırsatları yakalayın ve ağınızı genişletin.", 
            href: "/campus-advantages",
            imageUrl: "https://images.unsplash.com/photo-1693700685983-08ae3fb430c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxtaW5pbWFsaXN0JTIwdW5pdmVyc2l0eSUyMGNvbmZlcmVuY2UlMjBwb3N0ZXJ8ZW58MHx8fHwxNzcwMjY4MTI1fDA&ixlib=rb-4.1.0&q=80&w=1080",
            imageHint: "minimalist university poster"
        },
        { 
            title: "Kütüphane", 
            description: "Sosyal etki, gönüllülük ve sivil toplum hakkında kaynakları, raporları ve makaleleri keşfedin.", 
            href: "/library",
            imageUrl: "https://images.unsplash.com/photo-1760034746619-f922049bc2a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjaGFyY29hbCUyMGxpYnJhcnklMjBib29rJTIwZHJhd2luZ3xlbnwwfHx8fDE3NzAyNjgxMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
            imageHint: "charcoal library drawing"
        }
    ];

    const InfoCard = ({ title, description, link, linkText, icon: Icon }: { title: string, description: string, link: string, linkText: string, icon: React.ElementType }) => (
        <div className="bg-[#f5f5f7] rounded-3xl p-8 flex flex-col h-full text-left">
            <div className="p-3 bg-white rounded-2xl w-fit shadow-sm mb-6">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-xl text-[#1d1d1f]">{title}</h3>
            <p className="text-sm text-[#1d1d1f]/80 mt-3 flex-grow">{description}</p>
            <div className="mt-10">
                <Link href={link} className="text-sm font-semibold text-primary hover:underline flex items-center group">
                    {linkText} <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </div>
    );
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <Header />
            <main>
                <ProductShowcaseSection
                    theme="dark"
                    title="Yok öyle yalnız başına mücadele etmek."
                    subtitle="Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz."
                    description="#wearehangel"
                    cta1="Şimdi Katıl"
                    cta1Href="/login/selection?action=register"
                    cta2="Daha Fazla Bilgi"
                    cta2Href="/about"
                    imageUrl="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop"
                    imageHint="diverse group people"
                />
                <ProductShowcaseSection
                    id="bagis"
                    title="Alışverişi iyiliğe dönüştürün."
                    subtitle="hangel Bağış"
                    description="Yüzlerce markadan yaptığınız alışverişlerle, hiçbir ek ücret ödemeden seçtiğiniz STK'ya destek olun. Bilinçli tüketiciliğin en kolay yolu."
                    cta1="Markaları Keşfet"
                    cta1Href="/market"
                >
                    <div className="w-full max-w-7xl mx-auto px-4 mt-16">
                        <Carousel
                            plugins={[
                                Autoplay({
                                  delay: 2500,
                                  stopOnInteraction: true,
                                }),
                              ]}
                            opts={{ align: "start", loop: true }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4">
                                {allEntityLists.slice(0, 12).map((brand) => (
                                    <CarouselItem key={brand.id} className="pl-4 basis-[10rem] md:basis-[12rem]">
                                        <Link href={`/market/${brand.slug}`} className="group block h-full">
                                            <Card className="rounded-[1.75rem] hover:shadow-xl transition-shadow bg-white/50 backdrop-blur-sm border-black/5 h-full flex flex-col">
                                                <CardContent className="p-4 text-center flex flex-col h-full">
                                                    <div className="w-full flex justify-start mb-4">
                                                        <div className="p-1.5 bg-black/5 rounded-lg">
                                                            <ShoppingBag className="h-4 w-4 text-black/40" />
                                                        </div>
                                                    </div>
                                                    <div className="h-16 flex items-center justify-center my-4 flex-grow">
                                                        <div className="relative h-full w-full max-w-[8rem]">
                                                            <BrandLogo brand={brand} />
                                                        </div>
                                                    </div>
                                                    <div className="mt-auto w-full">
                                                        <p className="font-semibold text-sm truncate text-foreground">{brand.name}</p>
                                                        <Separator className="my-2"/>
                                                        <p className="font-extrabold text-primary text-xl">%
                                                          {
                                                            brand.donationRate.toLocaleString('en-US', {
                                                              minimumFractionDigits: 0,
                                                              maximumFractionDigits: 2,
                                                            })
                                                          }
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                        <div className="text-center mt-8">
                            <Button asChild variant="outline" className="rounded-full px-8 h-12 font-bold border-black/10 hover:bg-white">
                                <Link href="/market">
                                    Tümünü Gör ({allEntityLists.length} Marka)
                                </Link>
                            </Button>
                        </div>
                    </div>
                </ProductShowcaseSection>
                <ProductShowcaseSection
                    id="gonulluluk"
                    theme="dark"
                    title="Zamanınız en değerli bağış."
                    subtitle="hangel İmece"
                    description="Yetkinliklerinizi ve zamanınızı toplumsal faydaya dönüştürün. Çevreden eğitime, hayvan haklarından sanata, size en uygun gönüllülük fırsatını bulun."
                    cta1="İlanları Gör"
                    cta1Href="/volunteering"
                    cta2="Gönüllü Ol"
                    cta2Href="/login/selection?action=register"
                >
                    <div className="w-full max-w-7xl mx-auto px-4 mt-16">
                        <Carousel
                            plugins={[
                                Autoplay({
                                  delay: 3000,
                                  stopOnInteraction: true,
                                }),
                              ]}
                            opts={{ align: "start", loop: true }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4">
                                {volunteeringOpportunities.slice(0, 10).map((opp) => (
                                    <CarouselItem key={opp.id} className="pl-4 basis-full sm:basis-1/2 md:basis-[22rem]">
                                        <VolunteeringCard opportunity={opp} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                        <div className="text-center mt-8">
                            <Button asChild variant="outline" className="rounded-full px-8 h-12 font-bold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white">
                                <Link href="/volunteering">
                                    Tümünü Gör ({volunteeringOpportunities.length} İlan)
                                </Link>
                            </Button>
                        </div>
                    </div>
                </ProductShowcaseSection>
                
                <section id="kurumlar-carousel" className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-12 space-y-2">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">hangel'i Keşfedin</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Kurumlar ve bireyler için sunduğumuz çözümlerle tanışın.</p>
                        </div>
                        <Carousel
                            opts={{ align: "start", loop: true }}
                            plugins={[discoveryCarouselPlugin.current]}
                            onMouseEnter={discoveryCarouselPlugin.current.stop}
                            onMouseLeave={discoveryCarouselPlugin.current.reset}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-6">
                                {discoveryItems.map((item, index) => (
                                    <CarouselItem key={index} className="pl-6 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                        <DiscoveryCarouselCard {...item} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="ml-14 hidden sm:flex" />
                            <CarouselNext className="mr-14 hidden sm:flex" />
                        </Carousel>
                    </div>
                </section>

                <section id="projeler" className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto max-w-7xl text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">hangel Association</h2>
                        <p className="text-muted-foreground mt-2">Derneğimizin öncülük ettiği projeler ve çalışmalar.</p>
                    </div>
                    <Carousel
                        opts={{ align: "start" }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4 container mx-auto px-4 max-w-7xl">
                            {projectCardsData.map((card, index) => (
                                <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-[22rem]">
                                    <ProjectCard {...card} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="container mx-auto max-w-7xl px-4 mt-8 flex justify-end">
                            <CarouselPrevious className="static -translate-x-1" />
                            <CarouselNext className="static" />
                        </div>
                    </Carousel>
                </section>

                <section id="degerler" className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Değerlerimizle Fark Oluşturuyoruz.</h2>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">Şeffaflık, güvenlik ve erişilebilirlik üzerine kurulu bir sosyal etki ekosistemi oluşturuyoruz.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <InfoCard 
                                icon={TrendingUp}
                                title="Sürdürülebilirlik"
                                description="Toplumsal ve çevresel etkimizi nasıl yönettiğimizi ve pozitif değişime nasıl liderlik ettiğimizi keşfedin."
                                link="/social-impact"
                                linkText="Etkimizi Görün"
                            />
                            <InfoCard 
                                icon={Users}
                                title="Erişilebilirlik"
                                description="Teknolojiyi herkes için kullanılabilir kılma taahhüdümüzü ve standartlarımızı inceleyin."
                                link="/accessibility"
                                linkText="Standartları İnceleyin"
                            />
                            <InfoCard 
                                icon={ShieldCheck}
                                title="Güvenlik"
                                description="Verilerinizi nasıl koruduğumuzu ve platformumuzun güvenliğini nasıl sağladığımızı öğrenin."
                                link="/settings/contracts/gizlilik-politikasi"
                                linkText="Daha Fazla Bilgi"
                            />
                            <InfoCard 
                                icon={FileText}
                                title="Yasal Bilgiler"
                                description="Yasal bilgilendirmelerimize ve kurumsal şeffaflık belgelerimize ulaşın."
                                link="/bilgi-toplumu-hizmetleri"
                                linkText="Belgeleri Görüntüleyin"
                            />
                        </div>
                    </div>
                </section>
                
            </main>
            <PublicFooter currentPageLabel="Anasayfa" />
        </div>
    );
}
