'use client';

import React from 'react';
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
    ShoppingBag,
    Plus
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
    cta1, 
    cta2, 
    theme = 'light',
    imageUrl,
    imageHint,
    fullImage = false
}: { 
    title: string, 
    subtitle?: string, 
    cta1: string, 
    cta2?: string, 
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    fullImage?: boolean
}) => (
    <section className={cn(
        "relative min-h-[600px] w-full flex flex-col items-center pt-16 text-center overflow-hidden border-b-[12px] border-[#f5f5f7]",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]"
    )}>
        <div className="relative z-10 space-y-2 px-4 max-w-3xl mb-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium mt-1">{subtitle}</p>}
            <div className="flex items-center justify-center gap-6 pt-4">
                <Link href="/login/selection?action=register" className="bg-[#0071e3] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#0077ed] transition-colors">
                    {cta1}
                </Link>
                {cta2 && (
                    <Link href="/about" className="text-[#0066cc] hover:underline flex items-center text-sm font-medium">
                        {cta2} <ChevronRight className="h-4 w-4 ml-0.5" />
                    </Link>
                )}
            </div>
        </div>
        <div className={cn("relative w-full flex-1 min-h-[400px]", fullImage ? "mt-0" : "mt-4")}>
            <Image 
                src={imageUrl} 
                alt={title} 
                fill 
                className={cn("object-contain object-bottom", fullImage && "object-cover")}
                data-ai-hint={imageHint}
            />
        </div>
    </section>
);

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#f5f5f7] selection:bg-primary/30 font-sans">
            <Header />
            
            <main className="pt-12">
                {/* Hero Section */}
                <section className="bg-white py-24 text-center space-y-4 px-4 border-b-[12px] border-[#f5f5f7]">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-[#1d1d1f]">
                        Yok öyle yalnız başına mücadele etmek.
                    </h1>
                    <p className="text-xl md:text-2xl font-medium text-[#1d1d1f]/80 max-w-4xl mx-auto">
                        Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
                    </p>
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="rounded-full px-10 h-12 text-base font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                            <Link href="/login/selection?action=register">Şimdi Katıl</Link>
                        </Button>
                    </div>
                </section>

                {/* iPhone style - imece */}
                <ProductSection 
                    title="hangel imece"
                    subtitle="Gönüllülükte yeni bir boyut."
                    cta1="Gönüllü Ol"
                    cta2="Daha fazla bilgi"
                    imageUrl="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop"
                    imageHint="hands connecting community"
                />

                {/* Watch style - STK */}
                <ProductSection 
                    title="hangel STK"
                    subtitle="Dijitalleşen sivil toplum."
                    theme="dark"
                    cta1="Kuruluşunu Kaydet"
                    cta2="Özellikleri İncele"
                    imageUrl="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                    imageHint="modern minimal office tech"
                    fullImage
                />

                {/* iPad style - bağış */}
                <ProductSection 
                    title="hangel bağışı"
                    subtitle="Alışverişlerinizi iyiliğe dönüştürün."
                    cta1="Markaları Gör"
                    cta2="Nasıl Çalışır?"
                    imageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
                    imageHint="aesthetic lifestyle products"
                />

                {/* Grid Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-3 pb-3 bg-[#f5f5f7]">
                    <section className="relative h-[580px] bg-white rounded-3xl overflow-hidden flex flex-col items-center pt-12 text-center border border-black/5">
                        <div className="relative z-10 space-y-1 px-6">
                            <h3 className="text-3xl font-bold text-[#1d1d1f]">hangel Kampüs</h3>
                            <p className="text-lg text-[#1d1d1f]/80 font-medium">Üniversiteler için sosyal etki ağı.</p>
                            <div className="flex gap-4 justify-center mt-2">
                                <Link href="/contact/universities" className="text-[#0066cc] hover:underline flex items-center text-sm font-medium">
                                    Başvur <ChevronRight className="h-4 w-4 ml-0.5" />
                                </Link>
                            </div>
                        </div>
                        <div className="absolute inset-0 z-0 mt-32 px-12">
                            <div className="relative w-full h-full">
                                <Image 
                                    src="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop" 
                                    alt="Campus" 
                                    fill 
                                    className="object-contain object-bottom" 
                                    data-ai-hint="university students campus"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="relative h-[580px] bg-white rounded-3xl overflow-hidden flex flex-col items-center pt-12 text-center border border-black/5">
                        <div className="relative z-10 space-y-1 px-6">
                            <h3 className="text-3xl font-bold text-[#1d1d1f]">hangel Üye İşyeri</h3>
                            <p className="text-lg text-[#1d1d1f]/80 font-medium">İşletmenizde QR ile ödeme alın.</p>
                            <div className="flex gap-4 justify-center mt-2">
                                <Link href="/merchant" className="text-[#0066cc] hover:underline flex items-center text-sm font-medium">
                                    Detaylı Bilgi <ChevronRight className="h-4 w-4 ml-0.5" />
                                </Link>
                            </div>
                        </div>
                        <div className="absolute inset-0 z-0 mt-32 px-12">
                            <div className="relative w-full h-full">
                                <Image 
                                    src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop" 
                                    alt="Merchant" 
                                    fill 
                                    className="object-contain object-bottom" 
                                    data-ai-hint="business payment qr"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="bg-black text-white pt-16 pb-12 px-4 sm:px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-[12px] text-white/50 space-y-4 pb-10 border-b border-white/10">
                        <p>1. hangel Sosyal Etki Puanı sistemi, platform içi aktivitelerle kazanılan puanları temsil eder ve nakdi değeri yoktur.</p>
                        <p>2. Marka bağış oranları, her markanın kendi taahhüdü doğrultusunda değişiklik gösterebilir.</p>
                        <p>3. Üyelik tamamen ücretsizdir ve kullanıcılardan hiçbir ek işlem bedeli talep edilmez.</p>
                    </div>

                    <div className="py-12 grid grid-cols-1 md:grid-cols-5 gap-10">
                        {[
                            {
                                title: "Keşfedin",
                                links: [
                                    { name: "Market", href: "/market" },
                                    { name: "Gönüllülük", href: "/volunteering" },
                                    { name: "STK'lar", href: "/ngos" },
                                    { name: "Kulüpler", href: "/admin/clubs" },
                                    { name: "Liderlik", href: "/leaderboard" }
                                ]
                            },
                            {
                                title: "Kurumsal",
                                links: [
                                    { name: "Biz Kimiz?", href: "/about" },
                                    { name: "Sosyal Etkimiz", href: "/impact-story" },
                                    { name: "Basın Odası", href: "/press" },
                                    { name: "Yatırımcılar", href: "/yatirimci-iliskileri" },
                                    { name: "İş Fırsatları", href: "#" }
                                ]
                            },
                            {
                                title: "İşbirlikleri",
                                links: [
                                    { name: "Üye İşyeri", href: "/merchant" },
                                    { name: "STK Kaydı", href: "/ngo-onboarding" },
                                    { name: "Kampüs Elçiliği", href: "/contact/universities" },
                                    { name: "Belediyeler", href: "/contact/municipalities" },
                                    { name: "Fonlar", href: "/contact/funds" }
                                ]
                            },
                            {
                                title: "Destek",
                                links: [
                                    { name: "Destek Merkezi", href: "/support" },
                                    { name: "S.S.S", href: "/support/faq" },
                                    { name: "İletişim", href: "/contact" },
                                    { name: "Bilgi Toplumu", href: "/bilgi-toplumu-hizmetleri" },
                                    { name: "Erişilebilirlik", href: "/settings/accessibility" }
                                ]
                            },
                            {
                                title: "Hesabım",
                                links: [
                                    { name: "Giriş Yap", href: "/login/selection?action=login" },
                                    { name: "Kayıt Ol", href: "/login/selection?action=register" },
                                    { name: "Bağışlarım", href: "/my-donations" },
                                    { name: "Başvurularım", href: "/my-applications" }
                                ]
                            }
                        ].map((group) => (
                            <div key={group.title} className="space-y-4">
                                <Accordion type="single" collapsible className="w-full md:hidden">
                                    <AccordionItem value="item-1" className="border-none">
                                        <AccordionTrigger className="text-[12px] font-bold py-2 hover:no-underline uppercase tracking-wider text-white">
                                            {group.title}
                                        </AccordionTrigger>
                                        <AccordionContent className="flex flex-col gap-3 text-[12px] text-white/70">
                                            {group.links.map(link => (
                                                <Link key={link.name} href={link.href}>{link.name}</Link>
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                <div className="hidden md:flex flex-col gap-3">
                                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-white">{group.title}</h4>
                                    <div className="flex flex-col gap-2 text-[12px] text-white/70">
                                        {group.links.map(link => (
                                            <Link key={link.name} href={link.href} className="hover:underline">{link.name}</Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 border-t border-white/10 space-y-8 text-[12px] text-white/50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <span>Telif Hakkı © 2024 Hangel Teknoloji A.Ş. Tüm hakları saklıdır.</span>
                                <div className="flex gap-4">
                                    <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
                                    <span className="text-white/10">|</span>
                                    <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline">Kullanım Şartları</Link>
                                    <span className="text-white/10">|</span>
                                    <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Yasal Bilgiler</Link>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 font-medium hover:text-white cursor-pointer transition-colors">
                                <Globe className="h-3 w-3" /> Türkiye
                            </div>
                        </div>
                        
                        <div className="flex gap-8 items-center justify-center md:justify-start">
                            <Link href="#" className="hover:text-white transition-colors"><XIcon className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Youtube className="h-5 w-5" /></Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
