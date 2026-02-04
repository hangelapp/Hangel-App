'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Menu, 
    Search,
    ChevronRight,
    Globe,
    Instagram,
    Facebook,
    Linkedin,
    Youtube,
    MapPin,
    ArrowRight,
    X,
    Calendar,
    Megaphone,
    Users,
    Award,
    ShieldCheck,
    Heart,
    Zap,
    Store,
    Rocket,
    ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const Header = () => (
    <header className="fixed top-0 inset-x-0 z-[100] bg-[#f5f5f7]/80 backdrop-blur-md border-b border-black/5">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
            <nav className="flex items-center gap-8">
                <Link href="/" className="hover:opacity-70 transition-opacity">
                    <HangelLogo className="text-xl text-[#1d1d1f]" />
                </Link>
                <div className="hidden md:flex items-center gap-8 text-[12px] font-medium text-[#1d1d1f]/80">
                    <Link href="/market" className="hover:text-primary transition-colors">Market</Link>
                    <Link href="/volunteering" className="hover:text-primary transition-colors">Gönüllülük</Link>
                    <Link href="/ngos" className="hover:text-primary transition-colors">STK'lar</Link>
                    <Link href="/about" className="hover:text-primary transition-colors">Hakkımızda</Link>
                </div>
            </nav>
            <div className="flex items-center gap-6">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80">
                    <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80">
                    <ShoppingBag className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80 md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
            </div>
        </div>
    </header>
);

const ProductSection = ({ 
    title, 
    subtitle, 
    description, 
    cta1, 
    cta2, 
    theme = 'light',
    imageUrl,
    imageHint,
    overlay = true
}: { 
    title: string, 
    subtitle?: string, 
    description?: string, 
    cta1: string, 
    cta2?: string, 
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    overlay?: boolean
}) => (
    <section className={cn(
        "relative h-[85vh] min-h-[600px] w-full flex flex-col items-center pt-20 text-center overflow-hidden",
        theme === 'dark' ? "bg-black text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
    )}>
        <div className="relative z-10 space-y-2 px-4 max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium mt-2">{subtitle}</p>}
            {description && <p className="text-lg opacity-70 mt-4 max-w-2xl mx-auto">{description}</p>}
            <div className="flex items-center justify-center gap-6 pt-6">
                <Link href="/login/selection?action=register" className="bg-[#0071e3] text-white px-6 py-2 rounded-full font-medium hover:bg-[#0077ed] transition-colors">
                    {cta1}
                </Link>
                {cta2 && (
                    <Link href="/about" className="text-[#0066cc] hover:underline flex items-center font-medium">
                        {cta2} <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                )}
            </div>
        </div>
        <div className="absolute inset-0 z-0 mt-20">
            <Image 
                src={imageUrl} 
                alt={title} 
                fill 
                className="object-contain object-bottom opacity-90 transition-transform duration-1000 ease-out"
                data-ai-hint={imageHint}
            />
            {overlay && <div className={cn("absolute inset-0", theme === 'dark' ? "bg-black/10" : "bg-[#f5f5f7]/5")} />}
        </div>
    </section>
);

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#f5f5f7] selection:bg-primary/30 font-sans">
            <Header />
            
            <main className="pt-12 space-y-3 px-0 sm:px-0">
                {/* Hero Section */}
                <section className="bg-white py-24 text-center space-y-4 px-4 border-b border-black/5">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-[#1d1d1f]">
                        Yok öyle yalnız başına mücadele etmek.
                    </h1>
                    <p className="text-xl md:text-3xl font-medium text-[#1d1d1f]/80 max-w-4xl mx-auto">
                        Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
                    </p>
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="rounded-full px-10 h-12 text-base font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                            <Link href="/login/selection?action=register">Şimdi Katıl</Link>
                        </Button>
                        <Link href="/about" className="text-[#0066cc] hover:underline flex items-center font-medium text-lg">
                            Daha fazla bilgi <ChevronRight className="h-5 w-5 ml-1" />
                        </Link>
                    </div>
                </section>

                {/* Feature Sections */}
                <div className="space-y-3">
                    <ProductSection 
                        title="hangel imece"
                        subtitle="Gönüllülükte yeni bir boyut."
                        description="Yeteneklerinizi toplumsal fayda için kullanın, Sosyal Etki Puanı kazanın. Teknoloji ile iyiliği birleştiriyoruz."
                        cta1="Gönüllü Ol"
                        cta2="İlanları Keşfet"
                        imageUrl="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop"
                        imageHint="volunteers using technology"
                    />

                    <ProductSection 
                        title="hangel STK"
                        subtitle="Dijitalleşen sivil toplum."
                        description="Şeffaflık endeksi, bağışçı yönetimi ve kurumsal araçlar tek bir panelde. STK'lar için tam donanımlı dijital ofis."
                        theme="dark"
                        cta1="Kuruluşunu Kaydet"
                        cta2="Özellikleri İncele"
                        imageUrl="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                        imageHint="modern office professional environment dark"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-3">
                        <section className="relative h-[650px] bg-white rounded-3xl overflow-hidden flex flex-col items-center pt-16 text-center group border border-black/5">
                            <div className="relative z-10 space-y-2 px-6">
                                <h3 className="text-3xl md:text-4xl font-bold text-[#1d1d1f]">hangel bağışı</h3>
                                <p className="text-lg text-[#1d1d1f]/60">Alışverişlerinizi iyiliğe dönüştürün.</p>
                                <Link href="/market" className="text-[#0066cc] hover:underline flex items-center justify-center font-medium mt-4">
                                    Markaları Gör <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                            </div>
                            <div className="absolute inset-0 z-0 mt-40 px-8">
                                <div className="relative w-full h-full">
                                    <Image 
                                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" 
                                        alt="Market" 
                                        fill 
                                        className="object-contain object-bottom group-hover:scale-105 transition-transform duration-1000" 
                                        data-ai-hint="luxury lifestyle shopping"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="relative h-[650px] bg-black text-white rounded-3xl overflow-hidden flex flex-col items-center pt-16 text-center group">
                            <div className="relative z-10 space-y-2 px-6">
                                <h3 className="text-3xl md:text-4xl font-bold">hangel Kampüs</h3>
                                <p className="text-lg text-white/60">Üniversiteler için sosyal etki ağı.</p>
                                <Link href="/contact/universities" className="text-[#0066cc] hover:underline flex items-center justify-center font-medium mt-4">
                                    Kampüsüne Taşı <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                            </div>
                            <div className="absolute inset-0 z-0 mt-40 px-8">
                                <div className="relative w-full h-full">
                                    <Image 
                                        src="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop" 
                                        alt="Campus" 
                                        fill 
                                        className="object-contain object-bottom opacity-80 group-hover:scale-105 transition-transform duration-1000" 
                                        data-ai-hint="university campus life students"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-12 pb-8 px-4 sm:px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-[12px] text-[#1d1d1f]/60 space-y-4 pb-8 border-b border-[#d2d2d7]">
                        <p>1. hangel Sosyal Etki Puanı sistemi, platform içi aktivitelerle kazanılan puanları temsil eder ve nakdi değeri yoktur.</p>
                        <p>2. Marka bağış oranları, her markanın kendi taahhüdü doğrultusunda değişiklik gösterebilir.</p>
                        <p>3. Üyelik tamamen ücretsizdir ve kullanıcılardan hiçbir ek işlem bedeli talep edilmez.</p>
                    </div>

                    <div className="py-10 grid grid-cols-1 md:grid-cols-5 gap-8">
                        <div className="space-y-8">
                            <Accordion type="single" collapsible className="w-full md:hidden">
                                <AccordionItem value="item-1" className="border-none">
                                    <AccordionTrigger className="text-[12px] font-bold py-2 hover:no-underline uppercase tracking-wider">Keşfedin</AccordionTrigger>
                                    <AccordionContent className="flex flex-col gap-3 text-[12px] text-[#1d1d1f]/80">
                                        <Link href="/market">Market</Link>
                                        <Link href="/volunteering">Gönüllülük</Link>
                                        <Link href="/ngos">STK'lar</Link>
                                        <Link href="/admin/clubs">Öğrenci Kulüpleri</Link>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                            <div className="hidden md:flex flex-col gap-3">
                                <h4 className="text-[12px] font-bold uppercase tracking-wider">Keşfedin</h4>
                                <div className="flex flex-col gap-2 text-[12px] text-[#1d1d1f]/80">
                                    <Link href="/market" className="hover:underline">Market</Link>
                                    <Link href="/volunteering" className="hover:underline">Gönüllülük</Link>
                                    <Link href="/ngos" className="hover:underline">STK'lar</Link>
                                    <Link href="/admin/clubs" className="hover:underline">Kulüpler</Link>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <Accordion type="single" collapsible className="w-full md:hidden">
                                <AccordionItem value="item-2" className="border-none">
                                    <AccordionTrigger className="text-[12px] font-bold py-2 hover:no-underline uppercase tracking-wider">Kurumsal</AccordionTrigger>
                                    <AccordionContent className="flex flex-col gap-3 text-[12px] text-[#1d1d1f]/80">
                                        <Link href="/about">Hakkımızda</Link>
                                        <Link href="/impact-story">Sosyal Etkimiz</Link>
                                        <Link href="/press">Basın Odası</Link>
                                        <Link href="/yatirimci-iliskileri">Yatırımcı İlişkileri</Link>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                            <div className="hidden md:flex flex-col gap-3">
                                <h4 className="text-[12px] font-bold uppercase tracking-wider">Kurumsal</h4>
                                <div className="flex flex-col gap-2 text-[12px] text-[#1d1d1f]/80">
                                    <Link href="/about" className="hover:underline">Biz Kimiz?</Link>
                                    <Link href="/impact-story" className="hover:underline">Sosyal Etkimiz</Link>
                                    <Link href="/press" className="hover:underline">Basın Odası</Link>
                                    <Link href="/yatirimci-iliskileri" className="hover:underline">Yatırımcı İlişkileri</Link>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <Accordion type="single" collapsible className="w-full md:hidden">
                                <AccordionItem value="item-3" className="border-none">
                                    <AccordionTrigger className="text-[12px] font-bold py-2 hover:no-underline uppercase tracking-wider">İşbirlikleri</AccordionTrigger>
                                    <AccordionContent className="flex flex-col gap-3 text-[12px] text-[#1d1d1f]/80">
                                        <Link href="/merchant">Üye İşyeri</Link>
                                        <Link href="/ngo-onboarding">STK Kaydı</Link>
                                        <Link href="/contact/universities">Kampüs Elçiliği</Link>
                                        <Link href="/contact/municipalities">Belediye İşbirliği</Link>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                            <div className="hidden md:flex flex-col gap-3">
                                <h4 className="text-[12px] font-bold uppercase tracking-wider">İşbirlikleri</h4>
                                <div className="flex flex-col gap-2 text-[12px] text-[#1d1d1f]/80">
                                    <Link href="/merchant" className="hover:underline">Üye İşyeri</Link>
                                    <Link href="/ngo-onboarding" className="hover:underline">STK Kaydı</Link>
                                    <Link href="/contact/universities" className="hover:underline">Kampüs Elçiliği</Link>
                                    <Link href="/contact/municipalities" className="hover:underline">Belediye İşbirliği</Link>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <Accordion type="single" collapsible className="w-full md:hidden">
                                <AccordionItem value="item-4" className="border-none">
                                    <AccordionTrigger className="text-[12px] font-bold py-2 hover:no-underline uppercase tracking-wider">Destek</AccordionTrigger>
                                    <AccordionContent className="flex flex-col gap-3 text-[12px] text-[#1d1d1f]/80">
                                        <Link href="/support">Destek Merkezi</Link>
                                        <Link href="/support/faq">S.S.S</Link>
                                        <Link href="/contact">İletişim</Link>
                                        <Link href="/bilgi-toplumu-hizmetleri">Bilgi Toplumu</Link>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                            <div className="hidden md:flex flex-col gap-3">
                                <h4 className="text-[12px] font-bold uppercase tracking-wider">Destek</h4>
                                <div className="flex flex-col gap-2 text-[12px] text-[#1d1d1f]/80">
                                    <Link href="/support" className="hover:underline">Destek Merkezi</Link>
                                    <Link href="/support/faq" className="hover:underline">S.S.S</Link>
                                    <Link href="/contact" className="hover:underline">İletişim</Link>
                                    <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu</Link>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex flex-col gap-3">
                                <h4 className="text-[12px] font-bold uppercase tracking-wider">Hesabım</h4>
                                <div className="flex flex-col gap-2 text-[12px] text-[#1d1d1f]/80">
                                    <Link href="/login/selection?action=login" className="hover:underline">Giriş Yap</Link>
                                    <Link href="/login/selection?action=register" className="hover:underline">Kayıt Ol</Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[#d2d2d7] space-y-6 text-[12px] text-[#1d1d1f]/60">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex flex-wrap gap-4">
                                <span>Telif Hakkı © 2024 Hangel Teknoloji A.Ş. Tüm hakları saklıdır.</span>
                                <div className="flex gap-3">
                                    <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
                                    <span className="text-[#d2d2d7]">|</span>
                                    <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline">Kullanım Şartları</Link>
                                    <span className="text-[#d2d2d7]">|</span>
                                    <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Yasal Bilgiler</Link>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[12px] font-medium hover:underline cursor-pointer">
                                <Globe className="h-3 w-3" /> Türkiye
                            </div>
                        </div>
                        
                        <div className="flex gap-6 items-center justify-center md:justify-start pt-4">
                            <Link href="#" className="hover:opacity-70 transition-opacity"><XIcon className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:opacity-70 transition-opacity"><Instagram className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:opacity-70 transition-opacity"><Facebook className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:opacity-70 transition-opacity"><Linkedin className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:opacity-70 transition-opacity"><Youtube className="h-5 w-5" /></Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
