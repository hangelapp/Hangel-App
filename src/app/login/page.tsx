'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Menu, ShoppingBag, HeartHandshake, MapPin, Award, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { HangelLogo } from '@/components/icons';
import { allEntityLists, volunteeringOpportunities } from '@/lib/data';
import type { Brand, Volunteering } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
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

const ShowcaseGridCard = ({ 
    title, 
    subtitle, 
    imageUrl, 
    imageHint, 
    cta1, 
    cta1Href, 
    cta2, 
    cta2Href, 
    theme = 'light' 
}: { 
    title:string, 
    subtitle:string, 
    imageUrl:string, 
    imageHint:string, 
    cta1?: string,
    cta1Href?: string,
    cta2?: string,
    cta2Href?: string,
    theme?:'light'|'dark' 
}) => {
    return (
        <div className={cn(
            "rounded-3xl p-8 flex flex-col text-center",
            theme === 'dark' ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'
        )}>
            <div className="space-y-2">
                <h3 className="text-4xl font-bold tracking-tight">{title}</h3>
                <p className="text-base max-w-xs mx-auto opacity-80">{subtitle}</p>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2">
                {cta1 && cta1Href && (
                    <Link href={cta1Href} className="text-primary hover:underline flex items-center text-sm font-medium">
                        {cta1} <ChevronRight className="h-4 w-4 ml-0.5" />
                    </Link>
                )}
                {cta2 && cta2Href && (
                    <Link href={cta2Href} className="text-primary hover:underline flex items-center text-sm font-medium">
                        {cta2} <ChevronRight className="h-4 w-4 ml-0.5" />
                    </Link>
                )}
            </div>
            <div className="flex-1 flex items-end justify-center mt-8">
                <div className="relative w-full aspect-video">
                    <Image src={imageUrl} alt={title} fill className="object-contain" data-ai-hint={imageHint} />
                </div>
            </div>
        </div>
    );
};


export default function LoginPage() {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <Header />
            <main>
                <ProductShowcaseSection
                    theme="dark"
                    title="Yok öyle yalnız başına mücadele etmek."
                    subtitle="Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz."
                    description="Türkiye'nin en kapsamlı sosyal etki platformu Hangel ile tanışın."
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
                                                        <p className="font-extrabold text-primary text-xl">%{brand.donationRate}</p>
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
                <section id="kurumlar" className="scroll-mt-24 py-16">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-12 space-y-4">
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Kurumlar İçin.</h2>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">Kuruluşunuzun dijitalleşmesini sağlayın, operasyonlarınızı tek bir panelden yönetin, etki raporları oluşturun ve daha geniş kitlelere ulaşın.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ShowcaseGridCard 
                                title="hangel STK" 
                                subtitle="Dijitalleşin, kaynaklarınızı verimli kullanın ve daha fazla destekçiye ulaşın." 
                                cta1="Şimdi Katıl"
                                cta1Href="/ngo-onboarding"
                                cta2="Daha Fazla Bilgi"
                                cta2Href="/ngo-onboarding"
                                imageUrl="https://images.unsplash.com/photo-1526375568935-e57a76cc0f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8Y2hhcmNvYWwlMjBjaGFyaXR5JTIwZHJhd2luZ3xlbnwwfHx8fDE3NzAyNjgxMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                                imageHint="charcoal charity drawing"
                                theme="dark"
                            />
                            <ShowcaseGridCard 
                                title="hangel Marka" 
                                subtitle="Ticareti sosyal faydayla birleştirin, müşteri sadakatini ve marka değerinizi artırın." 
                                cta1="Şimdi Katıl"
                                cta1Href="/merchant"
                                cta2="Daha Fazla Bilgi"
                                cta2Href="/merchant"
                                imageUrl="https://picsum.photos/seed/merc-char/1080/1080"
                                imageHint="charcoal merchant store drawing"
                            />
                            <ShowcaseGridCard 
                                title="hangel Clubs" 
                                subtitle="Kampüsteki sosyal etkiyi büyütün, kariyer fırsatları yakalayın ve ağınızı genişletin." 
                                cta1="Şimdi Katıl"
                                cta1Href="/login/selection?action=register&type=corporate"
                                cta2="Daha Fazla Bilgi"
                                cta2Href="/campus-advantages"
                                imageUrl="https://images.unsplash.com/photo-1693700685983-08ae3fb430c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxtaW5pbWFsaXN0JTIwdW5pdmVyc2l0eSUyMGNvbmZlcmVuY2UlMjBwb3N0ZXJ8ZW58MHx8fHwxNzcwMjY4MTI1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                                imageHint="minimalist university poster"
                            />
                            <ShowcaseGridCard 
                                title="Kütüphane" 
                                subtitle="Sosyal etki, gönüllülük ve sivil toplum hakkında kaynakları, raporları ve makaleleri keşfedin." 
                                cta1="Daha Fazla Bilgi"
                                cta1Href="/library"
                                cta2="Şimdi Katıl"
                                cta2Href="/login/selection?action=register"
                                imageUrl="https://images.unsplash.com/photo-1760034746619-f922049bc2a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxjaGFyY29hbCUyMGxpYnJhcnklMjBib29rJTIwZHJhd2luZ3xlbnwwfHx8fDE3NzAyNjgxMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                                imageHint="charcoal library drawing"
                                theme="dark"
                            />
                        </div>
                    </div>
                </section>
            </main>
            <PublicFooter currentPageLabel="Anasayfa" />
        </div>
    );
}
