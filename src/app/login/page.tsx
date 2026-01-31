'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { 
  Globe, ChevronRight, Sparkles, HeartHandshake, HandCoins, Award, ArrowRight, Bot, 
  Search, ShieldCheck, Mail, Phone, MapPin, Instagram, Twitter, Linkedin, Facebook, 
  MessageSquare, Heart, Users, Camera, Filter, ArrowDownUp, ShoppingBag, Menu,
  Zap, Info, ShieldAlert, Star, Store
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const languages = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
];

const AppleSection = ({ 
  title, 
  subtitle, 
  description, 
  image, 
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
  image: string, 
  dark?: boolean, 
  fullWidth?: boolean,
  primaryCta?: string,
  secondaryCta?: string,
  link?: string,
  imageHint?: string
}) => (
  <section className={cn(
    "relative flex flex-col items-center justify-start text-center overflow-hidden pt-12 md:pt-16",
    fullWidth ? "w-full h-[550px] md:h-[650px] mb-3" : "h-[500px] rounded-3xl mx-3 mb-3",
    dark ? "bg-black text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
  )}>
    <div className="z-10 px-6 space-y-2 max-w-2xl">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-xl md:text-2xl font-medium">{subtitle}</p>}
      {description && <p className={cn("text-base md:text-lg mt-2", dark ? "text-[#a1a1a6]" : "text-[#86868b]")}>{description}</p>}
      <div className="pt-4 flex items-center justify-center gap-6">
        <Button asChild className="rounded-full px-6 h-10 bg-[#0066cc] hover:bg-[#0071e3] text-white border-none font-normal">
          <Link href={link}>{primaryCta}</Link>
        </Button>
        <Button variant="link" className="text-[#0066cc] hover:text-[#0066cc] p-0 h-auto font-normal text-lg group">
          {secondaryCta} <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
    <div className="relative w-full h-full mt-8">
      <Image 
        src={image} 
        alt={title} 
        fill 
        className="object-contain object-bottom select-none" 
        data-ai-hint={imageHint}
      />
    </div>
  </section>
);

export default function LoginPage() {
  const [language, setLanguage] = useState('tr');

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#1d1d1f] font-sans antialiased">
      {/* Apple Global Navigation */}
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
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center text-center bg-white py-20 px-6 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">hangel Hub</h1>
          <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto">İyiliğin ve sosyal etkinin yeni nesil hali.</p>
          <div className="pt-4">
            <Button asChild size="lg" className="rounded-full px-10 h-12 bg-[#0066cc] hover:bg-[#0071e3] text-white border-none text-lg font-normal">
              <Link href="/login/selection?action=login">Giriş Yap</Link>
            </Button>
          </div>
        </section>

        {/* hangel imece */}
        <AppleSection 
          title="hangel imece"
          subtitle="Yetkinliklerin toplumsal faydaya dönüşsün."
          description="Gönüllü ol, imece ruhuyla toplumsal sorunlara çözüm üret."
          image="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop"
          imageHint="volunteering hands together"
        />

        {/* hangel bağışı */}
        <AppleSection 
          title="hangel bağışı"
          subtitle="Alışverişin iyiliğe dönüşsün."
          description="Ek bir ödeme yapmadan, seçtiğin STK'ya %15'e varan oranlarda bağış yap."
          image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop"
          imageHint="shopping bags donation"
          dark={true}
          primaryCta="Bağış Sistemini Keşfet"
        />

        {/* Two Column Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 px-3">
          {/* Sosyal Etki Puanı */}
          <AppleSection 
            title="Etki Puanı"
            subtitle="İyiliğin bir karşılığı var."
            image="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop"
            imageHint="abstract colorful sparks"
            fullWidth={false}
            primaryCta="Puanını Gör"
          />
          {/* Acil Durum */}
          <AppleSection 
            title="Acil Durum" 
            subtitle="Zor zamanda topluluk gücü." 
            image="https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=2070&auto=format&fit=crop" 
            imageHint="emergency siren red" 
            fullWidth={false} 
            primaryCta="Yardım Çağır" 
            dark={true}
          />
        </div>

        {/* Şeffaflık Endeksi */}
        <AppleSection 
          title="Şeffaflık Endeksi"
          subtitle="Güvenle bağış yapın."
          description="STK'ların şeffaflık raporlarını anlık olarak takip edin."
          image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
          imageHint="analytics dashboard transparency"
          primaryCta="Raporları İncele"
        />
      </main>

      {/* Official Apple-Style Footer */}
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

            <nav className="flex items-center gap-2 text-[12px] text-[#6e6e73] font-normal py-4">
                <Link href="/" className="hover:text-[#1d1d1f] transition-colors"><HangelLogo className="text-lg opacity-70" /></Link>
                <ChevronRight className="h-3 w-3 opacity-50" />
                <span>Giriş Yap</span>
            </nav>

            <div className="block lg:hidden">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="apps" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-[12px] font-semibold py-3 hover:no-underline">Hangel Uygulamaları</AccordionTrigger>
                        <AccordionContent className="text-[12px] flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="#" className="hover:underline">iOS Uygulaması</Link>
                            <Link href="#" className="hover:underline">Android Uygulaması</Link>
                            <Link href="#" className="hover:underline">AppGallery</Link>
                            <Link href="#" className="hover:underline">Chrome Mağazası</Link>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="account" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-[12px] font-semibold py-3 hover:no-underline">Hesap ve Cüzdan</AccordionTrigger>
                        <AccordionContent className="text-[12px] flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/profile" className="hover:underline">Hangel Hesabım</Link>
                            <Link href="/qr-payment" className="hover:underline">Cüzdanım</Link>
                            <Link href="/my-donations" className="hover:underline">Bağışlarım</Link>
                            <Link href="/my-applications" className="hover:underline">Başvurularım</Link>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="support" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-[12px] font-semibold py-3 hover:no-underline">Destek ve Yardım</AccordionTrigger>
                        <AccordionContent className="text-[12px] flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/support" className="hover:underline">Destek Merkezi</Link>
                            <Link href="/support/faq" className="hover:underline">Sıkça Sorulan Sorular</Link>
                            <Link href="/support/guides" className="hover:underline">Rehberler</Link>
                            <Link href="/support/contact" className="hover:underline">Bize Ulaşın</Link>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="corporate" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-[12px] font-semibold py-3 hover:no-underline">Kurumsal</AccordionTrigger>
                        <AccordionContent className="text-[12px] flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/about" className="hover:underline">Hakkımızda</Link>
                            <Link href="/corporate" className="hover:underline">Kamu İlişkileri</Link>
                            <Link href="/yatirimci-iliskileri" className="hover:underline">Yatırımcı İlişkileri</Link>
                            <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            <div className="hidden lg:grid grid-cols-4 gap-8">
                <div className="space-y-4">
                    <h4 className="text-[12px] font-semibold text-[#1d1d1f]">Hangel Uygulamaları</h4>
                    <ul className="text-[12px] flex flex-col gap-2 text-[#424245]">
                        <li><Link href="#" className="hover:underline">iOS Uygulaması</Link></li>
                        <li><Link href="#" className="hover:underline">Android Uygulaması</Link></li>
                        <li><Link href="#" className="hover:underline">AppGallery</Link></li>
                        <li><Link href="#" className="hover:underline">Chrome Mağazası</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[12px] font-semibold text-[#1d1d1f]">Hesap ve Cüzdan</h4>
                    <ul className="text-[12px] flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/profile" className="hover:underline">Hangel Hesabım</Link></li>
                        <li><Link href="/qr-payment" className="hover:underline">Cüzdanım</Link></li>
                        <li><Link href="/my-donations" className="hover:underline">Bağışlarım</Link></li>
                        <li><Link href="/my-applications" className="hover:underline">Başvurularım</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[12px] font-semibold text-[#1d1d1f]">Destek ve Yardım</h4>
                    <ul className="text-[12px] flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/support" className="hover:underline">Destek Merkezi</Link></li>
                        <li><Link href="/support/faq" className="hover:underline">Sıkça Sorulan Sorular</Link></li>
                        <li><Link href="/support/guides" className="hover:underline">Rehberler</Link></li>
                        <li><Link href="/support/contact" className="hover:underline">Bize Ulaşın</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[12px] font-semibold text-[#1d1d1f]">Kurumsal</h4>
                    <ul className="text-[12px] flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/about" className="hover:underline">Hakkımızda</Link></li>
                        <li><Link href="/corporate" className="hover:underline">Kamu İlişkileri</Link></li>
                        <li><Link href="/yatirimci-iliskileri" className="hover:underline">Yatırımcı İlişkileri</Link></li>
                        <li><Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link></li>
                    </ul>
                </div>
            </div>

            <div className="text-[12px] text-[#6e6e73] space-y-4 pt-4 border-t border-[#d2d2d7]">
                <p className="leading-relaxed">
                    Başka bir sorunuz mu var? <Link href="/support" className="text-[#0066cc] hover:underline">Destek Merkezi'ni</Link> ziyaret edin veya <span className="whitespace-nowrap font-medium text-[#1d1d1f]">+90 554 700 70 07</span> numaralı telefonu arayın.
                </p>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="order-2 lg:order-1 flex flex-col lg:flex-row gap-4">
                        <span className="font-normal">© 2026 hangel.org. Tüm hakları saklıdır.</span>
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                            <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
                            <span className="text-[#d2d2d7]">|</span>
                            <Link href="/settings/contracts/cerez-politikasi" className="hover:underline">Çerez Politikası</Link>
                            <span className="text-[#d2d2d7]">|</span>
                            <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline">Kullanım Şartları</Link>
                            <span className="text-[#d2d2d7]">|</span>
                            <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 font-semibold text-[#1d1d1f] hover:underline cursor-pointer transition-colors">
                        Türkiye
                    </div>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
