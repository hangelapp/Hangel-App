
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, ChevronRight, ChevronDown, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';

const navItems = [
  { label: 'Market', href: '/market' },
  { label: 'STK\'lar', href: '/ngos' },
  { label: 'Gönüllülük', href: '/volunteering' },
  { label: 'Kulüpler', href: '/admin/clubs' },
  { label: 'Hakkımızda', href: '/about' },
  { label: 'Destek', href: '/support' },
];

const footerLinks = [
  {
    title: 'Keşfet',
    links: [
      { label: 'Market', href: '/market' },
      { label: 'Gönüllülük', href: '/volunteering' },
      { label: 'STK\'lar', href: '/ngos' },
      { label: 'Kulüpler', href: '/admin/clubs' },
      { label: 'Etki Story', href: '/impact-story' },
    ]
  },
  {
    title: 'Kurumsal',
    links: [
      { label: 'Hakkımızda', href: '/about' },
      { label: 'Yatırımcı İlişkileri', href: '/yatirimci-iliskileri' },
      { label: 'Bilgi Toplumu Hizmetleri', href: '/bilgi-toplumu-hizmetleri' },
      { label: 'Basın Odası', href: '/press' },
      { label: 'İletişim', href: '/support' },
    ]
  },
  {
    title: 'Hizmetler',
    links: [
      { label: 'STK Başvurusu', href: '/ngo-onboarding' },
      { label: 'Üye İşyeri Ol', href: '/merchant' },
      { label: 'hangel Cüzdan', href: '/qr-payment' },
      { label: 'Kurumsal Sosyal Sorumluluk', href: '/corporate' },
    ]
  },
  {
    title: 'Yasal',
    links: [
      { label: 'Kullanıcı Sözleşmesi', href: '/settings/contracts/kullanici-sozlesmesi' },
      { label: 'Gizlilik Politikası', href: '/settings/contracts/gizlilik-politikasi' },
      { label: 'Çerez Politikası', href: '/settings/contracts/cerez-politikasi' },
      { label: 'KVKK Aydınlatma', href: '/settings/contracts/kvkk-aydinlatma-metni' },
    ]
  }
];

export default function LoginPage() {
  const { t } = useTranslation();
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const toggleAccordion = (title: string) => {
    setActiveAccordion(activeAccordion === title ? null : title);
  };

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] font-sans antialiased overflow-x-hidden">
      
      {/* Apple-style Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-black/5 h-12 flex items-center">
        <div className="container mx-auto px-4 max-w-5xl flex justify-between items-center h-full">
          <Link href="/login" className="hover:opacity-70 transition-opacity">
            <HangelLogo className="text-xl" />
          </Link>
          <div className="hidden md:flex gap-8 text-[12px] font-normal text-[#1d1d1f]/80">
            {navItems.map(item => (
              <Link key={item.label} href={item.href} className="hover:text-[#1d1d1f] transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-6 items-center">
            <Search className="h-4 w-4 text-[#1d1d1f]/80 cursor-pointer hover:text-[#1d1d1f]" />
            <ShoppingBag className="h-4 w-4 text-[#1d1d1f]/80 cursor-pointer hover:text-[#1d1d1f]" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 text-center bg-[#fafafa]">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            yok öyle yalnız başına mücadele etmek!
          </h1>
          <p className="text-xl md:text-2xl font-medium text-[#86868b]">
            Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button asChild className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-6 h-10 font-semibold">
              <Link href="/login/selection?action=register">Kayıt Ol</Link>
            </Button>
            <Button asChild variant="link" className="text-[#0066cc] hover:underline font-semibold flex items-center gap-1 group">
              <Link href="/login/selection?action=login">Giriş Yap <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Sections */}
      <div className="space-y-3 p-3">
        
        {/* Section 1: hangel imece (iPhone style) */}
        <section className="relative h-[600px] md:h-[700px] rounded-3xl overflow-hidden bg-white group border border-black/5 shadow-sm">
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop" 
              alt="Volunteering" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              data-ai-hint="volunteers working"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10" />
          </div>
          <div className="relative z-10 pt-16 px-8 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">hangel imece</h2>
            <p className="text-xl md:text-2xl mt-3 font-medium opacity-90">Gönüllü ol, etki oluştur.</p>
            <div className="flex justify-center gap-4 mt-6">
              <Button asChild className="rounded-full bg-white text-black hover:bg-white/90 px-6 h-10 font-semibold">
                <Link href="/volunteering">İlanları Keşfet</Link>
              </Button>
              <Button asChild variant="link" className="text-white hover:text-white/80 font-semibold flex items-center gap-1 group">
                <Link href="/about">Daha fazla bilgi <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2: hangel STK (Dark/CreatorStudio style) */}
        <section className="relative h-[600px] md:h-[700px] rounded-3xl overflow-hidden bg-black group border border-white/5">
          <div className="absolute inset-0 z-0 opacity-60">
            <Image 
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop" 
              alt="NGO Tools" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              data-ai-hint="team high five"
            />
          </div>
          <div className="relative z-10 pt-16 px-8 text-center text-white flex flex-col h-full">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center justify-center gap-2">
              <span className="text-primary">hangel</span> STK
            </h2>
            <p className="text-xl md:text-2xl mt-3 font-medium opacity-90">Kuruluşunu dijitalleştir, etkiyi büyüt.</p>
            <div className="flex justify-center gap-4 mt-6">
              <Button asChild className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-6 h-10 font-semibold border-none">
                <Link href="/ngo-onboarding">Hemen Başvur</Link>
              </Button>
              <Button asChild variant="link" className="text-[#0066cc] hover:text-[#0071e3] font-semibold flex items-center gap-1 group">
                <Link href="/ngo-onboarding">Daha fazla bilgi <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></Link>
              </Button>
            </div>
            
            {/* Visual Grid Mockup */}
            <div className="mt-auto mb-16 px-4">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto opacity-80">
                {['Şeffaflık', 'Bağış', 'Gönüllü', 'Analiz', 'CRM', 'Web'].map((tool, i) => (
                  <div key={i} className="aspect-square bg-white/10 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-2 border border-white/10 group-hover:border-primary/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{tool}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Section 3: hangel bağışı (iPad Air style) */}
          <section className="relative h-[500px] rounded-3xl overflow-hidden bg-[#f5f5f7] group border border-black/5">
            <div className="absolute inset-0 z-0">
              <Image 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" 
                alt="Marketplace" 
                fill 
                className="object-cover opacity-20 transition-transform duration-700 group-hover:scale-105"
                data-ai-hint="shopping boutique"
              />
            </div>
            <div className="relative z-10 pt-12 px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">hangel bağışı</h2>
              <p className="text-lg mt-2 font-medium text-[#86868b]">Alışverişin iyiliğe dönüşsün.</p>
              <div className="flex justify-center gap-4 mt-4">
                <Button asChild className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-5 h-9 text-sm font-semibold">
                  <Link href="/market">Alışverişe Başla</Link>
                </Button>
                <Button asChild variant="link" className="text-[#0066cc] hover:underline text-sm font-semibold flex items-center gap-1 group">
                  <Link href="/market">Daha fazla bilgi <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" /></Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Section 4: hangel Kampüs (MacBook style) */}
          <section className="relative h-[500px] rounded-3xl overflow-hidden bg-white group border border-black/5">
            <div className="absolute inset-0 z-0">
              <Image 
                src="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop" 
                alt="Campus" 
                fill 
                className="object-cover opacity-30 transition-transform duration-700 group-hover:scale-105"
                data-ai-hint="university library students"
              />
            </div>
            <div className="relative z-10 pt-12 px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">hangel Kampüs</h2>
              <p className="text-lg mt-2 font-medium text-[#86868b]">Gençlik enerjisini etkiye dönüştür.</p>
              <div className="flex justify-center gap-4 mt-4">
                <Button asChild className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-5 h-9 text-sm font-semibold">
                  <Link href="/admin/clubs">Kulüpleri Keşfet</Link>
                </Button>
                <Button asChild variant="link" className="text-[#0066cc] hover:underline text-sm font-semibold flex items-center gap-1 group">
                  <Link href="/admin/clubs">Daha fazla bilgi <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" /></Link>
                </Button>
              </div>
            </div>
          </section>

        </div>

        {/* Bottom Banner: Üye İşyeri (Watch style) */}
        <section className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden bg-[#1d1d1f] group">
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop" 
              alt="Merchant" 
              fill 
              className="object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
              data-ai-hint="contactless payment"
            />
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8 text-white">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Üye İşyeri</h2>
            <p className="text-lg mt-2 font-medium opacity-80 max-w-md">hangel QR Ödeme sistemiyle her işlemde toplumsal fayda sağla.</p>
            <div className="flex justify-center gap-4 mt-6">
              <Button asChild className="rounded-full bg-white text-black hover:bg-white/90 px-6 h-10 font-semibold">
                <Link href="/merchant">Başvur</Link>
              </Button>
              <Button asChild variant="link" className="text-white hover:text-white/80 font-semibold flex items-center gap-1 group">
                <Link href="/merchant">Daha fazla bilgi <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></Link>
              </Button>
            </div>
          </div>
        </section>

      </div>

      {/* Apple-style Detailed Footer */}
      <footer className="bg-[#f5f5f7] pt-12 pb-8 px-4 mt-8">
        <div className="container mx-auto max-w-5xl">
          
          {/* Breadcrumbs / System Notes */}
          <div className="text-[12px] text-[#86868b] leading-relaxed pb-6 border-b border-black/10">
            <p>1. hangel bağışı üzerinden yapılan her alışverişin bağış oranı markadan markaya ve kategoriden kategoriye değişiklik gösterebilir. Güncel oranlar için market sayfasını ziyaret edin.</p>
            <p className="mt-2">2. Gönüllülük sertifikaları, ilgili STK tarafından faaliyet tamamlandıktan sonra dijital olarak oluşturulur.</p>
            <p className="mt-4 flex items-center gap-2">
              <HangelLogo className="text-sm opacity-50" /> <ChevronRight className="h-3 w-3" /> <span className="text-[#1d1d1f]">Giriş</span>
            </p>
          </div>

          {/* Nav Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8">
            {footerLinks.map(group => (
              <div key={group.title} className="space-y-4">
                {/* Desktop Title */}
                <h4 className="hidden md:block text-[12px] font-bold text-[#1d1d1f] uppercase tracking-wider">{group.title}</h4>
                
                {/* Mobile Accordion Header */}
                <button 
                  onClick={() => toggleAccordion(group.title)}
                  className="md:hidden w-full flex justify-between items-center py-2 text-[14px] font-medium border-b border-black/5"
                >
                  {group.title}
                  {activeAccordion === group.title ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                </button>

                {/* Links */}
                <ul className={cn(
                  "space-y-2 md:block",
                  activeAccordion === group.title ? "block" : "hidden"
                )}>
                  {group.links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-[12px] text-[#424245] hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-black/10">
            <p className="text-[12px] text-[#86868b]">
              Diğer alışveriş seçenekleri: Bir <Link href="/market" className="text-[#0066cc] underline">hangel Markası</Link> bulun veya <Link href="/support" className="text-[#0066cc] underline">destek ekibimizle</Link> iletişime geçin.
            </p>
            <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-[12px] text-[#86868b]">Copyright © 2026 hangel Hub Inc. Tüm hakları saklıdır.</p>
              <div className="flex flex-wrap gap-4 text-[12px] text-[#424245]">
                <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
                <Link href="/settings/contracts/cerez-politikasi" className="hover:underline">Çerezlerin Kullanımı</Link>
                <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline">Kullanım Şartları</Link>
                <Link href="/support" className="hover:underline">Satış ve İade</Link>
                <Link href="/about" className="hover:underline">Yasal Bilgiler</Link>
                <Link href="/press" className="hover:underline">Site Haritası</Link>
              </div>
              <p className="text-[12px] text-[#424245] font-medium">Türkiye</p>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
