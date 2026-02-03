'use client';

import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import { 
  Globe, ChevronRight, Search, ShoppingBag, Menu, Megaphone, HeartHandshake, Building, Users, Star, Sparkles, HelpCircle, ArrowRight, Calendar
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { languages, useTranslation } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const CategoryItem = ({ icon: Icon, label, href }: { icon: any, label: string, href: string }) => (
  <Link href={href} className="flex flex-col items-center gap-2 min-w-[80px] group">
    <div className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center transition-transform group-hover:scale-110">
      <Icon className="h-7 w-7 text-[#1d1d1f]" />
    </div>
    <span className="text-[12px] font-medium text-[#1d1d1f] text-center">{label}</span>
  </Link>
);

const SectionHeader = ({ prefix, title, description }: { prefix: string, title: string, description?: string }) => (
  <div className="space-y-1 mb-6 px-6">
    <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1d1d1f]">
      <span className="text-primary">{prefix}</span> {title}
    </h3>
    {description && <p className="text-muted-foreground text-sm font-medium">{description}</p>}
  </div>
);

const FeaturedCard = ({ 
  title, 
  subtitle, 
  image, 
  dark = false, 
  link = "/login/selection?action=register",
  imageHint = "product",
  large = false
}: { 
  title: string, 
  subtitle: string, 
  image: string, 
  dark?: boolean, 
  link?: string,
  imageHint?: string,
  large?: boolean
}) => (
  <Link href={link} className={cn(
    "relative flex flex-col overflow-hidden rounded-[1.5rem] transition-all hover:scale-[1.01] shadow-sm",
    large ? "h-[450px] md:h-[500px]" : "h-[380px] md:h-[420px]",
    dark ? "bg-black text-white" : "bg-white text-[#1d1d1f] border"
  )}>
    <div className="z-10 p-8 space-y-2">
      <p className={cn("text-[10px] font-black uppercase tracking-widest", dark ? "text-white/60" : "text-black/40")}>{subtitle}</p>
      <h4 className="text-2xl md:text-3xl font-bold leading-tight max-w-[200px]">{title}</h4>
    </div>
    <div className="absolute inset-0 z-0">
      <Image 
        src={image} 
        alt={title} 
        fill 
        className="object-cover object-center" 
        data-ai-hint={imageHint}
      />
      {dark && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />}
    </div>
  </Link>
);

const WhiteCard = ({ title, subtitle, icon: Icon, link = "#" }: { title: string, subtitle: string, icon: any, link?: string }) => (
  <Link href={link} className="bg-white border rounded-[1.5rem] p-8 flex flex-col justify-between h-[380px] hover:shadow-md transition-shadow group">
    <div className="space-y-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-black/40">{subtitle}</p>
        <h4 className="text-xl font-bold text-[#1d1d1f] leading-tight group-hover:text-primary transition-colors">{title}</h4>
      </div>
    </div>
    <div className="flex justify-end">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
        <ChevronRight className="h-5 w-5" />
      </div>
    </div>
  </Link>
);

export default function LoginPage() {
  const { language, changeLanguage, t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const footerSections = [
    {
      title: "Keşfedin",
      links: [
        { label: "Markalar", href: "/market" },
        { label: "Gönüllülük", href: "/volunteering" },
        { label: "STK'lar", href: "/ngos" },
        { label: "Kulüpler", href: "/admin/clubs" },
        { label: "Liderlik Tablosu", href: "/leaderboard" },
      ]
    },
    {
      title: "Hesap",
      links: [
        { label: "Giriş Yap", href: "/login/selection?action=login" },
        { label: "Kayıt Ol", href: "/login/selection?action=register" },
        { label: "Cüzdanım", href: "/qr-payment" },
        { label: "Bağışlarım", href: "/my-donations" },
      ]
    },
    {
      title: "Kurumsal",
      links: [
        { label: "Hakkımızda", href: "/about" },
        { label: "STK Başvurusu", href: "/ngo-onboarding" },
        { label: "Üye İşyeri", href: "/merchant" },
        { label: "Basın Odası", href: "/press" },
        { label: "Kütüphane", href: "/library" },
      ]
    },
    {
      title: "Değerler",
      links: [
        { label: "Şeffaflık", href: "/ngos" },
        { label: "Erişilebilirlik", href: "/settings/accessibility" },
        { label: "Gizlilik", href: "/settings/contracts/gizlilik-politikasi" },
        { label: "Etik İlkeler", href: "/settings/contracts/etik-ilkeler" },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased overflow-x-hidden pb-20 md:pb-0">
      {/* Global Apple Style Nav */}
      <header className="sticky top-0 z-50 w-full h-12 bg-white/80 backdrop-blur-md border-b border-[#d2d2d7]/50">
        <div className="container mx-auto h-full max-w-6xl px-4 flex items-center justify-between">
          <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
            <HangelLogo className="text-xl tracking-tighter" />
          </Link>

          <nav className="hidden md:flex gap-8 text-[12px] font-medium text-[#1d1d1f]/80">
            <Link href="/market" className="hover:text-[#1d1d1f] transition-colors">{t('nav.market')}</Link>
            <Link href="/volunteering" className="hover:text-[#1d1d1f] transition-colors">{t('nav.volunteering')}</Link>
            <Link href="/ngos" className="hover:text-[#1d1d1f] transition-colors">{t('nav.ngos')}</Link>
            <Link href="/about" className="hover:text-[#1d1d1f] transition-colors">{t('nav.about')}</Link>
          </nav>

          <div className="flex items-center gap-6 opacity-80">
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogTrigger asChild>
                    <Search className="h-4 w-4 cursor-pointer hover:text-primary transition-colors" />
                </DialogTrigger>
                <DialogContent className="sm:max-w-md top-[20%]">
                    <div className="flex items-center space-x-2 pt-4">
                        <Input 
                            placeholder="STK, Marka veya Gönüllülük ara..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button onClick={() => {
                            if (searchQuery.trim()) {
                                setIsSearchOpen(false);
                                toast({ title: "Arama Yapılıyor", description: `"${searchQuery}" için sonuçlar hazırlanıyor.` });
                            }
                        }}>Ara</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Link href="/stories" className="hover:text-primary transition-colors">
              <Megaphone className="h-4 w-4 cursor-pointer" />
            </Link>
            <Link href="/qr-payment" className="hover:text-primary transition-colors">
              <ShoppingBag className="h-4 w-4 cursor-pointer" />
            </Link>
            <Select value={language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-auto border-none bg-transparent gap-1 h-auto p-0 text-[12px] font-normal text-[#1d1d1f] focus:ring-0">
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
        {/* Top Header Section */}
        <section className="bg-white pt-16 pb-8">
          <div className="container mx-auto max-w-6xl px-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">{t('title')}</h1>
              <p className="text-xl md:text-2xl font-medium text-[#86868b]">{t('subtitle')}</p>
            </div>
            <div className="hidden md:block pb-2">
               <Button asChild className="rounded-full px-6 bg-[#0066cc] hover:bg-[#0071e3] text-white">
                  <Link href="/login/selection?action=register">{t('common.start')}</Link>
               </Button>
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="bg-white border-b sticky top-12 z-40">
          <div className="container mx-auto max-w-6xl">
            <ScrollArea className="w-full">
              <div className="flex gap-8 px-6 py-6 items-center justify-start md:justify-center">
                <CategoryItem icon={ShoppingBag} label={t('nav.market')} href="/market" />
                <CategoryItem icon={HeartHandshake} label={t('nav.volunteering')} href="/volunteering" />
                <CategoryItem icon={Building} label={t('nav.ngos')} href="/ngos" />
                <CategoryItem icon={Users} label={t('nav.clubs')} href="/admin/clubs" />
                <CategoryItem icon={Star} label={t('nav.badges')} href="/my-badges" />
                <CategoryItem icon={Sparkles} label={t('nav.impactStory')} href="/impact-story" />
                <CategoryItem icon={HelpCircle} label={t('nav.support')} href="/support" />
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          </div>
        </section>

        {/* Featured Sections - The "App Store" Style Grid */}
        <div className="container mx-auto max-w-6xl py-12 md:py-16 space-y-16">
          
          {/* Section 1: Son Çıkanlar */}
          <section>
            <SectionHeader prefix="Son çıkanlar." title="Yepyeni fırsatlar." description="Keşfetmeniz için en güncel ilanlar." />
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-6 px-6 pb-6">
                <div className="min-w-[300px] md:min-w-[400px]">
                  <FeaturedCard 
                    title="Afet Bölgesi Lojistik Desteği" 
                    subtitle="Öne Çıkan İlan" 
                    image="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80" 
                    imageHint="volunteers helping"
                    dark={true}
                    large={true}
                  />
                </div>
                <div className="min-w-[300px] md:min-w-[400px]">
                  <FeaturedCard 
                    title="Denizleri Temiz Tutma Hareketi" 
                    subtitle="Yeni Etkinlik" 
                    image="https://images.unsplash.com/photo-1595902392414-16c64fe8d048?w=800&q=80" 
                    imageHint="beach cleanup"
                    large={true}
                  />
                </div>
                <div className="min-w-[300px] md:min-w-[400px]">
                  <FeaturedCard 
                    title="Sokak Hayvanları İçin Kış Desteği" 
                    subtitle="Popüler" 
                    image="https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800&q=80" 
                    imageHint="cute dog shelter"
                    dark={true}
                    large={true}
                  />
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          {/* Section 2: Gönüllülük */}
          <section>
            <SectionHeader prefix="Gönüllülük." title="İyiliğe imzanızı atın." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
              <WhiteCard title="Yeteneklerini Sosyal Faydaya Dönüştür" subtitle="hangel imece" icon={Users} />
              <WhiteCard title="Etkinliklere Katıl, Sertifikanı Al" subtitle="Etkinlikler" icon={Calendar} />
              <div className="md:col-span-2 lg:col-span-1">
                <FeaturedCard 
                  title="Kampüs Temsilcisi Ol" 
                  subtitle="hangel Kampüs" 
                  image="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?w=800&q=80" 
                  imageHint="university students"
                  dark={true}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Market */}
          <section>
            <SectionHeader prefix="Alışveriş." title="Bağış yapmanın en kolay yolu." />
            <div className="px-6">
              <FeaturedCard 
                title="Her Alışverişin Bir İyiliğe Dönüşsün" 
                subtitle="hangel bağışı" 
                image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80" 
                imageHint="clothing store"
                large={true}
              />
            </div>
          </section>

          {/* Section 4: STK & Corporate */}
          <section>
            <SectionHeader prefix="Kuruluşlar." title="Dijitalleşen Sivil Toplum." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
              <FeaturedCard 
                title="STK'nı Dijital Dünyaya Taşı" 
                subtitle="hangel STK" 
                image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&q=80" 
                imageHint="modern building"
                dark={true}
              />
              <FeaturedCard 
                title="Sosyal Sorumluluğu QR ile Kolaylaştır" 
                subtitle="Üye İşyeri" 
                image="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=1000&q=80" 
                imageHint="payment terminal"
              />
            </div>
          </section>

        </div>
      </main>

      {/* Apple-style Breadcrumb & Footer */}
      <footer className="bg-white pt-12 pb-16 px-6 border-t border-[#d2d2d7] text-[#1d1d1f]">
        <div className="container mx-auto max-w-6xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[12px] text-[#6e6e73] mb-8">
                <HangelLogo className="h-3 w-auto opacity-60" />
                <ChevronRight className="h-3 w-3" />
                <span>Hangel</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[#1d1d1f]">Ana Sayfa</span>
            </div>

            {/* Links Grid */}
            <div className="hidden md:grid grid-cols-4 gap-8 mb-12">
              {footerSections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <h4 className="text-[12px] font-bold text-[#1d1d1f]">{section.title}</h4>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-[12px] text-[#6e6e73] hover:text-[#1d1d1f] hover:underline">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Mobile Accordion Links */}
            <div className="md:hidden space-y-4 mb-12">
              <Accordion type="single" collapsible className="w-full">
                {footerSections.map((section, idx) => (
                  <AccordionItem key={section.title} value={`item-${idx}`} className="border-b border-[#d2d2d7]">
                    <AccordionTrigger className="text-[12px] font-bold py-3 text-[#1d1d1f] hover:no-underline">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <ul className="space-y-3 pl-2">
                        {section.links.map((link) => (
                          <li key={link.label}>
                            <Link href={link.href} className="text-[12px] text-[#6e6e73]">
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

            {/* Legal Area */}
            <div className="pt-8 border-t border-[#d2d2d7] space-y-4">
              <p className="text-[12px] text-[#6e6e73]">
                Diğer alışveriş seçenekleri: Bir <Link href="/market" className="text-[#0066cc] underline">hangel Markası</Link> bulun veya <Link href="/support" className="text-[#0066cc] underline">destek merkezimizle</Link> iletişime geçin.
              </p>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 text-[12px] text-[#6e6e73]">
                <div className="flex flex-col lg:flex-row lg:items-center gap-x-6 gap-y-2">
                  <p>Copyright © 2026 Hangel Hub Inc. Tüm hakları saklıdır.</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
                    <Link href="/settings/contracts/cerez-politikasi" className="hover:underline border-l pl-4 border-[#d2d2d7]">Çerezlerin Kullanımı</Link>
                    <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline border-l pl-4 border-[#d2d2d7]">Kullanım Şartları</Link>
                    <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline border-l pl-4 border-[#d2d2d7]">Bilgi Toplumu Hizmetleri</Link>
                  </div>
                </div>
                <div className="font-medium text-[#1d1d1f]">Türkiye</div>
              </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
