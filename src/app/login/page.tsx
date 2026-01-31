'use client';

import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import { 
  Globe, ChevronRight, Search, ShoppingBag, Menu, Heart, MapPin, Calendar, Award
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from 'next/image';
import Link from 'next/link';
import { volunteeringOpportunities } from '@/lib/data';

const languages = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
];

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
    fullWidth ? "w-full min-h-[600px] md:min-h-[750px] mb-3" : "h-[500px] rounded-3xl mx-3 mb-3",
    dark ? "bg-black text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
  )}>
    <div className="z-10 px-6 space-y-1 max-w-4xl">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      {description && <p className={cn("text-[10px] md:text-xs font-medium mt-6 tracking-tight", dark ? "text-[#a1a1a6]" : "text-[#86868b]")}>{description}</p>}
      {subtitle && <p className="text-xl md:text-2xl font-medium md:whitespace-nowrap max-w-full px-2">{subtitle}</p>}
      <div className="pt-4 flex items-center justify-center gap-6">
        <Button asChild className="rounded-full px-6 h-10 bg-[#0066cc] hover:bg-[#0071e3] text-white border-none font-normal">
          <Link href={link}>{primaryCta}</Link>
        </Button>
        <Button variant="link" className="text-[#0066cc] hover:text-[#0066cc] p-0 h-auto font-normal text-lg group">
          {secondaryCta} <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
    <div className="relative w-full h-full mt-8 overflow-hidden px-4 md:px-0 flex items-center justify-center">
      {children ? (
        <div className="w-full">
          {children}
        </div>
      ) : (
        image && (
          <div className="relative w-full h-full min-h-[300px]">
            <Image 
              src={image} 
              alt={title} 
              fill 
              className="object-contain object-bottom select-none" 
              data-ai-hint={imageHint}
            />
          </div>
        )
      )}
    </div>
  </section>
);

const VolunteeringDiscovery = () => {
    const [filter, setFilter] = useState('all');
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
        if (filter === 'all') return volunteeringOpportunities.slice(0, 6);
        return volunteeringOpportunities.filter(item => item.socialArea === filter).slice(0, 6);
    }, [filter]);

    return (
        <div className="w-full space-y-8 py-4">
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

            <div className="flex overflow-x-auto gap-4 px-4 md:px-12 pb-12 snap-x no-scrollbar">
                <div className="flex gap-4 mx-auto">
                    {filteredItems.map((item) => (
                        <Link href={`/login/selection?action=register`} key={item.id} className="snap-center shrink-0">
                            <Card className="group relative overflow-hidden rounded-2xl border-none shadow-2xl bg-white hover:bg-[#fafafa] transition-all duration-300 cursor-pointer flex flex-col w-[260px] md:w-[300px] h-[160px] md:h-[180px]">
                                <CardHeader className="p-5 pb-0 space-y-1 text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{item.socialArea}</p>
                                    <CardTitle className="text-sm md:text-base font-bold tracking-tight text-[#1d1d1f] leading-snug line-clamp-2">{item.title}</CardTitle>
                                    <CardDescription className="text-xs font-medium text-[#86868b]">{item.organization}</CardDescription>
                                </CardHeader>
                                <CardFooter className="p-5 pt-0 mt-auto flex justify-between items-center">
                                    <div className="text-primary text-[10px] md:text-xs font-bold bg-primary/5 px-2.5 py-1 rounded-full">
                                        {item.points} Puan
                                    </div>
                                    <div className="flex items-center text-[#0066cc] text-xs font-medium group-hover:underline">
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

export default function LoginPage() {
  const [language, setLanguage] = useState('tr');

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#1d1d1f] font-sans antialiased">
      <header className="sticky top-0 z-50 w-full h-11 bg-white/80 backdrop-blur-md border-b border-[#d2d2d7]/50">
        <div className="container mx-auto h-full max-w-5xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
              <HangelLogo className="text-xl tracking-tighter" />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-[12px] font-normal text-[#1d1d1f]/80">
              <Link href="/market" className="hover:text-[#1d1d1f] transition-colors">Market</Link>
              <Link href="/volunteering" className="hover:text-[#1d1d1f] transition-colors">Gönüllülük</Link>
              <Link href="/ngos" className="hover:text-[#1d1d1f] transition-colors">STK'lar</Link>
              <Link href="/about" className="hover:text-[#1d1d1f] transition-colors">Hakkımızda</Link>
              <Link href="/support" className="hover:text-[#1d1d1f] transition-colors">Destek</Link>
            </nav>
          </div>
          <div className="flex items-center gap-5 opacity-80">
            <Search className="h-4 w-4 cursor-pointer hover:text-primary transition-colors" />
            <ShoppingBag className="h-4 w-4 cursor-pointer hover:text-primary transition-colors" />
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
        <section className="relative flex flex-col items-center justify-center text-center bg-white py-20 px-6 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">hangel Hub</h1>
          <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto">İyiliğin ve sosyal etkinin yeni nesil hali.</p>
          <div className="pt-4">
            <Button asChild size="lg" className="rounded-full px-10 h-12 bg-[#0066cc] hover:bg-[#0071e3] text-white border-none text-lg font-normal">
              <Link href="/login/selection?action=login">Giriş Yap</Link>
            </Button>
          </div>
        </section>

        <AppleSection 
          title="hangel imece"
          subtitle="Yetkinliklerin toplumsal faydaya dönüşsün."
          description="Gönüllü Ol, İmece Ruhuyla Toplumsal Sorunlara Çözüm Üret."
        >
          <VolunteeringDiscovery />
        </AppleSection>

        <AppleSection 
          title="hangel bağışı"
          subtitle="Alışverişin iyiliğe dönüşsün."
          description="Ek Bir Ödeme Yapmadan, Seçtiğin STK'ya %15'e Varan Oranlarda Bağış Yap."
          image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop"
          imageHint="shopping bags donation"
          dark={true}
          primaryCta="Bağış Sistemini Keşfet"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 px-3">
          <AppleSection 
            title="hangel STK"
            subtitle="Sivil Toplum Kuruluşu ile hangel’de Ol"
            description="Dernek, Vakıf, Spor Kulübü, Öğrenci Kulübü"
            image="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop"
            imageHint="abstract colorful sparks"
            fullWidth={false}
            primaryCta="Kayıt Ol"
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
            dark={false}
          />
        </div>

        <AppleSection 
          title="Şeffaflık Endeksi"
          subtitle="Güvenle bağış yapın."
          description="STK'ların Şeffaflık Raporlarını Anlık Olarak Takip Edin."
          image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
          imageHint="analytics dashboard transparency"
          primaryCta="Raporları İncele"
        />
      </main>

      <footer className="bg-[#f5f5f7] py-12 px-6 border-t border-[#d2d2d7] text-[#1d1d1f]">
        <div className="container mx-auto h-full max-w-5xl space-y-8">
            <div className="text-[12px] text-[#6e6e73] leading-relaxed space-y-4 max-w-4xl border-b border-[#d2d2d7] pb-6">
                <p>
                  * hangel bağışı kapsamında sunulan oranlar anlaşmalı markalara göre değişiklik gösterebilir. Bağış tutarları, yasal vergiler ve hangel hizmet bedeli kesildikten sonra STK'ya aktarılır. Ayrıntılı bilgi için <Link href="/support" className="text-[#1d1d1f] underline">Destek Merkezi'ni</Link> ziyaret edebilirsiniz.
                </p>
                <p>
                  Sosyal Etki Puanı ve kazanılan rozetler hangel platformu içi ödüllendirme sistemidir ve nakit karşılığı bulunmamaktadır. Gönüllülük faaliyetleri, ilgili STK'ların onayına ve sorumluluğuna tabidir.
                </p>
            </div>

            <div className="text-[12px] text-[#6e6e73] space-y-4 pt-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
                        <span className="text-[#d2d2d7]">|</span>
                        <Link href="/settings/contracts/cerez-politikasi" className="hover:underline">Cherez Politikası</Link>
                        <span className="text-[#d2d2d7]">|</span>
                        <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline">Kullanım Şartları</Link>
                        <span className="text-[#d2d2d7]">|</span>
                        <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                    </div>
                    <div className="font-semibold text-[#1d1d1f] hover:underline cursor-pointer transition-colors">
                        Türkiye
                    </div>
                </div>
                <div className="pt-2 border-t border-[#d2d2d7]/50 text-center">
                    <span className="font-normal">© 2026 hangel.org. Tüm hakları saklıdır.</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
