'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Menu, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { HangelLogo } from '@/components/icons';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { allEntityLists } from '@/lib/data';
import type { Brand } from '@/lib/types';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-react";

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
    imageUrl: string,
    imageHint: string,
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
                    <Link href="/about" className="hover:text-primary transition-colors">Hakkımızda</Link>
                    <Link href="/support" className="hover:text-primary transition-colors">Destek</Link>
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

const XIcon = (props: any) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const Footer = () => {
    const footerGroups = [
        { title: "KEŞFEDİN", links: [{label: "Market", href: "/market"}, {label: "Gönüllülük", href: "/volunteering"}, {label: "STK'lar", href: "/ngos"}, {label: "Kulüpler", href: "/admin/clubs"}, {label: "Kütüphane", href: "/library"}] },
        { title: "KURUMSAL", links: [{label: "Biz Kimiz?", href: "/about"}, {label: "Sosyal Etkimiz", href: "/social-impact"}, {label: "Basın Odası", href: "/press"}, {label: "Yatırımcılar", href: "/yatirimci-iliskileri"}, {label: "Kariyer", href: "/careers"}] },
        { title: "İŞBİRLİKLERİ", links: [{label: "Üye İşyeri ol", href: "/merchant"}, {label: "STK Kaydı", href: "/ngo-onboarding"}, {label: "Temsilci Ol", href: "/contact/universities"}, {label: "Kulüp Kaydı", href: "/login/selection?action=register&type=corporate"}, {label: "Kamu İşbirlikleri", href: "/corporate"}] },
        { title: "HANGEL DERNEĞİ", links: [{label: "Hakkında", href: "/hangelassociation/about"}, {label: "Etkinlikler", href: "/hangelassociation/events"}, {label: "Uluslararası Çalıştay", href: "/hangelassociation/workshop"}, {label: "Mevzuat Taslağı", href: "/hangelassociation/legislation"}] },
        { title: "HESABIM", links: [{label: "Giriş Yap", href: "/login/selection?action=login"}, {label: "Kayıt Ol", href: "/login/selection?action=register"}, {label: "Destek Merkezi", href: "/support"}, {label: "Geri Bildirim", href: "/feedback"}] },
    ];
    
    const storeLinks = ["App Store", "Google Play", "Huawei Store", "Chrome Store", "Opera Store"];
    const socialLinks = [
        { name: "Instagram", icon: null },
        { name: "Facebook", icon: null },
        { name: "X (Twitter)", icon: XIcon },
        { name: "LinkedIn", icon: null },
        { name: "YouTube", icon: null },
    ];
    const policyLinks = [
        { label: "Politikalar", href: "/settings/contracts" },
        { label: "Çerezlerin Kullanımı", href: "/settings/contracts/cerez-politikasi" },
        { label: "Sözleşmeler", href: "/settings/contracts" },
        { label: "Site Haritası", href: "/sitemap" },
        { label: "Bilgi Toplumu Hizmetleri", href: "/bilgi-toplumu-hizmetleri" },
        { label: "Erişilebilirlik", href: "/accessibility" },
    ];

    return (
        <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-8 pb-12 px-4 sm:px-6 border-t border-black/5 font-sans">
            <div className="container mx-auto max-w-6xl">
                <div className="flex items-center gap-2 text-[12px] text-[#1d1d1f]/60 mb-10 px-1">
                    <HangelLogo className="text-base text-black/80 font-bold" />
                    <ChevronRight className="h-3 w-3" />
                    <span>Anasayfa</span>
                </div>

                <div className="md:hidden">
                    <Accordion type="single" collapsible className="w-full">
                        {footerGroups.map((group) => (
                            <AccordionItem key={group.title} value={group.title} className="border-b border-black/10">
                                <AccordionTrigger className="text-[12px] font-bold py-3 hover:no-underline uppercase tracking-tight text-[#1d1d1f]/80">
                                    {group.title}
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-2.5 pb-4 pt-1">
                                    {group.links.map(link => (
                                        <Link key={link.label} href={link.href} className="text-[12px] text-[#1d1d1f]/70 hover:underline">{link.label}</Link>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                <div className="hidden md:grid grid-cols-5 gap-8 border-b border-black/10 pb-8">
                    {footerGroups.map((group) => (
                        <div key={group.title} className="space-y-3">
                            <h4 className="text-[12px] font-bold uppercase tracking-tight text-[#1d1d1f]/80">{group.title}</h4>
                            <div className="flex flex-col gap-2">
                                {group.links.map(link => (
                                    <Link key={link.label} href={link.href} className="text-[12px] text-[#1d1d1f]/70 hover:underline">{link.label}</Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-6 space-y-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#1d1d1f]/70 font-medium">
                        {storeLinks.map(link => <a href="#" key={link} className="hover:underline">{link}</a>)}
                    </div>
                     <div className="h-px bg-black/10 w-full" />
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#1d1d1f]/70 font-medium">
                        {socialLinks.map(link => <a href="#" key={link.name} className="hover:underline">{link.name}</a>)}
                    </div>
                    <p className="text-[12px] text-[#1d1d1f]/70">Diğer alışveriş seçenekleri: Yakınınızda bir <a href="#" className="text-primary font-bold hover:underline">hangel destek</a> bulun veya 0554 700 70 07 numaralı telefonu arayın.</p>
                     <div className="h-px bg-black/10 w-full" />
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#1d1d1f]/50 font-medium">
                        {policyLinks.map((link, index) => (
                            <React.Fragment key={link.label}>
                                <Link href={link.href} className="hover:underline">{link.label}</Link>
                                {index < policyLinks.length - 1 && <span className="text-black/10">|</span>}
                            </React.Fragment>
                        ))}
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-black/10">
                        <div className="text-[12px] text-[#1d1d1f]/50">
                            Telif Hakkı © 2024 hangel A.Ş. Tüm hakları saklıdır.
                        </div>
                        <div className="text-[12px] font-medium text-[#1d1d1f]/70">
                            Türkiye
                        </div>
                    </div>
                </div>
            </div>
        </footer>
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
                    cta2={`Tümünü Gör (${allEntityLists.length} Marka)`}
                    cta2Href="/market"
                    imageUrl="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop"
                    imageHint="contactless payment store"
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
                                    <CarouselItem key={brand.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-[15%]">
                                        <Link href={`/market/${brand.slug}`} className="group block h-full">
                                            <Card className="rounded-[1.75rem] hover:shadow-xl transition-shadow bg-white/50 backdrop-blur-sm border-black/5 h-full">
                                                <CardContent className="p-4 text-center flex flex-col h-full">
                                                    <div className="w-full flex justify-start mb-4">
                                                        <div className="p-1.5 bg-black/5 rounded-lg">
                                                            <ShoppingBag className="h-4 w-4 text-black/40" />
                                                        </div>
                                                    </div>
                                                    <div className="h-12 flex items-center justify-center my-4 flex-grow">
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
                    imageUrl="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"
                    imageHint="volunteers classroom students"
                />
                <ProductShowcaseSection
                    id="kurumlar"
                    title="Kurumlar İçin."
                    subtitle="STK, Marka veya Öğrenci Kulübü"
                    description="Kuruluşunuzun dijitalleşmesini sağlayın, operasyonlarınızı tek bir panelden yönetin, etki raporları oluşturun ve daha geniş kitlelere ulaşın."
                    cta1="STK Başvurusu"
                    cta1Href="/ngo-onboarding"
                    cta2="Üye İşyeri Ol"
                    cta2Href="/merchant"
                    imageUrl="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
                    imageHint="corporate meeting discussion"
                />
            </main>
            <Footer />
        </div>
    );
}
