'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, ChevronRight, Globe, ShoppingBag, HeartHandshake, Check, Siren, ChevronDown, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { allEntityLists } from '@/lib/data';
import type { Brand } from '@/lib/types';

const languages = ["Türkçe", "English", "Mandarin Chinese", "Español", "Français"];

const Header = () => {
    const [currentLang, setCurrentLang] = useState("Türkçe");
    const { toast } = useToast();

    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-[#f5f5f7]/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl relative">
                <div className="w-8 h-8" /> 

                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-[12px] font-medium text-[#1d1d1f]/80">
                    <Link href="/market" className="hover:text-primary transition-colors uppercase tracking-tight">Bağış</Link>
                    <Link href="/volunteering" className="hover:text-primary transition-colors uppercase tracking-tight">Gönüllülük</Link>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-[#1d1d1f]/80"
                        onClick={() => toast({ title: "Arama", description: "Arama özelliği yakında eklenecek!" })}
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-0">
                        <Link href="/volunteering">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80">
                                <HeartHandshake className="h-4 w-4" />
                            </Button>
                        </Link>

                        <Link href="/market">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80">
                                <ShoppingBag className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <Link href="/emergency">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                <Siren className="h-4 w-4" />
                            </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 px-2 gap-1 text-[11px] font-medium text-[#1d1d1f]/80">
                                    <Globe className="h-4 w-4" />
                                    <span className="hidden sm:inline">{currentLang}</span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                                {languages.map(lang => (
                                    <DropdownMenuItem key={lang} onClick={() => setCurrentLang(lang)}>
                                        {lang}
                                        {currentLang === lang && <Check className="ml-auto h-3 w-3 text-primary" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80 md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
};

const PlaceHolderImages: any[] = [];

const GridItem = ({ 
    title, 
    subtitle, 
    cta1, 
    cta1Href = "/login/selection?action=register",
    cta2, 
    cta2Href = "/about",
    theme = 'light',
    imageUrl,
    imageHint,
    className
}: { 
    title: string, 
    subtitle?: string, 
    cta1: string, 
    cta1Href?: string,
    cta2?: string, 
    cta2Href?: string,
    theme?: 'light' | 'dark' | 'primary',
    imageUrl?: string,
    imageHint?: string,
    className?: string
}) => {
    const isLight = theme === 'light';
    const isPrimary = theme === 'primary';

    return (
        <section className={cn(
            "relative h-[680px] rounded-[2.5rem] overflow-hidden flex flex-col items-center pt-12 text-center border border-black/5",
            theme === 'dark' ? "bg-black text-white" : isPrimary ? "bg-primary text-white border-primary/10" : "bg-white text-[#1d1d1f]",
            className
        )}>
            <div className="relative z-10 space-y-1 px-6 mb-8">
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h3>
                {subtitle && <p className="text-lg md:text-xl font-medium opacity-90">{subtitle}</p>}
                <div className="flex items-center justify-center gap-4 pt-4">
                    <Link href={cta1Href} className={cn(
                        "hover:underline flex items-center text-sm md:text-base font-bold",
                        isLight ? "text-primary" : "text-white"
                    )}>
                        {cta1} <ChevronRight className="h-4 w-4 ml-0.5" />
                    </Link>
                    {cta2 && (
                        <Link href={cta2Href} className={cn(
                            "hover:underline flex items-center text-sm md:text-base font-bold",
                            isLight ? "text-primary" : "text-white"
                        )}>
                            {cta2} <ChevronRight className="h-4 w-4 ml-0.5" />
                        </Link>
                    )}
                </div>
            </div>
            <div className="relative w-full flex-1 flex items-center justify-center pb-12 px-6">
                <div className={cn(
                    "w-full max-w-[420px] aspect-square relative rounded-[3rem] overflow-hidden shadow-2xl",
                    theme === 'dark' ? "border border-white/10" : isPrimary ? "border border-white/20" : "border border-black/5"
                )}>
                    {imageUrl && (
                        <Image 
                            src={imageUrl} 
                            alt={title} 
                            fill 
                            className={cn(
                                "object-cover",
                                isPrimary && "opacity-40 brightness-75"
                            )}
                            data-ai-hint={imageHint}
                        />
                    )}
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    const footerGroups = [
        { title: "Keşfedin", links: [{label: "Market", href: "/market"}, {label: "Gönüllülük", href: "/volunteering"}, {label: "STK'lar", href: "/ngos"}, {label: "Kulüpler", href: "/admin/clubs"}, {label: "Kütüphane", href: "/library"}] },
        { title: "Kurumsal", links: [{label: "Biz Kimiz?", href: "/about"}, {label: "Sosyal Etkimiz", href: "/social-impact"}, {label: "Basın Odası", href: "/press"}, {label: "Kariyer", href: "/careers"}] },
        { title: "İşbirlikleri", links: [{label: "Üye İşyeri ol", href: "/merchant"}, {label: "STK Kaydı", href: "/ngo-onboarding"}] },
        { title: "hangel Derneği", links: [{label: "Dernek Hakkında", href: "/hangelassociation/about"}, {label: "Mevzuat Taslağı", href: "/hangelassociation/legislation"}] },
        { title: "Hesabım", links: [{label: "Giriş Yap", href: "/login/selection?action=login"}, {label: "Destek Merkezi", href: "/support"}] },
    ];

    return (
        <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-8 pb-12 px-4 sm:px-6 border-t border-black/5 font-sans">
            <div className="container mx-auto max-w-5xl">
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
        <div className="min-h-screen bg-[#f5f5f7] selection:bg-primary/30 font-sans">
            <Header />
            
            <main className="pt-12">
                <section className="bg-[#f5f5f7] pt-24 pb-12 text-center space-y-4 px-4 border-b-[12px] border-[#f5f5f7]">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f]">
                            Yok öyle yalnız başına mücadele etmek.
                        </h1>
                        <p className="text-xl md:text-3xl font-medium text-[#1d1d1f]/80 max-w-4xl mx-auto">
                            Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
                        </p>
                    </div>
                    <div className="pt-8">
                        <Button asChild size="lg" className="rounded-full px-10 h-12 text-base font-bold bg-primary hover:bg-primary/90">
                            <Link href="/login/selection?action=register">Şimdi Katıl</Link>
                        </Button>
                    </div>
                </section>

                <section className="bg-white pt-16 pb-24 text-center border-b-[12px] border-[#f5f5f7] overflow-hidden">
                    <div className="space-y-2 px-4 max-w-3xl mx-auto mb-12">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">hangel bağış</h2>
                        <p className="text-xl md:text-2xl font-medium text-[#1d1d1f]/80">Alışverişi iyiliğe dönüştürün.</p>
                    </div>
                    
                    <div className="relative w-full overflow-x-auto no-scrollbar pb-8">
                        <div className="flex gap-6 px-8 md:justify-start min-w-max">
                            {allEntityLists.slice(0, 10).map((brand) => (
                                <Link href={`/market/${brand.id}`} key={brand.id} className="relative bg-[#f5f5f7] rounded-[2rem] p-8 flex flex-col items-start text-left w-64 h-80 transition-all hover:shadow-2xl group border border-black/5">
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <ShoppingBag className="h-6 w-6" />
                                    </div>
                                    <div className="relative w-24 h-24 mb-6">
                                        <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="space-y-1 mb-4">
                                        <h4 className="font-bold text-xl leading-tight text-[#1d1d1f]">{brand.name}</h4>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-black/5 w-full">
                                        <div className="text-2xl font-black text-primary">%{brand.donationRate}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center mt-8">
                        <Button asChild variant="outline" className="rounded-full px-10 h-12 text-base font-bold border-black/10 hover:bg-black/5">
                            <Link href="/market">Tümünü Gör</Link>
                        </Button>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-3 pb-3 bg-[#f5f5f7]">
                    <GridItem title="hangel STK" subtitle="Dijitalleşen sivil toplum araçları." theme="dark" cta1="Kuruluşunu Kaydet" cta1Href="/ngo-onboarding" imageUrl={PlaceHolderImages.find(img => img.id === 'stk-illustration')?.imageUrl} imageHint="charcoal charity drawing" />
                    <GridItem title="hangel Kampüs" subtitle="Üniversiteler için sosyal etki ağı." cta1="Avantajları Gör" cta1Href="/campus-advantages" theme="dark" imageUrl={PlaceHolderImages.find(img => img.id === 'campus-poster-1')?.imageUrl} imageHint="minimalist university conference poster" />
                </div>
            </main>

            <Footer />
        </div>
    );
}
