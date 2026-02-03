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

const AppleHeroSection = ({ 
  title, 
  subtitle, 
  image, 
  dark = false, 
  primaryCta = "Daha fazla bilgi",
  secondaryCta = "Hemen Katıl",
  link = "/login/selection?action=register",
  imageHint = "product image",
  className
}: { 
  title: string, 
  subtitle?: string, 
  image?: string, 
  dark?: boolean, 
  primaryCta?: string,
  secondaryCta?: string,
  link?: string,
  imageHint?: string,
  className?: string
}) => (
  <section className={cn(
    "relative flex flex-col items-center justify-start text-center overflow-hidden pt-12 md:pt-16 mb-3",
    dark ? "bg-black text-white" : "bg-[#f5f5f7] text-[#1d1d1f]",
    className
  )}>
    <div className="z-10 px-6 space-y-1 max-w-4xl mb-8">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-xl md:text-2xl font-medium">{subtitle}</p>}
      <div className="pt-4 flex items-center justify-center gap-6">
        <Button asChild className="rounded-full px-6 h-10 bg-[#0066cc] hover:bg-[#0071e3] text-white border-none font-normal text-sm md:text-base">
          <Link href={link}>{primaryCta}</Link>
        </Button>
        <Button asChild variant="link" className="text-[#0066cc] hover:text-[#0066cc] p-0 h-auto font-normal text-sm md:text-lg group">
          <Link href={link}>
            {secondaryCta} <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
    {image && (
      <div className="relative w-full h-[400px] md:h-[500px] max-w-5xl mx-auto">
        <Image 
          src={image} 
          alt={title} 
          fill 
          className="object-contain object-top select-none" 
          data-ai-hint={imageHint}
        />
      </div>
    )}
  </section>
);

const AppleGridSection = ({ 
  title, 
  subtitle, 
  image, 
  dark = false, 
  primaryCta = "Daha fazla bilgi",
  secondaryCta = "İnceleyin",
  link = "/login/selection?action=register",
  imageHint = "product image",
  className
}: { 
  title: string, 
  subtitle?: string, 
  image?: string, 
  dark?: boolean, 
  primaryCta?: string,
  secondaryCta?: string,
  link?: string,
  imageHint?: string,
  className?: string
}) => (
  <div className={cn(
    "relative flex flex-col items-center justify-start text-center overflow-hidden pt-12 rounded-3xl h-[500px] md:h-[600px]",
    dark ? "bg-black text-white" : "bg-[#f5f5f7] text-[#1d1d1f]",
    className
  )}>
    <div className="z-10 px-6 space-y-1 mb-6">
      <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h3>
      {subtitle && <p className="text-lg md:text-xl font-medium">{subtitle}</p>}
      <div className="pt-2 flex items-center justify-center gap-4">
        <Button asChild variant="link" className="text-[#0066cc] hover:text-[#0066cc] p-0 h-auto font-normal text-sm md:text-base group">
          <Link href={link}>
            {primaryCta} <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
        <Button asChild variant="link" className="text-[#0066cc] hover:text-[#0066cc] p-0 h-auto font-normal text-sm md:text-base group">
          <Link href={link}>
            {secondaryCta} <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
    {image && (
      <div className="relative w-full flex-1">
        <Image 
          src={image} 
          alt={title} 
          fill 
          className="object-contain object-bottom select-none p-4" 
          data-ai-hint={imageHint}
        />
      </div>
    )}
  </div>
);

const FooterNav = () => {
  const { t } = useTranslation();
  const sections = [
    {
      title: t('nav.search'),
      links: [
        { label: t('nav.market'), href: "/market" },
        { label: t('nav.volunteering'), href: "/volunteering" },
        { label: t('nav.ngos'), href: "/ngos" },
        { label: t('nav.clubs'), href: "/admin/clubs" },
        { label: t('nav.leaderboard'), href: "/leaderboard" },
        { label: t('nav.impactStory'), href: "/impact-story" },
      ]
    },
    {
      title: "Hesap ve Ödemeler",
      links: [
        { label: t('nav.login'), href: "/login/selection?action=login" },
        { label: "Bireysel Kayıt", href: "/login/selection?action=register&type=individual" },
        { label: "Kurumsal Başvuru", href: "/login/selection?action=register&type=corporate" },
        { label: "QR Ödeme", href: "/qr-payment" },
        { label: t('nav.donations'), href: "/my-donations" },
        { label: "Rozetlerim", href: "/my-badges" },
      ]
    },
    {
      title: "Kurumsal",
      links: [
        { label: t('nav.about'), href: "/about" },
        { label: "Kamu İlişkileri", href: "/corporate" },
        { label: "Yatırımcı İlişkileri", href: "/yatirimci-iliskileri" },
        { label: "Basın Odası", href: "/press" },
        { label: t('nav.library'), href: "/library" },
        { label: "İletişim", href: "/about" },
      ]
    },
    {
      title: "İş Ortaklığı ve Destek",
      links: [
        { label: t('nav.merchant'), href: "/merchant" },
        { label: t('nav.ngoOnboarding'), href: "/ngo-onboarding" },
        { label: "Destek Merkezi", href: "/support" },
        { label: t('nav.invite'), href: "/invite" },
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
  const { language, changeLanguage, t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#1d1d1f] font-sans antialiased overflow-x-hidden">
      {/* Apple-style Navigation Bar */}
      <header className="sticky top-0 z-50 w-full h-11 bg-white/80 backdrop-blur-md border-b border-[#d2d2d7]/50">
        <div className="container mx-auto h-full max-w-5xl px-4 flex items-center justify-between">
          <div className="flex-1 flex justify-start items-center">
            <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
              <HangelLogo className="text-xl tracking-tighter" />
            </Link>
          </div>

          <nav className="hidden md:flex flex-1 justify-center items-center gap-6 text-[12px] font-normal text-[#1d1d1f]/80">
            <Link href="/market" className="hover:text-[#1d1d1f] transition-colors">{t('nav.market')}</Link>
            <Link href="/volunteering" className="hover:text-[#1d1d1f] transition-colors">{t('nav.volunteering')}</Link>
            <Link href="/ngos" className="hover:text-[#1d1d1f] transition-colors">{t('nav.ngos')}</Link>
          </nav>

          <div className="flex-1 flex justify-end items-center gap-5 opacity-80">
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogTrigger asChild>
                    <Search className="h-4 w-4 cursor-pointer hover:text-primary transition-colors" />
                </DialogTrigger>
                <DialogContent className="sm:max-w-md top-[20%]">
                    <DialogHeader>
                        <DialogTitle>{t('nav.search')}</DialogTitle>
                    </DialogHeader>
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
            <Link href="/market" className="hover:text-primary transition-colors">
              <ShoppingBag className="h-4 w-4 cursor-pointer" />
            </Link>
            <Link href="/volunteering" className="hover:text-primary transition-colors">
              <HandWithHeartIcon className="h-4 w-4 cursor-pointer" />
            </Link>
            <div className="md:hidden">
              <Menu className="h-4 w-4 cursor-pointer" />
            </div>
            <Select value={language} onValueChange={changeLanguage}>
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
        {/* Hero Section - Main Banner */}
        <section className="bg-white py-20 text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Hangel Hub</h1>
          <p className="text-xl md:text-2xl font-medium">İyilik paylaştıkça büyür.</p>
          <div className="pt-4">
            <Button asChild className="rounded-full px-8 h-12 bg-[#0066cc] hover:bg-[#0071e3] text-white font-normal text-lg">
              <Link href="/login/selection?action=register">Hemen Başlayın</Link>
            </Button>
          </div>
        </section>

        {/* Section 1 - iPhone Style (hangel imece) */}
        <AppleHeroSection 
          title="hangel imece"
          subtitle="Yetkinliklerin toplumsal faydaya dönüşsün."
          image="https://images.unsplash.com/photo-1521119989659-a83eee488004?w=1080&q=80"
          imageHint="smiling person portrait"
          primaryCta="Gönüllü Ol"
          secondaryCta="İncele"
        />

        {/* Section 2 - CreatorStudio style (hangel STK) */}
        <section className="relative flex flex-col items-center justify-start text-center overflow-hidden pt-12 md:pt-16 mb-3 bg-black text-white min-h-[600px]">
          <div className="z-10 px-6 space-y-1 mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <HangelLogo className="text-white text-3xl" />
              <span className="text-3xl font-bold">STK</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Dijital Dönüşüm</h2>
            <p className="text-xl md:text-2xl font-medium text-white/80">Kuruluşunu büyüt, etkiyi ölç.</p>
            <div className="pt-4 flex items-center justify-center gap-6">
              <Button asChild className="rounded-full px-6 h-10 bg-[#0066cc] hover:bg-[#0071e3] text-white border-none font-normal text-sm md:text-base">
                <Link href="/ngo-onboarding">Daha fazla bilgi</Link>
              </Button>
              <Button asChild variant="link" className="text-[#0066cc] hover:text-[#0066cc] p-0 h-auto font-normal text-sm md:text-lg group">
                <Link href="/login/selection?action=register&type=corporate">
                  Hemen Başvur <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden pb-12">
             <div className="grid grid-cols-3 md:grid-cols-5 gap-4 px-6">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} className="w-20 h-20 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border border-white/10 shadow-2xl">
                    <HangelLogo className="text-white/20 scale-150" />
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* Section 3 - iPad Air style (hangel bağışı) */}
        <AppleHeroSection 
          title="hangel bağışı"
          subtitle="Alışverişin iyiliğe dönüşsün."
          className="bg-[#eef4f9]"
          image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80"
          imageHint="modern analytics dashboard"
          primaryCta="Market'i Keşfet"
          secondaryCta="Nasıl çalışır?"
        />

        {/* Section 4 - Grid style (Watch & Others) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 px-3">
          <AppleGridSection 
            title="Etki Story"
            subtitle="Başarılarını hikayene taşı."
            image="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?w=800&q=80"
            imageHint="volunteers celebrating"
            dark={true}
          />
          <AppleGridSection 
            title="Rozetler"
            subtitle="Katkılarınla seviye atla."
            image="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80"
            imageHint="golden award medal"
          />
        </div>

        {/* Section 5 - MacBook Pro style (Transparency) */}
        <AppleHeroSection 
          title="Şeffaflık Endeksi"
          subtitle="Güvenle bağış yapın."
          dark={true}
          image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&q=80"
          imageHint="modern office building"
          primaryCta="Raporları Gör"
          secondaryCta="İncele"
        />

        {/* Section 6 - MacBook Air style (Campus) */}
        <AppleHeroSection 
          title="hangel Kampüs"
          subtitle="Geleceğin liderleri burada."
          className="bg-white"
          image="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?w=1080&q=80"
          imageHint="university students"
          primaryCta="Temsilci Ol"
          secondaryCta="Detaylar"
        />

        {/* Section 7 - Watch Ultra style (Üye İşyeri) */}
        <section className="relative flex flex-col items-center justify-start text-center overflow-hidden pt-12 md:pt-16 mb-3 bg-black text-white min-h-[700px]">
          <div className="z-10 px-6 space-y-1 mb-8">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Üye İşyeri</h2>
            <p className="text-xl md:text-2xl font-medium text-white/80">QR Kod ile iyiliği her yere taşı.</p>
            <div className="pt-4 flex items-center justify-center gap-6">
              <Button asChild className="rounded-full px-6 h-10 bg-white hover:bg-white/90 text-black border-none font-normal text-sm md:text-base">
                <Link href="/merchant">Hemen Başvur</Link>
              </Button>
              <Button asChild variant="link" className="text-white hover:text-white/80 p-0 h-auto font-normal text-sm md:text-lg group">
                <Link href="/support">
                  Destek Al <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
             <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_100px_rgba(243,71,35,0.3)] animate-pulse">
                <div className="w-48 h-48 md:w-80 md:h-80 bg-white rounded-3xl p-4 md:p-8 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <Image src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=hangel" alt="QR Payment" fill className="object-contain" />
                  </div>
                </div>
             </div>
          </div>
        </section>
      </main>

      {/* Apple-style Comprehensive Footer */}
      <footer className="bg-[#f5f5f7] pt-12 pb-16 px-6 border-t border-[#d2d2d7] text-[#1d1d1f]">
        <div className="container mx-auto h-full max-w-5xl">
            {/* Footnotes */}
            <div className="text-[12px] text-[#6e6e73] leading-relaxed space-y-4 border-b border-[#d2d2d7] pb-6 mb-8">
                <p>
                  * hangel bağışı kapsamında sunulan oranlar anlaşmalı markalara göre değişiklik gösterebilir. Bağış tutarları, yasal vergiler ve hangel hizmet bedeli kesildikten sonra STK'ya aktarılır.
                </p>
                <p>
                  Sosyal Etki Puanı ve kazanılan rozetler hangel platformu içi ödüllendirme sistemidir ve nakit karşılığı bulunmamaktadır. Gönüllülük faaliyetleri, ilgili STK'ların onayına tabidir.
                </p>
            </div>

            {/* Apple-style Breadcrumb */}
            <div className="flex items-center gap-2 text-[12px] text-[#6e6e73] mb-8">
                <HangelLogo className="h-3 w-auto opacity-60" />
                <ChevronRight className="h-3 w-3" />
                <span className="hover:text-[#1d1d1f] cursor-pointer">Kurumsal</span>
            </div>

            {/* Navigation Sections */}
            <FooterNav />

            {/* Bottom Footer Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-[12px] text-[#6e6e73]">
                <div className="flex flex-col md:flex-row md:items-center gap-x-6 gap-y-2">
                    <p>Telif Hakkı © 2026 hangel.org. Tüm hakları saklıdır.</p>
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <Link href="/settings/contracts/gizlilik-politikasi" className="hover:text-[#1d1d1f] hover:underline border-r border-[#d2d2d7] pr-2 last:border-0">Gizlilik Politikası</Link>
                        <Link href="/settings/contracts/cerez-politikasi" className="hover:text-[#1d1d1f] hover:underline border-r border-[#d2d2d7] pr-2 last:border-0">Çerez Politikası</Link>
                        <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:text-[#1d1d1f] hover:underline border-r border-[#d2d2d7] pr-2 last:border-0">Kullanım Şartları</Link>
                        <Link href="/bilgi-toplumu-hizmetleri" className="hover:text-[#1d1d1f] hover:underline">Bilgi Toplumu Hizmetleri</Link>
                    </div>
                </div>
                <div className="flex items-center gap-1 hover:text-[#1d1d1f] cursor-pointer">
                  Türkiye
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
