'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { 
  Globe, ChevronRight
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';
import { translations } from '@/lib/translations';
import type { Language, Translation } from '@/lib/translations';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const languages: {value: Language, label: string}[] = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
];

export default function LoginPage() {
  const [language, setLanguage] = useState<Language>('tr');
  const [selectedTranslations, setSelectedTranslations] = useState<Translation>(translations.tr);

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    setSelectedTranslations(translations[value] || translations.tr);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Simple Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b">
        <HangelLogo className="text-2xl" />
        <Select value={language} onValueChange={(value) => handleLanguageChange(value as Language)}>
            <SelectTrigger className="w-auto border-none bg-transparent gap-2 h-auto py-1 text-xs font-medium">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
                {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </header>

      {/* Simplified Main Content - Only Login Button */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/50">
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#042654]">
                hangel Hub'a Hoş Geldiniz
            </h1>
            <Button size="lg" asChild className="h-16 px-12 text-xl font-bold rounded-2xl shadow-xl hover:shadow-primary/20 transition-all scale-110 active:scale-95">
                <Link href="/login/selection?action=login">Giriş Yap</Link>
            </Button>
        </div>
      </main>

      {/* Apple Style Footer */}
      <footer className="bg-[#f5f5f7] py-12 px-6 border-t text-[#1d1d1f]">
        <div className="container mx-auto max-w-5xl space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[#6e6e73] font-medium">
                <HangelLogo className="text-lg opacity-70" />
                <ChevronRight className="h-3 w-3" />
                <span>Giriş Yap</span>
            </div>

            {/* Accordion Menus (Mobile) / Grid (Desktop) */}
            <div className="block lg:hidden">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="apps" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">Hangel Uygulamaları</AccordionTrigger>
                        <AccordionContent className="text-xs flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="#">iOS Uygulaması</Link>
                            <Link href="#">Android Uygulaması</Link>
                            <Link href="#">AppGallery</Link>
                            <Link href="#">Chrome Mağazası</Link>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="account" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">Hesap ve Cüzdan</AccordionTrigger>
                        <AccordionContent className="text-xs flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/profile">Hangel Hesabım</Link>
                            <Link href="/qr-payment">Cüzdanım</Link>
                            <Link href="/my-donations">Bağışlarım</Link>
                            <Link href="/my-applications">Başvurularım</Link>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="support" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">Destek ve Yardım</AccordionTrigger>
                        <AccordionContent className="text-xs flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/support">Destek Merkezi</Link>
                            <Link href="/support/faq">Sıkça Sorulan Sorular</Link>
                            <Link href="/support/guides">Rehberler</Link>
                            <Link href="/support/contact">Bize Ulaşın</Link>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="corporate" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">Kurumsal</AccordionTrigger>
                        <AccordionContent className="text-xs flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/about">Hakkımızda</Link>
                            <Link href="/corporate">Kamu İlişkileri</Link>
                            <Link href="/yatirimci-iliskileri">Yatırımcı İlişkileri</Link>
                            <Link href="/bilgi-toplumu-hizmetleri">Bilgi Toplumu Hizmetleri</Link>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            {/* Grid View (Desktop Only) */}
            <div className="hidden lg:grid grid-cols-4 gap-8">
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold">Hangel Uygulamaları</h4>
                    <ul className="text-xs flex flex-col gap-2 text-[#424245]">
                        <li><Link href="#" className="hover:underline">iOS Uygulaması</Link></li>
                        <li><Link href="#" className="hover:underline">Android Uygulaması</Link></li>
                        <li><Link href="#" className="hover:underline">AppGallery</Link></li>
                        <li><Link href="#" className="hover:underline">Chrome Mağazası</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold">Hesap ve Cüzdan</h4>
                    <ul className="text-xs flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/profile" className="hover:underline">Hangel Hesabım</Link></li>
                        <li><Link href="/qr-payment" className="hover:underline">Cüzdanım</Link></li>
                        <li><Link href="/my-donations" className="hover:underline">Bağışlarım</Link></li>
                        <li><Link href="/my-applications" className="hover:underline">Başvurularım</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold">Destek ve Yardım</h4>
                    <ul className="text-xs flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/support" className="hover:underline">Destek Merkezi</Link></li>
                        <li><Link href="/support/faq" className="hover:underline">Sıkça Sorulan Sorular</Link></li>
                        <li><Link href="/support/guides" className="hover:underline">Rehberler</Link></li>
                        <li><Link href="/support/contact" className="hover:underline">Bize Ulaşın</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold">Kurumsal</h4>
                    <ul className="text-xs flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/about" className="hover:underline">Hakkımızda</Link></li>
                        <li><Link href="/corporate" className="hover:underline">Kamu İlişkileri</Link></li>
                        <li><Link href="/yatirimci-iliskileri" className="hover:underline">Yatırımcı İlişkileri</Link></li>
                        <li><Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link></li>
                    </ul>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="text-xs text-[#6e6e73] space-y-4 pt-4">
                <p>
                    Başka bir sorunuz mu var? <Link href="/support" className="text-[#0066cc] hover:underline">Destek Merkezi'ni</Link> ziyaret edin veya <span className="whitespace-nowrap">+90 554 700 70 07</span> numaralı telefonu arayın.
                </p>
                <Separator className="bg-[#d2d2d7]" />
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="order-2 lg:order-1 flex flex-col lg:flex-row gap-4">
                        <span>© 2026 hangel.org. Tüm hakları saklıdır.</span>
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
                    <div className="order-1 lg:order-2 font-semibold hover:underline cursor-pointer">
                        Türkiye
                    </div>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
