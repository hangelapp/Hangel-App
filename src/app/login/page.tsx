
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
    Rocket
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
    <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between">
            <nav className="flex items-center gap-8">
                <Link href="/" className="hover:opacity-70 transition-opacity">
                    <HangelLogo className="text-xl" />
                </Link>
                <div className="hidden md:flex items-center gap-6 text-[12px] font-medium text-[#1d1d1f]/80">
                    <Link href="/market" className="hover:text-primary transition-colors">Market</Link>
                    <Link href="/volunteering" className="hover:text-primary transition-colors">Gönüllülük</Link>
                    <Link href="/ngos" className="hover:text-primary transition-colors">STK'lar</Link>
                    <Link href="/about" className="hover:text-primary transition-colors">Hakkımızda</Link>
                </div>
            </nav>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80">
                    <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80 md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
                <Button asChild size="sm" className="rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold h-7 px-4 text-xs">
                    <Link href="/login/selection?action=login">Giriş Yap</Link>
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
        "relative h-[80vh] min-h-[600px] w-full flex flex-col items-center pt-20 text-center overflow-hidden",
        theme === 'dark' ? "bg-black text-white" : "bg-[#fafafa] text-[#1d1d1f]"
    )}>
        <div className="relative z-10 space-y-2 px-4 max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium">{subtitle}</p>}
            {description && <p className="text-lg opacity-70 mt-4">{description}</p>}
            <div className="flex items-center justify-center gap-6 pt-4">
                <Link href="/login/selection?action=register" className="text-[#0066cc] hover:underline flex items-center font-medium text-lg">
                    {cta1} <ChevronRight className="h-5 w-5" />
                </Link>
                {cta2 && (
                    <Link href="/about" className="text-[#0066cc] hover:underline flex items-center font-medium text-lg">
                        {cta2} <ChevronRight className="h-5 w-5" />
                    </Link>
                )}
            </div>
        </div>
        <div className="absolute inset-0 z-0">
            <Image 
                src={imageUrl} 
                alt={title} 
                fill 
                className="object-cover object-center opacity-90 transition-transform duration-1000 ease-out"
                data-ai-hint={imageHint}
            />
            {overlay && <div className={cn("absolute inset-0", theme === 'dark' ? "bg-black/20" : "bg-white/10")} />}
        </div>
    </section>
);

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-white selection:bg-primary/30 font-sans">
            <Header />
            
            <main className="pt-12">
                {/* Hero Section */}
                <section className="bg-white py-20 text-center space-y-4 px-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-[#1d1d1f]">Yok öyle yalnız başına mücadele etmek.</h1>
                    <p className="text-xl md:text-3xl font-medium text-[#1d1d1f]/80 max-w-3xl mx-auto">
                        Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
                    </p>
                    <div className="pt-6">
                        <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                            <Link href="/login/selection?action=register">Hemen Katıl</Link>
                        </Button>
                    </div>
                </section>

                {/* Feature Sections */}
                <div className="space-y-3 px-3 pb-3">
                    <ProductSection 
                        title="hangel imece"
                        subtitle="Gönüllülükte yeni bir boyut."
                        description="Yeteneklerinizi toplumsal fayda için kullanın, Sosyal Etki Puanı kazanın."
                        cta1="Gönüllü Ol"
                        cta2="Daha Fazla Bilgi"
                        imageUrl="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop"
                        imageHint="volunteers teamwork"
                    />

                    <ProductSection 
                        title="hangel STK"
                        subtitle="Dijitalleşen sivil toplum."
                        description="Yönetim araçları, şeffaflık endeksi ve bağışçı yönetimi tek bir panelde."
                        theme="dark"
                        cta1="Kuruluşunu Kaydet"
                        cta2="Özellikleri Keşfet"
                        imageUrl="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                        imageHint="modern office building dark"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <section className="relative h-[600px] bg-[#fafafa] rounded-3xl overflow-hidden flex flex-col items-center pt-16 text-center group">
                            <div className="relative z-10 space-y-2 px-6">
                                <h3 className="text-3xl md:text-4xl font-bold text-[#1d1d1f]">hangel bağışı</h3>
                                <p className="text-lg text-[#1d1d1f]/60">Alışverişlerinizi iyiliğe dönüştürün.</p>
                                <Link href="/market" className="text-[#0066cc] hover:underline flex items-center justify-center font-medium mt-2">
                                    Markaları Gör <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                            <div className="absolute inset-0 z-0">
                                <Image 
                                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" 
                                    alt="Market" 
                                    fill 
                                    className="object-cover group-hover:scale-105 transition-transform" 
                                    style={{ transitionDuration: '1000ms' }}
                                    data-ai-hint="luxury retail store"
                                />
                            </div>
                        </section>

                        <section className="relative h-[600px] bg-black text-white rounded-3xl overflow-hidden flex flex-col items-center pt-16 text-center group">
                            <div className="relative z-10 space-y-2 px-6">
                                <h3 className="text-3xl md:text-4xl font-bold">hangel Kampüs</h3>
                                <p className="text-lg text-white/60">Üniversiteler için sosyal etki ağı.</p>
                                <Link href="/contact/universities" className="text-[#0066cc] hover:underline flex items-center justify-center font-medium mt-2">
                                    Başvuru Yap <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                            <div className="absolute inset-0 z-0">
                                <Image 
                                    src="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop" 
                                    alt="Campus" 
                                    fill 
                                    className="object-cover opacity-60 group-hover:scale-105 transition-transform" 
                                    style={{ transitionDuration: '1000ms' }}
                                    data-ai-hint="university students"
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-12 pb-8">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="text-[12px] text-[#1d1d1f]/60 space-y-4 pb-8 border-b border-[#d2d2d7]">
                        <p>1. hangel Sosyal Etki Puanı sistemi, platform içi aktivitelerle kazanılan puanları temsil eder ve nakdi değeri yoktur.</p>
                        <p>2. Marka bağış oranları, her markanın kendi taahhüdü doğrultusunda değişiklik gösterebilir.</p>
                        <p>3. Üyelik tamamen ücretsizdir ve kullanıcılardan hiçbir ek işlem bedeli talep edilmez.</p>
                    </div>

                    <div className="py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-8">
                            <Accordion type="single" collapsible className="w-full md:hidden">
                                <AccordionItem value="item-1" className="border-none">
                                    <AccordionTrigger className="text-[12px] font-bold py-2 hover:no-underline uppercase tracking-wider">Keşfedin</AccordionTrigger>
                                    <AccordionContent className="flex flex-col gap-3 text-[12px] text-[#1d1d1f]/80">
                                        <Link href="/market">Market</Link>
                                        <Link href="/volunteering">Gönüllülük</Link>
                                        <Link href="/ngos">STK'lar</Link>
                                        <Link href="/admin/clubs">Kulüpler</Link>
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
                                        <Link href="/about">Biz Kimiz?</Link>
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
                                    <AccordionTrigger className="text-[12px] font-bold py-2 hover:no-underline uppercase tracking-wider">Yardım</AccordionTrigger>
                                    <AccordionContent className="flex flex-col gap-3 text-[12px] text-[#1d1d1f]/80">
                                        <Link href="/support">Destek Merkezi</Link>
                                        <Link href="/support/faq">S.S.S</Link>
                                        <Link href="/contact">Bize Ulaşın</Link>
                                        <Link href="/merchant">Üye İşyeri Başvurusu</Link>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                            <div className="hidden md:flex flex-col gap-3">
                                <h4 className="text-[12px] font-bold uppercase tracking-wider">Yardım</h4>
                                <div className="flex flex-col gap-2 text-[12px] text-[#1d1d1f]/80">
                                    <Link href="/support" className="hover:underline">Destek Merkezi</Link>
                                    <Link href="/support/faq" className="hover:underline">S.S.S</Link>
                                    <Link href="/contact" className="hover:underline">Bize Ulaşın</Link>
                                    <Link href="/merchant" className="hover:underline">Üye İşyeri Başvurusu</Link>
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

                    <div className="pt-8 border-t border-[#d2d2d7] space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex flex-wrap gap-4 text-[12px] text-[#1d1d1f]/60">
                                <span>Telif Hakkı © 2024 Hangel Teknoloji A.Ş. Tüm hakları saklıdır.</span>
                                <div className="flex gap-3">
                                    <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
                                    <span className="text-[#d2d2d7]">|</span>
                                    <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline">Kullanım Şartları</Link>
                                    <span className="text-[#d2d2d7]">|</span>
                                    <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[12px] font-medium hover:underline cursor-pointer">
                                <Globe className="h-3 w-3" /> Türkiye
                            </div>
                        </div>
                        
                        <div className="flex gap-6 items-center justify-center md:justify-start">
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
