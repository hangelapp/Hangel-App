'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HangelLogo } from '@/components/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Search, 
    ShoppingBag, 
    Menu, 
    X, 
    ChevronRight, 
    PlayCircle, 
    ArrowUpRight, 
    Globe, 
    ShieldCheck, 
    HeartHandshake, 
    Users, 
    Zap,
    Calendar,
    Plus,
    Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const AppleNav = () => {
    const [isScrolled, setIsMounted] = useState(false);
    
    useEffect(() => {
        const handleScroll = () => setIsMounted(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={cn(
            "fixed top-0 inset-x-0 z-[100] transition-all duration-300 border-b border-transparent",
            isScrolled ? "bg-background/80 backdrop-blur-xl border-border" : "bg-transparent"
        )}>
            <div className="container mx-auto px-4 h-12 flex items-center justify-between">
                <Link href="/" className="hover:opacity-70 transition-opacity">
                    <HangelLogo className="text-xl" />
                </Link>
                <div className="hidden md:flex items-center gap-8 text-[12px] font-medium text-foreground/80">
                    <Link href="/market" className="hover:text-foreground">Market</Link>
                    <Link href="/volunteering" className="hover:text-foreground">Gönüllülük</Link>
                    <Link href="/ngos" className="hover:text-foreground">STK'lar</Link>
                    <Link href="/about" className="hover:text-foreground">Hakkımızda</Link>
                    <Link href="/support" className="hover:text-foreground">Destek</Link>
                </div>
                <div className="flex items-center gap-4">
                    <Search className="h-4 w-4 text-foreground/60 cursor-pointer hover:text-foreground" />
                    <ShoppingBag className="h-4 w-4 text-foreground/60 cursor-pointer hover:text-foreground" />
                    <Menu className="h-4 w-4 md:hidden text-foreground/60" />
                </div>
            </div>
        </nav>
    );
};

const Section = ({ 
    title, 
    subtitle, 
    description, 
    image, 
    imageHint,
    dark = false,
    full = true,
    links = []
}: { 
    title: string; 
    subtitle: string; 
    description?: string; 
    image: string; 
    imageHint: string;
    dark?: boolean;
    full?: boolean;
    links?: { label: string; href: string; primary?: boolean }[]
}) => (
    <section className={cn(
        "relative flex flex-col items-center text-center overflow-hidden",
        full ? "h-[85vh] md:h-[95vh] w-full" : "h-[500px] md:h-[600px] rounded-2xl mx-2 md:mx-4 my-2",
        dark ? "bg-[#000000] text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
    )}>
        <div className={cn("pt-16 md:pt-20 px-6 z-10 space-y-2 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-1000")}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>
            {description && <p className="text-lg md:text-xl opacity-70 mt-4 max-w-xl mx-auto">{description}</p>}
            <div className="flex items-center justify-center gap-6 pt-6">
                {links.map((link, i) => (
                    <Link 
                        key={i} 
                        href={link.href} 
                        className={cn(
                            "text-lg font-medium flex items-center group",
                            link.primary 
                                ? "bg-[#0071e3] text-white px-6 py-2 rounded-full hover:bg-[#0077ed]" 
                                : "text-[#0066cc] hover:underline"
                        )}
                    >
                        {link.label}
                        {!link.primary && <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />}
                    </Link>
                ))}
            </div>
        </div>
        <div className="absolute inset-0 z-0 flex items-end justify-center">
            <div className="relative w-full h-full">
                <Image 
                    src={image} 
                    alt={title} 
                    fill 
                    className="object-cover md:object-contain object-bottom p-0 md:p-12"
                    data-ai-hint={imageHint}
                />
            </div>
        </div>
    </section>
);

const Footer = () => {
    const sections = [
        {
            title: "Keşfet",
            links: [
                { label: "Markalar", href: "/market" },
                { label: "STK'lar", href: "/ngos" },
                { label: "Gönüllülük", href: "/volunteering" },
                { label: "Öğrenci Kulüpleri", href: "/admin/clubs" },
                { label: "Liderlik Tablosu", href: "/leaderboard" },
            ]
        },
        {
            title: "Hesap",
            links: [
                { label: "Hesabını Yönet", href: "/profile" },
                { label: "Hangel Kimliği", href: "/login" },
                { label: "Bağışlarım", href: "/my-donations" },
                { label: "Cüzdanım", href: "/qr-payment" },
            ]
        },
        {
            title: "Kuruluşlar İçin",
            links: [
                { label: "STK Başvurusu", href: "/ngo-onboarding" },
                { label: "Marka Başvurusu", href: "/login/selection?action=register&type=brand" },
                { label: "Üye İşyeri", href: "/merchant" },
                { label: "Üniversite Temsilciliği", href: "/contact/universities" },
            ]
        },
        {
            title: "Hangel Değerleri",
            links: [
                { label: "Erişilebilirlik", href: "/settings/accessibility" },
                { label: "Gizlilik", href: "/settings/privacy" },
                { label: "Şeffaflık", href: "/about" },
                { label: "Sosyal Etki", href: "/impact-story" },
            ]
        },
        {
            title: "Hangel Hakkında",
            links: [
                { label: "Haber Odası", href: "/press" },
                { label: "Yatırımcı İlişkileri", href: "/yatirimci-iliskileri" },
                { label: "Etik İlkeler", href: "/settings/contracts/etik-ilkeler" },
                { label: "İletişim", href: "/about" },
            ]
        }
    ];

    return (
        <footer className="bg-[#f5f5f7] pt-12 pb-8 px-4">
            <div className="container mx-auto max-w-5xl">
                <div className="text-[12px] text-foreground/60 space-y-4 pb-8 border-b">
                    <p>1. hangel bağışı kapsamında Marka tarafından taahhüt edilen bağış oranları, ürün kategorisine ve Marka politikasına göre değişiklik gösterebilir.</p>
                    <p>2. Sosyal Etki Puanı (SEP) sistemi Hangel ekosistemi içerisinde bir itibar göstergesidir ve herhangi bir nakdi karşılığı bulunmamaktadır.</p>
                    <p>3. Gönüllülük başvuruları ilgili STK tarafından değerlendirilir; hangel Hub bu süreçte yalnızca teknik altyapı sağlayıcıdır.</p>
                </div>
                
                <div className="hidden md:grid grid-cols-5 gap-8 py-8">
                    {sections.map((section, i) => (
                        <div key={i} className="space-y-3">
                            <h4 className="text-[12px] font-bold text-foreground/80">{section.title}</h4>
                            <ul className="space-y-2">
                                {section.links.map((link, j) => (
                                    <li key={j}>
                                        <Link href={link.href} className="text-[12px] text-foreground/60 hover:underline">{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="md:hidden py-4">
                    <Accordion type="single" collapsible className="w-full">
                        {sections.map((section, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border-b">
                                <AccordionTrigger className="text-[12px] font-bold py-3 hover:no-underline">{section.title}</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-3 pb-4">
                                        {section.links.map((link, j) => (
                                            <li key={j}>
                                                <Link href={link.href} className="text-[12px] text-foreground/60">{link.label}</Link>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                <div className="pt-8 text-[12px] text-foreground/60 space-y-4">
                    <p>Diğer alışveriş seçenekleri: Bir <Link href="/ngos" className="text-[#0066cc] underline">STK sayfası</Link> bulun veya <Link href="/market" className="text-[#0066cc] underline">anlaşmalı markaları</Link> inceleyin.</p>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t">
                        <p>Telif Hakkı © 2024 Hangel A.Ş. Tüm hakları saklıdır.</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
                            <Link href="/settings/contracts/cerez-politikasi" className="hover:underline">Çerez Kullanımı</Link>
                            <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline">Kullanım Şartları</Link>
                            <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Yasal Bilgiler</Link>
                        </div>
                        <p>Türkiye</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
        <AppleNav />
        
        <main className="pt-12">
            {/* Hero Section */}
            <Section 
                title="Hangel Hub."
                subtitle="İyilik her adımda yanınızda."
                description="Toplumsal fayda için tasarlanmış en güçlü ekosistem. Gönüllü olun, destekleyin ve etkiyi büyütün."
                image="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop"
                imageHint="volunteers teamwork"
                links={[
                    { label: "Şimdi Başla", href: "/login/selection?action=register", primary: true },
                    { label: "Giriş Yap", href: "/login/selection?action=login" }
                ]}
            />

            {/* hangel imece */}
            <Section 
                title="hangel imece"
                subtitle="Yeteneklerinizi iyiliğe dönüştürün."
                image="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop"
                imageHint="happy young people"
                dark
                links={[
                    { label: "Fırsatları Gör", href: "/volunteering" },
                    { label: "Video İzle", href: "#" }
                ]}
            />

            {/* hangel STK */}
            <Section 
                title="hangel STK"
                subtitle="Kuruluşunuz için dijital dönüşüm."
                description="SMS, CRM, Bağış Takibi ve çok daha fazlası STK'lar için tek bir panelde."
                image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                imageHint="modern minimal architecture"
                links={[
                    { label: "STK Olarak Katıl", href: "/ngo-onboarding" },
                    { label: "Özellikleri İncele", href: "/about" }
                ]}
            />

            {/* Grid Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4 px-0 md:px-4 pb-4">
                <Section 
                    full={false}
                    title="hangel bağışı"
                    subtitle="Alışveriş yaparken iyilik yapın."
                    image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
                    imageHint="minimal clothing shop"
                    links={[{ label: "Markaları Keşfet", href: "/market" }]}
                />
                <Section 
                    full={false}
                    title="Üye İşyeri"
                    subtitle="QR Ödeme ile bağış toplayın."
                    image="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2070&auto=format&fit=crop"
                    imageHint="qr code payment store"
                    dark
                    links={[{ label: "Hemen Başvur", href: "/merchant" }]}
                />
                <Section 
                    full={false}
                    title="hangel Kampüs"
                    subtitle="Üniversiteli temsilciler arıyoruz."
                    image="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop"
                    imageHint="university building campus"
                    links={[{ label: "Temsilci Ol", href: "/contact/universities" }]}
                />
                <Section 
                    full={false}
                    title="Şeffaflık"
                    subtitle="Bağışlarınızın yolculuğunu görün."
                    image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
                    imageHint="data analysis charts"
                    links={[{ label: "Raporları İncele", href: "/about" }]}
                />
            </div>
        </main>

        <Footer />
    </div>
  );
}
