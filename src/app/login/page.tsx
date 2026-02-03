
'use client';

import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import { 
  Globe, ChevronRight, Search, ShoppingBag, Menu, Megaphone
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

const AppleSection = ({ 
  title, 
  subtitle, 
  description, 
  image, 
  dark = false, 
  link = "/login/selection?action=register",
  imageHint = "product",
  fullHeight = true,
  ctaText = "Hemen Başla",
  secondaryCta = "Daha fazla bilgi",
  secondaryLink = "/ngo-onboarding"
}: { 
  title: string, 
  subtitle?: string, 
  description?: string, 
  image: string, 
  dark?: boolean, 
  link?: string,
  imageHint?: string,
  fullHeight?: boolean,
  ctaText?: string,
  secondaryCta?: string,
  secondaryLink?: string
}) => (
  <section className={cn(
    "relative w-full overflow-hidden flex flex-col items-center text-center",
    fullHeight ? "h-[85vh] md:h-[90vh]" : "h-[600px]",
    dark ? "bg-black text-white" : "bg-[#fafafa] text-[#1d1d1f]"
  )}>
    <div className="z-10 pt-16 md:pt-20 px-6 space-y-3">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">{title}</h2>
      {subtitle && <p className="text-xl md:text-3xl font-medium">{subtitle}</p>}
      {description && <p className="text-lg md:text-xl text-[#86868b] max-w-xl mx-auto">{description}</p>}
      
      <div className="flex items-center justify-center gap-6 pt-4">
        <Link href={link} className="bg-[#0066cc] hover:bg-[#0071e3] text-white px-6 py-2.5 rounded-full font-semibold transition-colors">
          {ctaText}
        </Link>
        <Link href={secondaryLink} className="text-[#0066cc] hover:underline flex items-center font-medium group">
          {secondaryCta} <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
    
    <div className="absolute inset-0 z-0 flex items-end justify-center">
      <div className="relative w-full h-full max-w-[1200px]">
        <Image 
          src={image} 
          alt={title} 
          fill 
          className="object-contain object-bottom md:scale-110" 
          data-ai-hint={imageHint}
        />
      </div>
    </div>
  </section>
);

const AppleGridHalf = ({ 
  title, 
  subtitle, 
  image, 
  dark = false, 
  link = "/login/selection?action=register",
  imageHint = "product",
  ctaText = "Hemen Başla"
}: { 
  title: string, 
  subtitle?: string, 
  image: string, 
  dark?: boolean, 
  link?: string,
  imageHint?: string,
  ctaText?: string
}) => (
  <div className={cn(
    "relative h-[550px] md:h-[600px] overflow-hidden flex flex-col items-center text-center p-12",
    dark ? "bg-black text-white" : "bg-[#fafafa] text-[#1d1d1f] border"
  )}>
    <div className="z-10 space-y-2">
      <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h3>
      {subtitle && <p className="text-lg md:text-xl">{subtitle}</p>}
      <div className="flex items-center justify-center gap-4 pt-2">
        <Link href={link} className="text-[#0066cc] hover:underline flex items-center font-medium group">
          {ctaText} <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
    <div className="absolute inset-0 z-0 mt-32">
      <Image 
        src={image} 
        alt={title} 
        fill 
        className="object-contain object-bottom" 
        data-ai-hint={imageHint}
      />
    </div>
  </div>
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
    <div className="flex flex-col min-h-screen bg-white text-[#1d1d1f] font-sans antialiased overflow-x-hidden">
      <header className="sticky top-0 z-[100] w-full h-12 bg-white/80 backdrop-blur-md border-b border-[#d2d2d7]/50">
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
        <AppleSection 
          title="hangel Hub"
          subtitle="İyilik her anında seninle."
          description="Alışveriş yaparken bağışla, zamanınla gönüllü ol, toplumsal etkiyi birlikte büyütelim."
          image="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80"
          imageHint="happy people group"
          ctaText="Hemen Katıl"
        />

        <AppleSection 
          title="hangel imece"
          subtitle="Yeteneklerini faydaya dönüştür."
          description="Sana en uygun gönüllülük fırsatlarını keşfet, sosyal sorumluluk projelerinde aktif rol al."
          image="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?w=1200&q=80"
          imageHint="volunteers helping"
          dark={true}
          ctaText="Gönüllü Ol"
        />

        <AppleSection 
          title="hangel bağışı"
          subtitle="Alışverişin en anlamlı hali."
          description="Anlaşmalı markalardan yaptığın her harcama, hiçbir ek ücret ödemeden seçtiğin STK'ya bağış olsun."
          image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80"
          imageHint="shopping mall store"
          ctaText="Markaları Keşfet"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-white">
          <AppleGridHalf 
            title="hangel STK"
            subtitle="Sivil toplumun dijital dünyası."
            image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
            imageHint="modern office building"
            dark={true}
            ctaText="STK'nı Kaydet"
          />
          <AppleGridHalf 
            title="hangel Kampüs"
            subtitle="Geleceğin liderleri burada."
            image="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?w=800&q=80"
            imageHint="university campus"
            ctaText="Temsilci Ol"
          />
          <AppleGridHalf 
            title="Üye İşyeri"
            subtitle="QR ile öde, anında bağışla."
            image="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800&q=80"
            imageHint="payment terminal"
            ctaText="Hemen Başvur"
          />
          <AppleGridHalf 
            title="hangel Etki Puanı"
            subtitle="Başarılarını rozetlerle taçlandır."
            image="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80"
            imageHint="award gold coins"
            dark={true}
            ctaText="Puanlarını Gör"
          />
        </div>
      </main>

      <footer className="bg-[#f5f5f7] pt-12 pb-16 px-6 text-[#1d1d1f]">
        <div className="container mx-auto max-w-6xl">
            <div className="flex items-center gap-2 text-[12px] text-[#6e6e73] mb-8 border-b border-[#d2d2d7] pb-4">
                <HangelLogo className="h-3 w-auto opacity-60" />
                <ChevronRight className="h-3 w-3" />
                <span>Hangel</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[#1d1d1f]">Ana Sayfa</span>
            </div>

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

            <div className="pt-8 space-y-4">
              <p className="text-[12px] text-[#6e6e73]">
                Diğer alışveriş seçenekleri: Bir <Link href="/market" className="text-[#0066cc] underline">hangel Markası</Link> bulun veya <Link href="/support" className="text-[#0066cc] underline">destek merkezimizle</Link> iletişime geçin.
              </p>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 text-[12px] text-[#6e6e73] border-t border-[#d2d2d7]">
                <div className="flex flex-col lg:flex-row lg:items-center gap-x-6 gap-y-2">
                  <p>Copyright © 2026 Hangel Hub Inc. Tüm hakları saklıdır.</p>
                  <div className="flex wrap gap-x-4 gap-y-1">
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
