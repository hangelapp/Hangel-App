
'use client';

import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import { 
  Globe, ChevronRight, Search, ShoppingBag, Menu, Filter, ArrowDownUp
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from 'next/image';
import Link from 'next/link';
import { volunteeringOpportunities } from '@/lib/data';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const languages = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
];

// Custom Volunteering Icon (Hand with Heart in palm)
const HandWithHeartIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
    <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    <path d="M12 11.5c.6-.6 1.5-.6 2.1 0 .6.6.6 1.5 0 2.1L12 15.7l-2.1-2.1c-.6-.6-.6-1.5 0-2.1.6-.6 1.5-.6 2.1 0z" />
  </svg>
);

const AppleSection = ({ 
  title, 
  subtitle, 
  description, 
  image, 
  children,
  dark = false, 
  fullWidth = true,
  primaryCta = "Hemen Başla",
  secondaryCta = "Daha fazla bilgi",
  link = "/login/selection?action=register",
  imageHint = "product image"
}: { 
  title: string, 
  subtitle?: string, 
  description?: string, 
  image?: string, 
  children?: React.ReactNode,
  dark?: boolean, 
  fullWidth?: boolean,
  primaryCta?: string,
  secondaryCta?: string,
  link?: string,
  imageHint?: string
}) => (
  <section className={cn(
    "relative flex flex-col items-center justify-start text-center overflow-hidden pt-12 md:pt-16",
    fullWidth ? "w-full min-h-[600px] md:min-h-[800px] mb-3" : "h-[500px] md:h-[600px] rounded-3xl mx-3 mb-3",
    dark ? "bg-black text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
  )}>
    <div className="z-10 px-6 space-y-1 max-w-4xl mb-8">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      {description && <p className={cn("text-[10px] md:text-xs font-medium mt-6 tracking-tight", dark ? "text-[#a1a1a6]" : "text-[#86868b]")}>{description}</p>}
      {subtitle && <p className="text-xl md:text-2xl font-medium md:whitespace-nowrap max-w-full px-2">{subtitle}</p>}
      <div className="pt-4 flex items-center justify-center gap-6">
        <Button asChild className="rounded-full px-6 h-10 bg-[#0066cc] hover:bg-[#0071e3] text-white border-none font-normal text-sm md:text-base">
          <Link href={link}>{primaryCta}</Link>
        </Button>
        <Button variant="link" className="text-[#0066cc] hover:text-[#0066cc] p-0 h-auto font-normal text-sm md:text-lg group">
          {secondaryCta} <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
    <div className="relative w-full flex-1 flex flex-col items-center justify-start overflow-hidden px-0 md:px-0">
      {children ? (
        <div className="w-full h-full">
          {children}
        </div>
      ) : (
        image && (
          <div className="relative w-full h-full max-w-5xl mx-auto px-4">
            <Image 
              src={image} 
              alt={title} 
              fill 
              className="object-contain object-top select-none" 
              data-ai-hint={imageHint}
              priority
            />
          </div>
        )
      )}
    </div>
  </section>
);

const VolunteeringDiscovery = () => {
    const [mounted, setMounted] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const categories = ['Tümü', 'Çevre', 'Eğitim', 'Afet', 'Hayvan Hakları', 'Engelli'];
    const categoryMapping: Record<string, string> = {
        'Tümü': 'all',
        'Çevre': 'Çevre',
        'Eğitim': 'Eğitim',
        'Afet': 'Afet',
        'Hayvan Hakları': 'Hayvan Hakları',
        'Engelli': 'Engelli'
    };

    const filteredItems = useMemo(() => {
        if (!mounted) return [];
        let items = volunteeringOpportunities;
        
        if (filter !== 'all') {
            items = items.filter(item => item.socialArea === filter);
        }
        
        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            items = items.filter(item => 
                item.title.toLowerCase().includes(lower) || 
                item.organization.toLowerCase().includes(lower)
            );
        }

        return items.slice(0, 21);
    }, [filter, searchTerm, mounted]);

    if (!mounted) {
        return <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">Yükleniyor...</div>;
    }

    return (
        <div className="w-full space-y-6 py-4">
            <div className="flex items-center gap-2 px-4 max-w-2xl mx-auto w-full">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
                    <Input 
                        placeholder="Gönüllülük ilanlarında ara..." 
                        className="pl-9 h-10 bg-white/80 backdrop-blur-md border-none rounded-full focus-visible:ring-1 focus-visible:ring-[#0066cc] placeholder:text-[#86868b] text-[13px] shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/80 backdrop-blur-md h-10 w-10 border border-[#d2d2d7]/50 hover:bg-white transition-colors shadow-sm shrink-0">
                    <Filter className="h-4 w-4 text-[#1d1d1f]" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/80 backdrop-blur-md h-10 w-10 border border-[#d2d2d7]/50 hover:bg-white transition-colors shadow-sm shrink-0">
                    <ArrowDownUp className="h-4 w-4 text-[#1d1d1f]" />
                </Button>
            </div>

            <div className="flex overflow-x-auto md:justify-center gap-2 px-4 no-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(categoryMapping[cat])}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                            filter === categoryMapping[cat] 
                                ? "bg-[#1d1d1f] text-white shadow-sm" 
                                : "bg-white/80 backdrop-blur-md text-[#1d1d1f] border border-[#d2d2d7] hover:border-[#86868b]"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto no-scrollbar pb-8 snap-x snap-mandatory">
                <div className="grid grid-flow-col grid-rows-3 gap-x-4 gap-y-3 px-4 md:px-12 w-max">
                    {filteredItems.map((item) => (
                        <Link href={`/login/selection?action=register&type=individual`} key={item.id} className="block shrink-0 snap-start">
                            <Card className="group relative overflow-hidden rounded-2xl border-none shadow-sm bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300 cursor-pointer flex flex-col w-[260px] md:w-[320px] h-[90px] md:h-[100px] justify-center">
                                <CardHeader className="p-4 pb-0 space-y-0.5 text-left">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-primary">{item.socialArea}</p>
                                    <CardTitle className="text-sm font-bold tracking-tight text-[#1d1d1f] leading-snug line-clamp-1">{item.title}</CardTitle>
                                    <CardDescription className="text-[11px] font-medium text-[#86868b] line-clamp-1">{item.organization}</CardDescription>
                                </CardHeader>
                                <CardFooter className="p-4 pt-1 flex justify-end items-center">
                                    <div className="flex items-center text-[#0066cc] text-[11px] font-medium group-hover:underline">
                                        İncele <ChevronRight className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FooterNav = () => {
  const sections = [
    {
      title: "Keşfet ve Sosyal Etki",
      links: [
        { label: "Markalar", href: "/market" },
        { label: "Gönüllülük", href: "/volunteering" },
        { label: "STK'lar", href: "/ngos" },
        { label: "Öğrenci Kulüpleri", href: "/admin/clubs" },
        { label: "Liderlik Tablosu", href: "/leaderboard" },
        { label: "Etki Hikayem", href: "/impact-story" },
      ]
    },
    {
      title: "Hesap ve Ödemeler",
      links: [
        { label: "Giriş Yap", href: "/login/selection?action=login" },
        { label: "Bireysel Kayıt", href: "/login/selection?action=register&type=individual" },
        { label: "Kurumsal Başvuru", href: "/login/selection?action=register&type=corporate" },
        { label: "QR Ödeme", href: "/qr-payment" },
        { label: "Bağışlarım", href: "/my-donations" },
        { label: "Rozetlerim", href: "/my-badges" },
      ]
    },
    {
      title: "Kurumsal",
      links: [
        { label: "Hakkımızda", href: "/about" },
        { label: "Kamu İlişkileri", href: "/corporate" },
        { label: "Yatırımcı İlişkileri", href: "/yatirimci-iliskileri" },
        { label: "Basın Odası", href: "/press" },
        { label: "Kütüphane", href: "/library" },
        { label: "İletişim", href: "/about" },
      ]
    },
    {
      title: "İş Ortaklığı ve Destek",
      links: [
        { label: "Üye İşyeri Ol", href: "/merchant" },
        { label: "STK Başvurusu", href: "/ngo-onboarding" },
        { label: "Destek Merkezi", href: "/support" },
        { label: "Arkadaşını Davet Et", href: "/invite" },
        { label: "Güvenlik", href: "/settings/security" },
      ]
    },
    {
      title: "Değerler ve Politika",
      links: [
        { label: "Şeffaflık Endeksi", href: "/ngos" },
        { label: "Sosyal Etki Politikası", href: "/settings/contracts/sosyal-etki-politikasi" },
        { label: "Etik İlkeler", href: "/settings/contracts/etik-ilkeler" },
        { label: "Sürdürülebilirlik", href: "/about" },
        { label: "Erişilebilirlik", href: "/settings/contracts/erisilebilirlik-politikasi" },
      ]
    }
  ];

  return (
    <>
      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-5 gap-4 mb-10">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h4 className="text-[12px] font-bold text-[#1d1d1f]">{section.title}</h4>
            <ul className="text-[12px] text-[#6e6e73] space-y-2">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-[#1d1d1f] hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Mobile Accordion */}
      <div className="md:hidden mb-8 border-b border-[#d2d2d7]">
        <Accordion type="single" collapsible className="w-full">
          {sections.map((section, idx) => (
            <AccordionItem key={section.title} value={`item-${idx}`} className="border-t border-[#d2d2d7] border-b-0">
              <AccordionTrigger className="text-[12px] font-normal py-3 text-[#1d1d1f] hover:no-underline">
                {section.title}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ul className="text-[12px] text-[#6e6e73] space-y-3 pl-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="hover:text-[#1d1d1f]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  );
};

export default function LoginPage() {
  const [language, setLanguage] = useState('tr');

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#1d1d1f] font-sans antialiased">
      <header className="sticky top-0 z-50 w-full h-11 bg-white/80 backdrop-blur-md border-b border-[#d2d2d7]/50">
        <div className="container mx-auto h-full max-w-5xl px-4 flex items-center justify-between">
          <div className="flex-1 flex justify-start items-center">
            <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
              <HangelLogo className="text-xl tracking-tighter" />
            </Link>
          </div>

          <nav className="hidden md:flex flex-1 justify-center items-center gap-6 text-[12px] font-normal text-[#1d1d1f]/80">
            <Link href="/market" className="hover:text-[#1d1d1f] transition-colors">Market</Link>
            <Link href="/volunteering" className="hover:text-[#1d1d1f] transition-colors">Gönüllülük</Link>
            <Link href="/ngos" className="hover:text-[#1d1d1f] transition-colors">STK'lar</Link>
            <Link href="/about" className="hover:text-[#1d1d1f] transition-colors">Hakkımızda</Link>
            <Link href="/support" className="hover:text-[#1d1d1f] transition-colors">Destek</Link>
          </nav>

          <div className="flex-1 flex justify-end items-center gap-5 opacity-80">
            <Search className="h-4 w-4 cursor-pointer hover:text-primary transition-colors" />
            <Link href="/market" className="hover:text-primary transition-colors">
              <ShoppingBag className="h-4 w-4 cursor-pointer" />
            </Link>
            <Link href="/volunteering" className="hover:text-primary transition-colors">
              <HandWithHeartIcon className="h-4 w-4 cursor-pointer" />
            </Link>
            <div className="md:hidden">
              <Menu className="h-4 w-4 cursor-pointer" />
            </div>
            <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-auto border-none bg-transparent gap-1 h-auto p-0 text-[12px] font-normal text-[#1d1d1f] hover:text-primary transition-colors focus:ring-0">
                    <Globe className="h-3.5 w-3.5" />
                    <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                    {languages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative flex flex-col items-center justify-center text-center bg-white py-28 px-6 space-y-6">
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-[1.05]">Yok öyle yalnız başına mücadele.</h1>
          <p className="text-2xl md:text-3xl font-medium max-w-3xl mx-auto">Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.</p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-12 h-14 bg-[#0066cc] hover:bg-[#0071e3] text-white border-none text-xl font-normal w-full sm:w-auto">
              <Link href="/login/selection?action=login">Giriş Yap</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-12 h-14 border-2 border-[#0066cc] text-[#0066cc] hover:bg-[#0066cc]/5 text-xl font-normal w-full sm:w-auto">
              <Link href="/login/selection?action=register&type=individual">Kayıt Ol</Link>
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 px-3">
          <AppleSection 
            title="hangel STK"
            subtitle="Sivil Toplum Kuruluşu ile hangel’de Ol"
            description="Dernek, Vakıf, Spor Kulübü, Öğrenci Kulübü"
            image="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop"
            imageHint="abstract colorful sparks"
            fullWidth={false}
            primaryCta="Kayıt Ol"
            link="/login/selection?action=register&type=corporate"
            dark={false}
          />
          <AppleSection 
            title="hangel Brands" 
            subtitle="Markan ile hangel de ol." 
            description="Ticari Marka, Kooperatif, İktisadi İşletme, Sosyal Girişim"
            image="https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=2070&auto=format&fit=crop" 
            imageHint="modern branding" 
            fullWidth={false} 
            primaryCta="Kayıt Ol" 
            link="/login/selection?action=register&type=corporate"
            dark={false}
          />
        </div>

        <AppleSection 
          title="hangel imece"
          subtitle="Yetkinliklerin toplumsal faydaya dönüşsün."
          description="Gönüllü Ol, İmece Ruhuyla Toplumsal Sorunlara Çözüm Üret."
          link="/login/selection?action=register&type=individual"
        >
          <VolunteeringDiscovery />
        </AppleSection>

        <AppleSection 
          title="hangel bağışı"
          subtitle="Alışverişin iyiliğe dönüşsün."
          description="Ek Bir Ödeme Yapmadan, Seçtiğin STK'ya %15'e Varan Oranlarda Bağış Yap."
          image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop"
          imageHint="shopping bags donation"
          link="/login/selection?action=register&type=individual"
          dark={true}
          primaryCta="Bağış Sistemini Keşfet"
        />

        <AppleSection 
          title="Şeffaflık Endeksi"
          subtitle="Güvenle bağış yapın."
          description="STK'ların Şeffaflık Raporlarını Anlık Olarak Takip Edin."
          image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
          imageHint="analytics dashboard transparency"
          primaryCta="Raporları İncele"
        />
      </main>

      <footer className="bg-[#f5f5f7] pt-12 pb-16 px-6 border-t border-[#d2d2d7] text-[#1d1d1f]">
        <div className="container mx-auto h-full max-w-5xl">
            {/* Footnotes */}
            <div className="text-[12px] text-[#6e6e73] leading-relaxed space-y-4 border-b border-[#d2d2d7] pb-6 mb-8">
                <p>
                  * hangel bağışı kapsamında sunulan oranlar anlaşmalı markalara göre değişiklik gösterebilir. Bağış tutarları, yasal vergiler ve hangel hizmet bedeli kesildikten sonra STK'ya aktarılır. Ayrıntılı bilgi için <Link href="/support" className="text-[#1d1d1f] underline">Destek Merkezi'ni</Link> ziyaret edebilirsiniz.
                </p>
                <p>
                  Sosyal Etki Puanı ve kazanılan rozetler hangel platformu içi ödüllendirme sistemidir ve nakit karşılığı bulunmamaktadır. Gönüllülük faaliyetleri, ilgili STK'ların onayına ve sorumluluğuna tabidir.
                </p>
            </div>

            {/* Apple-style Breadcrumb */}
            <div className="flex items-center gap-2 text-[12px] text-[#6e6e73] mb-8">
                <HangelLogo className="h-3 w-auto opacity-60" />
                <ChevronRight className="h-3 w-3" />
                <span className="hover:text-[#1d1d1f] cursor-pointer">Yasal Bilgiler</span>
            </div>

            {/* Navigation Sections */}
            <FooterNav />

            {/* Secondary Action Text */}
            <div className="text-[12px] text-[#6e6e73] border-b border-[#d2d2d7] pb-4 mb-4">
                Diğer alışveriş seçenekleri: Yakınınızda bir <Link href="/merchant" className="text-[#0066cc] hover:underline">hangel Üye İşyeri</Link> bulun veya <span className="text-[#0066cc]">0554 700 70 07</span> numaralı telefonu arayın.
            </div>

            {/* Bottom Footer Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-[12px] text-[#6e6e73]">
                <div className="flex flex-col md:flex-row md:items-center gap-x-6 gap-y-2">
                    <p>Telif Hakkı © 2026 hangel.org. Tüm hakları saklıdır.</p>
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <Link href="/settings/contracts/gizlilik-politikasi" className="hover:text-[#1d1d1f] hover:underline border-r border-[#d2d2d7] pr-2 last:border-0">Gizlilik Politikası</Link>
                        <Link href="/settings/contracts/cerez-politikasi" className="hover:text-[#1d1d1f] hover:underline border-r border-[#d2d2d7] pr-2 last:border-0">Çerez Politikası</Link>
                        <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:text-[#1d1d1f] hover:underline border-r border-[#d2d2d7] pr-2 last:border-0">Kullanım Şartları</Link>
                        <Link href="/settings/contracts/sosyal-etki-politikasi" className="hover:text-[#1d1d1f] hover:underline border-r border-[#d2d2d7] pr-2 last:border-0">Sosyal Etki Politikası</Link>
                        <Link href="/bilgi-toplumu-hizmetleri" className="hover:text-[#1d1d1f] hover:underline">Bilgi Toplumu Hizmetleri</Link>
                    </div>
                </div>
                <div className="font-semibold text-[#1d1d1f] hover:underline cursor-pointer transition-colors shrink-0">
                    Türkiye
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
