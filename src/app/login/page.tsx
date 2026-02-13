'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Menu, ShoppingBag, HeartHandshake, MapPin, Award, BookOpen, ArrowRight, TrendingUp, Users, ShieldCheck, FileText, Globe, Sparkles, Megaphone, Bell } from 'lucide-react';
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
import { languages, useTranslation } from '@/components/providers/language-provider';
import * as Icons from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';


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

const BrandCard = ({ brand }: { brand: Brand }) => (
    <Link href={`/market/${brand.slug}`} className="group block h-full">
      <Card className="rounded-[1.75rem] hover:shadow-xl transition-shadow bg-white border border-gray-100 h-full flex flex-col p-6 items-center text-center">
        <div className="w-24 h-24 rounded-2xl bg-muted overflow-hidden mb-4 border">
          <BrandLogo brand={brand} />
        </div>
        <h4 className="font-bold text-lg leading-tight flex-1">{brand.name}</h4>
        <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-none text-base font-bold">
          %{brand.donationRate} Bağış
        </Badge>
      </Card>
    </Link>
);

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
            {subtitle && <p className={cn("text-xl md:text-2xl font-semibold opacity-90 tracking-tight", theme === 'dark' ? "text-[#00A8E8]" : "text-primary")}>{subtitle}</p>}
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">{title}</h2>
            {description && <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto leading-relaxed font-medium">{description}</p>}
            
             <div className="flex items-center justify-center gap-4 pt-4">
                <Button asChild size="lg" className="rounded-full px-6 bg-[#0071e3] hover:bg-[#0077ed]">
                    <Link href={cta1Href!}>{cta1}</Link>
                </Button>
                {cta2 && cta2Href && (
                    <Button asChild size="lg" variant="outline" className={cn(
                        "rounded-full px-6", 
                        theme === 'dark' 
                            ? "border-white/50 text-white bg-transparent hover:bg-white hover:text-black"
                            : "border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3] hover:text-white"
                    )}>
                        <Link href={cta2Href}>{cta2}</Link>
                    </Button>
                )}
            </div>
        </div>
        
        {children ? (
            <div className="w-full mt-16">{children}</div>
        ) : (
            imageUrl && (
                <div className="relative w-full flex-1 flex items-end justify-center mt-16 px-4 max-w-7xl mx-auto">
                    <div className="relative w-full aspect-[21/9] rounded-t-[2rem] md:rounded-t-[3rem] overflow-hidden shadow-[0_-20px_50px_-25px_rgba(0,0,0,0.1)]">
                        <Image src={imageUrl} alt={title} fill className="object-cover" data-ai-hint={imageHint} />
                    </div>
                </div>
            )
        )}
    </section>
);

const ProjectCard = ({ title, subtitle, cta, ctaHref, imageUrl, imageHint }: any) => (
    <Link href={ctaHref} className="group block h-full">
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
      title: "Sosyal Şirket Mevzuatı (taslağı)",
      subtitle: "Sosyal faydayı yasal statüye kavuşturan kanun teklifi.",
      cta: "Taslağı İncele",
      ctaHref: "/hangelassociation/legislation",
      imageUrl: "https://picsum.photos/seed/legislation/600/800",
      imageHint: "legal document gavel",
    },
    { 
      title: "Etki Odaklı İstihdam",
      subtitle: "Gönüllülüğü kariyere dönüştüren ilk model.",
      cta: "Protokolü İncele, imzala",
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
      subtitle: "Türkiye'nin iyilik haritasını 54 ülkeden 639 örnek ile çiziyoruz.",
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


const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
    const { language, changeLanguage } = useTranslation();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onMenuClick}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <HangelLogo className="text-xl" />
                </div>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1d1d1f]/80">
                    <Link href="#bagis" className="hover:text-primary transition-colors">Bağış</Link>
                    <Link href="#gonulluluk" className="hover:text-primary transition-colors">Gönüllülük</Link>
                </nav>
                <div className="flex items-center gap-2">
                    <Select value={language} onValueChange={changeLanguage}>
                        <SelectTrigger className="w-auto border-none bg-transparent gap-1 h-8 px-2 text-xs font-normal text-[#1d1d1f]/80 hover:text-primary transition-colors focus:ring-0">
                            <Icons.Globe className="h-3.5 w-3.5" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            {languages.map(lang => (
                                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80"><Link href="/stories"><Megaphone className="h-5 w-5" /></Link></Button>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80"><Link href="/notifications"><Bell className="h-5 w-5" /></Link></Button>
                    <Button asChild size="sm" className="h-8 rounded-full px-5 text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                        <Link href="/login/selection?action=login">Giriş Yap</Link>
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const publicNavItems = [
      { href: '#bagis', label: 'Bağış Yap' },
      { href: '#gonulluluk', label: 'Gönüllü Ol' },
      { href: '/hangelassociation', label: 'hangel Derneği' },
      { href: '/about', label: 'Hakkımızda' },
      { href: '/support', label: 'Destek' },
    ];

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
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle className="text-left">
                            <HangelLogo className="text-2xl" />
                        </SheetTitle>
                        <SheetDescription />
                    </SheetHeader>
                    <nav className="flex flex-col gap-4 py-6">
                         {publicNavItems.map(item => (
                            <SheetClose asChild key={item.label}>
                                <Link href={item.href} className="text-lg font-medium hover:text-primary">{item.label}</Link>
                            </SheetClose>
                         ))}
                    </nav>
                </SheetContent>
            </Sheet>
            <Header onMenuClick={() => setIsMenuOpen(true)} />
            <main>
                <section className="h-screen flex flex-col justify-center items-center text-center p-6 bg-white border-b border-black/5">
                    <h2 className="text-2xl md:text-4xl font-medium text-muted-foreground max-w-4xl">Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.</h2>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none text-[#1d1d1f]">Yok öyle yalnız başına mücadele etmek.</h1>
                    <p className="text-2xl md:text-4xl font-medium text-muted-foreground mt-6 max-w-4xl">#wearehangel</p>
                    <div className="mt-12">
                        <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                            <Link href="/login/selection?action=register">Hemen Katıl</Link>
                        </Button>
                    </div>
                </section>

                 <ProductShowcaseSection
                    id="bagis"
                    theme="light"
                    title="hangel Bağış"
                    subtitle="Alışverişi iyiliğe dönüştürün."
                    description="Yüzlerce markadan yaptığınız alışverişlerle, hiçbir ek ücret ödemeden seçtiğiniz STK'ya destek olun. Bilinçli tüketiciliğin en kolay yolu."
                    cta1="Markaları Keşfet"
                    cta1Href="/market"
                    cta2="Daha Fazla Bilgi"
                    cta2Href="/social-impact"
                >
                     <Carousel
                        opts={{
                        align: "start",
                        loop: true,
                        }}
                        className="w-full max-w-7xl mx-auto"
                    >
                        <CarouselContent className="-ml-4">
                            {allEntityLists.slice(0, 15).map((brand) => (
                                <CarouselItem key={brand.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                                    <div className="h-[350px] p-1">
                                        <BrandCard brand={brand} />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="ml-16" />
                        <CarouselNext className="mr-16" />
                    </Carousel>
                </ProductShowcaseSection>
                <ProductShowcaseSection
                    id="gonulluluk"
                    theme="dark"
                    title="hangel İmece"
                    subtitle="Zamanınız en değerli bağış."
                    description="Yetkinliklerinizi ve zamanınızı toplumsal faydaya dönüştürün. Çevreden eğitime, hayvan haklarından sanata, size en uygun gönüllülük fırsatını bulun."
                    cta1="İlanları Gör"
                    cta1Href="/volunteering"
                    cta2="Gönüllü Ol"
                    cta2Href="/login/selection?action=register"
                >
                    <Carousel
                        opts={{
                        align: "start",
                        loop: true,
                        }}
                        className="w-full max-w-7xl mx-auto"
                    >
                        <CarouselContent className="-ml-4">
                            {volunteeringOpportunities.slice(0, 15).map((opp) => (
                                <CarouselItem key={opp.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                                     <div className="h-[350px] p-1">
                                        <VolunteeringCard opportunity={opp} />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="ml-16" />
                        <CarouselNext className="mr-16" />
                    </Carousel>
                </ProductShowcaseSection>
                
                <section id="kurumlar-grid" className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-12 space-y-2">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">hangel'i Keşfedin</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Kurumlar ve bireyler için sunduğumuz çözümlerle tanışın.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {discoveryItems.map((item, index) => (
                                <DiscoveryCarouselCard key={index} {...item} />
                            ))}
                        </div>
                    </div>
                </section>

                <section id="projeler" className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto max-w-7xl">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">hangel Association</h2>
                            <p className="text-muted-foreground mt-2">Derneğimizin öncülük ettiği projeler ve çalışmalar.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {projectCardsData.map((card, index) => (
                                <ProjectCard key={index} {...card} />
                            ))}
                        </div>
                    </div>
                </section>

                <section id="degerler" className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Değerlerimizle Fark Oluşturuyoruz</h2>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">Şeffaflık, güvenlik ve erişilebilirlik üzerine kurulu bir sosyal etki ekosistemi tasarlıyoruz.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
