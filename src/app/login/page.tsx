
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import Link from 'next/link';
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
    HeartHandshake,
    Check,
    Siren,
    Star,
    Building2,
    GraduationCap,
    Zap,
    QrCode,
    BookOpen,
    Heart,
    ChevronDown,
    Twitter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { volunteeringOpportunities, allEntityLists } from '@/lib/data';
import Image from 'next/image';

const languages = [
    "Türkçe", "English", "Mandarin Chinese", "Hindi", "Español", "Français", 
    "Modern Standard Arabic", "Bengali", "Portuguese", "Russian", "Urdu", 
    "Indonesian", "Deutsch", "Japanese", "Nigerian Pidgin", "Marathi", 
    "Telugu", "Tamil", "Yue Chinese", "Vietnamese", "Farsça"
];

const Header = () => {
    const [currentLang, setCurrentLang] = useState("Türkçe");
    const { toast } = useToast();

    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-[#f5f5f7]/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl relative">
                <Link href="/login" className="hover:opacity-70 transition-opacity shrink-0">
                    <HangelLogo className="text-xl text-primary" />
                </Link>

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
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1d1d1f]/80">
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

const GridItem = ({ 
    title, 
    subtitle, 
    cta1, 
    cta1Href = "/login/selection?action=register",
    cta2, 
    cta2Href = "/about",
    theme = 'light',
    icon: Icon,
    className
}: { 
    title: string, 
    subtitle?: string, 
    cta1: string, 
    cta1Href?: string,
    cta2?: string, 
    cta2Href?: string,
    theme?: 'light' | 'dark',
    icon: any,
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
                <Link href={cta1Href} className="text-primary hover:underline flex items-center text-sm font-bold">
                    {cta1} <ChevronRight className="h-4 w-4 ml-0.5" />
                </Link>
                {cta2 && (
                    <Link href={cta2Href} className="text-primary hover:underline flex items-center text-sm font-bold">
                        {cta2} <ChevronRight className="h-4 w-4 ml-0.5" />
                    </Link>
                )}
            </div>
        </div>
        <div className="relative w-full flex-1 flex items-center justify-center pb-12">
            <div className={cn(
                "w-48 h-48 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-transform duration-500 hover:scale-110",
                theme === 'dark' ? "bg-white/5 border border-white/10" : "bg-[#f5f5f7] border border-black/5"
            )}>
                <Icon className={cn("w-24 h-24", theme === 'dark' ? "text-primary" : "text-primary")} />
            </div>
        </div>
    </section>
);

const Footer = () => (
    <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-8 pb-12 px-4 sm:px-6 border-t border-black/5 font-sans">
        <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-2 text-[12px] text-[#1d1d1f]/60 mb-6 px-1">
                <Link href="/login" className="hover:text-[#1d1d1f] transition-colors">
                    <HangelLogo className="text-base scale-90 grayscale opacity-70" />
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[#1d1d1f]/80">Anasayfa</span>
            </div>

            <div className="md:hidden">
                <Accordion type="single" collapsible className="w-full">
                    {[
                        { title: "Keşfedin", links: [{label: "Market", href: "/market"}, {label: "Gönüllülük", href: "/volunteering"}, {label: "STK'lar", href: "/ngos"}, {label: "Kulüpler", href: "/admin/clubs"}, {label: "Kütüphane", href: "/library"}] },
                        { title: "Kurumsal", links: [{label: "Biz Kimiz?", href: "/about"}, {label: "Sosyal Etkimiz", href: "/about"}, {label: "Basın Odası", href: "/press"}, {label: "Yatırımcılar", href: "/yatirimci-iliskileri"}, {label: "İş Fırsatları", href: "/corporate"}] },
                        { title: "İşbirlikleri", links: [{label: "Üye İşyeri", href: "/merchant"}, {label: "STK Kaydı", href: "/ngo-onboarding"}, {label: "Kampüs Elçiliği", href: "/contact/universities"}, {label: "Kulüpler", href: "/admin/clubs"}] },
                        { title: "Destek", links: [{label: "Destek Merkezi", href: "/support"}, {label: "S.S.S", href: "/support"}, {label: "İletişim", href: "/about"}, {label: "Bilgi Toplumu", href: "/bilgi-toplumu-hizmetleri"}, {label: "Erişilebilirlik", href: "/settings/accessibility"}] },
                        { title: "Hesabım", links: [{label: "Geniş Yap", href: "/login/selection?action=login"}, {label: "Kayıt Ol", href: "/login/selection?action=register"}, {label: "Bağışlarım", href: "/my-donations"}, {label: "Başvurularım", href: "/my-applications"}] },
                    ].map((group) => (
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
                {[
                    { title: "Keşfedin", links: [{label: "Market", href: "/market"}, {label: "Gönüllülük", href: "/volunteering"}, {label: "STK'lar", href: "/ngos"}, {label: "Kulüpler", href: "/admin/clubs"}, {label: "Kütüphane", href: "/library"}] },
                    { title: "Kurumsal", links: [{label: "Biz Kimiz?", href: "/about"}, {label: "Sosyal Etkimiz", href: "/about"}, {label: "Basın Odası", href: "/press"}, {label: "Yatırımcılar", href: "/yatirimci-iliskileri"}, {label: "İş Fırsatları", href: "/corporate"}] },
                    { title: "İşbirlikleri", links: [{label: "Üye İşyeri", href: "/merchant"}, {label: "STK Kaydı", href: "/ngo-onboarding"}, {label: "Kampüs Elçiliği", href: "/contact/universities"}, {label: "Kulüpler", href: "/admin/clubs"}] },
                    { title: "Destek", links: [{label: "Destek Merkezi", href: "/support"}, {label: "S.S.S", href: "/support"}, {label: "İletişim", href: "/about"}, {label: "Bilgi Toplumu", href: "/bilgi-toplumu-hizmetleri"}, {label: "Erişilebilirlik", href: "/settings/accessibility"}] },
                    { title: "Hesabım", links: [{label: "Giriş Yap", href: "/login/selection?action=login"}, {label: "Kayıt Ol", href: "/login/selection?action=register"}, {label: "Bağışlarım", href: "/my-donations"}, {label: "Başvurularım", href: "/my-applications"}] },
                ].map((group) => (
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
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#1d1d1f]/70 font-medium tracking-tight">
                    <Link href="#" className="hover:underline">App Store</Link>
                    <Link href="#" className="hover:underline">Google Play</Link>
                    <Link href="#" className="hover:underline">Huawei Store</Link>
                    <Link href="#" className="hover:underline">Chrome Store</Link>
                    <Link href="#" className="hover:underline">Opera Store</Link>
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[#1d1d1f]/70 font-medium tracking-tight">
                    <Link href="#" className="hover:underline">Instagram</Link>
                    <Link href="#" className="hover:underline">Facebook</Link>
                    <Link href="#" className="hover:underline">X (Twitter)</Link>
                    <Link href="#" className="hover:underline">LinkedIn</Link>
                    <Link href="#" className="hover:underline">YouTube</Link>
                </div>

                <div className="h-px bg-black/10 w-full" />

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#1d1d1f]/50 font-medium tracking-tight">
                    <Link href="/settings/contracts" className="hover:underline">Politikalar</Link>
                    <span className="text-black/10">|</span>
                    <Link href="/settings/contracts/cerez-politikasi" className="hover:underline">Çerezlerin Kullanımı</Link>
                    <span className="text-black/10">|</span>
                    <Link href="/settings/contracts" className="hover:underline">Sözleşmeler</Link>
                    <span className="text-black/10">|</span>
                    <Link href="#" className="hover:underline">Site Haritası</Link>
                    <span className="text-black/10">|</span>
                    <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                </div>

                <div className="h-px bg-black/10 w-full" />

                <p className="text-[12px] text-[#1d1d1f]/50 leading-relaxed">
                    Diğer alışveriş seçenekleri: Yakınınızda bir <Link href="/market" className="text-primary hover:underline font-medium">hangel noktası</Link> bulun veya <span className="whitespace-nowrap">0554 700 70 07</span> numaralı telefonu arayın.
                </p>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-black/10 pt-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-x-6 gap-y-2 text-[12px] text-[#1d1d1f]/50">
                        <span className="whitespace-nowrap">Telif Hakkı © 2024 Hangel Hub Teknoloji A.Ş. Tüm hakları saklıdır.</span>
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
                <section className="bg-[#f5f5f7] pt-24 pb-12 text-center space-y-4 px-4 border-b-[12px] border-[#f5f5f7]">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f]">
                            Yok öyle yalnız başına mücadele etmek.
                        </h1>
                        <div className="space-y-2 max-w-4xl mx-auto">
                            <p className="text-xl md:text-3xl font-medium text-[#1d1d1f]/80">
                                Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
                            </p>
                            <p className="text-sm md:text-lg text-[#1d1d1f]/60 font-normal pt-12">
                                Merhaba; günlük alışverişini iyi fiyatlarla yaparken ek masraf ödemeden bağışa dönüştürmeni ve profesyonel yetkinliklerin ile sosyal hassasiyetlerin doğrultusunda gönüllülük yapmanı sağlayan bir sosyal etki platformuna hoş geldin.
                            </p>
                        </div>
                    </div>
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="rounded-full px-10 h-12 text-base font-bold bg-primary hover:bg-primary/90">
                            <Link href="/login/selection?action=register">Şimdi Katıl</Link>
                        </Button>
                    </div>
                </section>

                <section className="bg-white pt-16 pb-24 text-center border-b-[12px] border-[#f5f5f7] overflow-hidden">
                    <div className="space-y-2 px-4 max-w-3xl mx-auto mb-12">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">hangel bağışı</h2>
                        <p className="text-xl md:text-2xl font-medium text-[#1d1d1f]/80">Alışverişi iyiliğe dönüştürün.</p>
                        <div className="flex items-center justify-center gap-6 pt-4">
                            <Link href="/market" className="bg-primary text-white px-6 py-2.5 rounded-full text-base font-medium hover:bg-primary/90 transition-colors">
                                Markaları Gör
                            </Link>
                            <Link href="/about" className="text-primary hover:underline flex items-center text-lg font-medium">
                                Nasıl Çalışır? <ChevronRight className="h-5 w-5 ml-0.5" />
                            </Link>
                        </div>
                    </div>
                    
                    <div className="relative w-full overflow-x-auto no-scrollbar pb-8">
                        <div className="flex gap-6 px-8 md:justify-center min-w-max">
                            {allEntityLists.slice(0, 6).map((brand) => (
                                <Link href={`/market/${brand.id}`} key={brand.id} className="bg-[#f5f5f7] rounded-[2rem] p-8 flex flex-col items-center text-center w-64 h-80 transition-all hover:shadow-2xl hover:scale-[1.02] group border border-black/5">
                                    <div className="relative w-24 h-24 mb-6">
                                        <Image 
                                            src={brand.logoUrl} 
                                            alt={brand.name} 
                                            fill 
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="space-y-1 mb-4">
                                        <h4 className="font-bold text-xl leading-tight text-[#1d1d1f]">{brand.name}</h4>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{brand.category}</p>
                                    </div>
                                    
                                    <div className="mt-auto pt-4 border-t border-black/5 w-full">
                                        <span className="text-[10px] font-black text-[#1d1d1f]/40 uppercase tracking-widest block mb-1">Bağış Oranı</span>
                                        <div className="text-2xl font-black text-primary tracking-tighter">
                                            %{brand.donationRate}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center mt-8">
                        <Button asChild variant="outline" className="rounded-full px-10 h-12 text-base font-bold border-black/10 hover:bg-black/5">
                            <Link href="/market">Tümünü Gör ({allEntityLists.length} Marka)</Link>
                        </Button>
                    </div>
                </section>

                <section className="bg-[#f5f5f7] pt-16 pb-24 text-center border-b-[12px] border-[#f5f5f7] overflow-hidden">
                    <div className="space-y-2 px-4 max-w-3xl mx-auto mb-12">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">hangel imece</h2>
                        <p className="text-xl md:text-2xl font-medium text-[#1d1d1f]/80">Gönüllülükte teknoloji devrimi.</p>
                        <div className="flex items-center justify-center gap-6 pt-4">
                            <Link href="/login/selection?action=register" className="bg-primary text-white px-6 py-2.5 rounded-full text-base font-medium hover:bg-primary/90 transition-colors">
                                Gönüllü Ol
                            </Link>
                            <Link href="/volunteering" className="text-primary hover:underline flex items-center text-lg font-medium">
                                İlanları Gör <ChevronRight className="h-5 w-5 ml-0.5" />
                            </Link>
                        </div>
                    </div>
                    
                    <div className="relative w-full overflow-x-auto no-scrollbar pb-8">
                        <div className="flex gap-6 px-8 md:justify-center min-w-max">
                            {volunteeringOpportunities.slice(0, 4).map((opp) => (
                                <Link href={`/volunteering/${opp.id}`} key={opp.id} className="bg-white rounded-[2rem] p-8 flex flex-col items-start text-left w-80 h-96 transition-all hover:shadow-2xl hover:scale-[1.02] group border border-black/5">
                                    <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] shadow-sm flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <HeartHandshake className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1 mb-4">
                                        <h4 className="font-bold text-xl leading-tight text-[#1d1d1f] line-clamp-2">{opp.title}</h4>
                                        <p className="text-xs font-black text-primary uppercase tracking-widest">{opp.organization}</p>
                                    </div>
                                    <div className="text-sm text-[#1d1d1f]/60 font-medium line-clamp-4 leading-relaxed">{opp.description}</div>
                                    
                                    <div className="mt-auto flex items-center justify-between w-full pt-6 border-t border-black/5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-[#1d1d1f]/40 uppercase tracking-widest mb-1">Kazanılacak Etki</span>
                                            <div className="flex items-center gap-1.5 text-primary">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span className="text-lg font-black tracking-tighter">{opp.points} Puan</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-[#1d1d1f]/40 uppercase tracking-widest block mb-1">Konum</span>
                                            <span className="text-xs font-bold text-[#1d1d1f]">{opp.location.city}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center mt-8">
                        <Button asChild variant="outline" className="rounded-full px-10 h-12 text-base font-bold border-black/10 hover:bg-black/5">
                            <Link href="/volunteering">Tümünü Gör ({volunteeringOpportunities.length} İlan)</Link>
                        </Button>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-3 pb-3 bg-[#f5f5f7]">
                    <GridItem 
                        title="hangel STK"
                        subtitle="Dijitalleşen sivil toplum araçları."
                        theme="dark"
                        cta1="Kuruluşunu Kaydet"
                        cta1Href="/login/selection?action=register&type=corporate"
                        cta2="Özellikleri İncele"
                        cta2Href="/ngo-onboarding"
                        icon={Building2}
                    />
                    <GridItem 
                        title="hangel Kampüs"
                        subtitle="Üniversiteler için sosyal etki ağı."
                        cta1="Temsilci Ol"
                        cta1Href="/contact/universities"
                        cta2="Okulunu Kaydet"
                        cta2Href="/login/selection?action=register&type=corporate"
                        theme="dark"
                        icon={GraduationCap}
                    />
                    <GridItem 
                        title="hangel Üye İşyeri"
                        subtitle="İşletmenizde QR ile ödeme alın."
                        cta1="Başvur"
                        cta1Href="/merchant"
                        cta2="Avantajları Gör"
                        cta2Href="/merchant"
                        icon={Zap}
                        theme="dark"
                    />
                    <GridItem 
                        title="Kütüphane"
                        subtitle="Bilgi paylaştıkça çoğalır."
                        cta1="Kaynakları Gör"
                        cta1Href="/library"
                        icon={BookOpen}
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
}
