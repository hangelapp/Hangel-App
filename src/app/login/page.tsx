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
    Plus,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
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

const FullWidthSection = ({ 
    title, 
    subtitle, 
    cta1, 
    cta2, 
    theme = 'light',
    imageUrl,
    imageHint,
    className
}: { 
    title: string, 
    subtitle?: string, 
    cta1: string, 
    cta2?: string, 
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    className?: string
}) => (
    <section className={cn(
        "relative h-[600px] md:h-[700px] w-full flex flex-col items-center pt-16 text-center overflow-hidden border-b-[12px] border-[#f5f5f7]",
        theme === 'dark' ? "bg-black text-white" : "bg-[#f5f5f7] text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-2 px-4 max-w-3xl mb-12">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-xl md:text-2xl font-medium mt-1">{subtitle}</p>}
            <div className="flex items-center justify-center gap-6 pt-4">
                <Link href="/login/selection?action=register" className="bg-[#0071e3] text-white px-6 py-2.5 rounded-full text-base font-medium hover:bg-[#0077ed] transition-colors">
                    {cta1}
                </Link>
                {cta2 && (
                    <Link href="/about" className="text-[#0066cc] hover:underline flex items-center text-lg font-medium">
                        {cta2} <ChevronRight className="h-5 w-5 ml-0.5" />
                    </Link>
                )}
            </div>
        </div>
        <div className="relative w-full flex-1 min-h-0">
            <Image 
                src={imageUrl} 
                alt={title} 
                fill 
                className="object-contain object-bottom"
                data-ai-hint={imageHint}
            />
        </div>
    </section>
);

const GridItem = ({ 
    title, 
    subtitle, 
    cta1, 
    cta2, 
    theme = 'light',
    imageUrl,
    imageHint,
    className
}: { 
    title: string, 
    subtitle?: string, 
    cta1: string, 
    cta2?: string, 
    theme?: 'light' | 'dark',
    imageUrl: string,
    imageHint: string,
    className?: string
}) => (
    <section className={cn(
        "relative h-[580px] rounded-3xl overflow-hidden flex flex-col items-center pt-12 text-center border border-black/5",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-[#1d1d1f]",
        className
    )}>
        <div className="relative z-10 space-y-1 px-6 mb-8">
            <h3 className="text-3xl font-bold tracking-tight">{title}</h3>
            {subtitle && <p className="text-lg font-medium opacity-90">{subtitle}</p>}
            <div className="flex items-center justify-center gap-4 pt-3">
                <Link href="/login/selection?action=register" className="text-[#0066cc] hover:underline flex items-center text-sm font-bold">
                    {cta1} <ChevronRight className="h-4 w-4 ml-0.5" />
                </Link>
                {cta2 && (
                    <Link href="/about" className="text-[#0066cc] hover:underline flex items-center text-sm font-bold">
                        {cta2} <ChevronRight className="h-4 w-4 ml-0.5" />
                    </Link>
                )}
            </div>
        </div>
        <div className="relative w-full flex-1">
            <Image 
                src={imageUrl} 
                alt={title} 
                fill 
                className="object-contain object-bottom px-12"
                data-ai-hint={imageHint}
            />
        </div>
    </section>
);

const Footer = () => (
    <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-8 pb-12 px-4 sm:px-6 border-t border-black/5 font-sans">
        <div className="container mx-auto max-w-5xl">
            {/* Apple-style Breadcrumb */}
            <div className="flex items-center gap-2 text-[12px] text-[#1d1d1f]/60 mb-6 px-1">
                <Link href="/" className="hover:text-[#1d1d1f] transition-colors">
                    <HangelLogo className="text-base scale-90 grayscale opacity-70" />
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[#1d1d1f]/80">Yasal Bilgiler</span>
            </div>

            {/* Apple-style Accordion Sections (Mobile) */}
            <div className="md:hidden">
                <Accordion type="single" collapsible className="w-full">
                    {[
                        { title: "Keşfedin", links: ["Market", "Gönüllülük", "STK'lar", "Kulüpler", "Liderlik"] },
                        { title: "Kurumsal", links: ["Biz Kimiz?", "Sosyal Etkimiz", "Basın Odası", "Yatırımcılar", "İş Fırsatları"] },
                        { title: "İşbirlikleri", links: ["Üye İşyeri", "STK Kaydı", "Kampüs Elçiliği", "Belediyeler", "Fonlar"] },
                        { title: "Destek", links: ["Destek Merkezi", "S.S.S", "İletişim", "Bilgi Toplumu", "Erişilebilirlik"] },
                        { title: "Hesabım", links: ["Giriş Yap", "Kayıt Ol", "Bağışlarım", "Başvurularım"] },
                    ].map((group) => (
                        <AccordionItem key={group.title} value={group.title} className="border-b border-black/10">
                            <AccordionTrigger className="text-[12px] font-bold py-3 hover:no-underline uppercase tracking-tight text-[#1d1d1f]/80">
                                {group.title}
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2.5 pb-4 pt-1">
                                {group.links.map(link => (
                                    <Link key={link} href="#" className="text-[12px] text-[#1d1d1f]/70 hover:underline">{link}</Link>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

            {/* Apple-style Columns (Desktop) */}
            <div className="hidden md:grid grid-cols-5 gap-8 border-b border-black/10 pb-8">
                {[
                    { title: "Keşfedin", links: ["Market", "Gönüllülük", "STK'lar", "Kulüpler", "Liderlik"] },
                    { title: "Kurumsal", links: ["Biz Kimiz?", "Sosyal Etkimiz", "Basın Odası", "Yatırımcılar", "İş Fırsatları"] },
                    { title: "İşbirlikleri", links: ["Üye İşyeri", "STK Kaydı", "Kampüs Elçiliği", "Belediyeler", "Fonlar"] },
                    { title: "Destek", links: ["Destek Merkezi", "S.S.S", "İletişim", "Bilgi Toplumu", "Erişilebilirlik"] },
                    { title: "Hesabım", links: ["Giriş Yap", "Kayıt Ol", "Bağışlarım", "Başvurularım"] },
                ].map((group) => (
                    <div key={group.title} className="space-y-3">
                        <h4 className="text-[12px] font-bold uppercase tracking-tight text-[#1d1d1f]/80">{group.title}</h4>
                        <div className="flex flex-col gap-2">
                            {group.links.map(link => (
                                <Link key={link} href="#" className="text-[12px] text-[#1d1d1f]/70 hover:underline">{link}</Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Apple-style Bottom Row */}
            <div className="pt-6 space-y-4">
                <p className="text-[12px] text-[#1d1d1f]/50 leading-relaxed">
                    Diğer alışveriş seçenekleri: Yakınınızda bir <Link href="/market" className="text-[#0066cc] hover:underline font-medium">hangel noktası</Link> bulun veya <span className="whitespace-nowrap">0554 700 70 07</span> numaralı telefonu arayın.
                </p>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-black/10 pt-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-x-6 gap-y-2 text-[12px] text-[#1d1d1f]/50">
                        <span className="whitespace-nowrap">Telif Hakkı © 2024 hangel Hub Teknoloji A.Ş. Tüm hakları saklıdır.</span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <Link href="#" className="hover:underline">Gizlilik Politikası</Link>
                            <span className="text-black/10">|</span>
                            <Link href="#" className="hover:underline">Çerezlerin Kullanımı</Link>
                            <span className="text-black/10">|</span>
                            <Link href="#" className="hover:underline">Kullanım Şartları</Link>
                            <span className="text-black/10">|</span>
                            <Link href="#" className="hover:underline">Yasal Bilgiler</Link>
                            <span className="text-black/10">|</span>
                            <Link href="#" className="hover:underline">Site Haritası</Link>
                            <span className="text-black/10">|</span>
                            <Link href="#" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                        </div>
                    </div>
                    <div className="text-[12px] font-medium text-[#1d1d1f]/70 hover:text-[#1d1d1f] cursor-pointer transition-colors shrink-0">
                        Türkiye
                    </div>
                </div>
            </div>
        </div>
    </footer>
);

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#f5f5f7] selection:bg-primary/30 font-sans">
            <Header />
            
            <main className="pt-12">
                {/* Hero Section */}
                <section className="bg-[#f5f5f7] pt-24 pb-12 text-center space-y-4 px-4 border-b-[12px] border-[#f5f5f7]">
                    <div className="space-y-2">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f]">
                            Yok öyle yalnız başına mücadele etmek.
                        </h1>
                        <p className="text-xl md:text-3xl font-medium text-[#1d1d1f]/80 max-w-4xl mx-auto">
                            Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
                        </p>
                    </div>
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="rounded-full px-10 h-12 text-base font-bold bg-[#0071e3] hover:bg-[#0077ed]">
                            <Link href="/login/selection?action=register">Şimdi Katıl</Link>
                        </Button>
                    </div>
                    <div className="relative w-full h-[400px] mt-12">
                        <Image 
                            src="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop" 
                            alt="Social Impact" 
                            fill 
                            className="object-contain object-bottom" 
                            data-ai-hint="connecting hands single object"
                        />
                    </div>
                </section>

                {/* iPhone style Full Width Section */}
                <FullWidthSection 
                    title="hangel imece"
                    subtitle="Gönüllülükte teknoloji devrimi."
                    cta1="Gönüllü Ol"
                    cta2="Daha fazla bilgi"
                    imageUrl="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop"
                    imageHint="group together portrait"
                />

                {/* Dark Theme Section */}
                <FullWidthSection 
                    title="hangel STK"
                    subtitle="Dijitalleşen sivil toplum araçları."
                    theme="dark"
                    cta1="Kuruluşunu Kaydet"
                    cta2="Özellikleri İncele"
                    imageUrl="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                    imageHint="modern office building glass"
                />

                {/* Grid Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-3 pb-3 bg-[#f5f5f7]">
                    <GridItem 
                        title="hangel bağışı"
                        subtitle="Alışverişi iyiliğe dönüştürün."
                        cta1="Markaları Gör"
                        cta2="Nasıl Çalışır?"
                        imageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
                        imageHint="lifestyle product shopping"
                    />
                    <GridItem 
                        title="hangel Kampüs"
                        subtitle="Üniversiteler için sosyal etki ağı."
                        cta1="Temsilci Ol"
                        cta2="Okulunu Kaydet"
                        theme="dark"
                        imageUrl="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop"
                        imageHint="university graduation cap"
                    />
                    <GridItem 
                        title="hangel Üye İşyeri"
                        subtitle="İşletmenizde QR ile ödeme alın."
                        cta1="Başvur"
                        cta2="Avantajları Gör"
                        imageUrl="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop"
                        imageHint="qr code terminal object"
                        theme="dark"
                    />
                    <GridItem 
                        title="Kütüphane"
                        subtitle="Bilgi paylaştıkça çoğalır."
                        cta1="Kaynakları Gör"
                        imageUrl="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
                        imageHint="minimal books stack"
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
}