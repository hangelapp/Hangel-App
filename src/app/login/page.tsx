
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { Globe, ArrowRight, Store, HeartHandshake, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';
import { translations } from '@/lib/translations';
import type { Language, Translation } from '@/lib/translations';
import { allEntityLists } from '@/lib/data';
import Image from 'next/image';

const languages: {value: Language, label: string}[] = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'ar', label: 'العربية' },
    { value: 'zh', label: '中文' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'pt', label: 'Português' },
    { value: 'ru', label: 'Русский' },
    { value: 'ja', label: '日本語' },
    { value: 'bn', label: 'বাংলা' },
    { value: 'pa', label: 'ਪੰਜਾਬੀ' },
    { value: 'jv', label: 'Basa Jawa' },
    { value: 'ko', label: '한국어' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'te', label: 'తెలుగు' },
    { value: 'mr', label: 'మరాठी' },
    { value: 'ta', label: 'தமிழ்' },
    { value: 'ur', label: 'اردو' },
    { value: 'it', label: 'Italiano' },
];

export default function LoginPage() {
  const [language, setLanguage] = useState<Language>('tr');
  const [selectedTranslations, setSelectedTranslations] = useState<Translation>(translations.tr);

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    setSelectedTranslations(translations[value] || translations.tr);
  };

  const brands = allEntityLists.slice(0, 24);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md border-b">
        <HangelLogo className="text-2xl" />
        <div className="flex items-center gap-4">
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
            <Button variant="ghost" asChild size="sm">
                <Link href="/login/selection?action=login">Giriş Yap</Link>
            </Button>
            <Button asChild size="sm">
                <Link href="/login/selection?action=register">Kayıt Ol</Link>
            </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden bg-slate-50">
        <div className="container mx-auto text-center space-y-8">
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#042654] leading-[1.1] max-w-4xl mx-auto">
                    {selectedTranslations.title}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
                    {selectedTranslations.subtitle}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button size="lg" asChild className="h-14 px-8 text-lg font-bold rounded-2xl">
                    <Link href="/login/selection?action=register">Hemen Başla</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg font-bold rounded-2xl bg-white">
                    <Link href="/onboarding">Nasıl Çalışır?</Link>
                </Button>
            </div>
        </div>
      </section>

      {/* Narçiçeği Brands Section */}
      <section className="bg-primary py-20 px-6 border-y border-primary/20">
        <div className="container mx-auto space-y-12">
            <div className="text-center space-y-4 text-white">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">hangel bağış</h2>
                <p className="text-white/80 max-w-2xl mx-auto text-lg">
                    Alışverişlerinizle sosyal fayda oluşturun. Anlaşmalı markalardan yapacağınız her harcama, seçtiğiniz STK'ya bağışa dönüşsün.
                </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {brands.map((brand) => (
                    <div key={brand.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="relative w-full aspect-square bg-white rounded-full p-3 shadow-lg group-hover:scale-105 transition-transform">
                            {brand.logoUrl ? (
                                <Image 
                                    src={brand.logoUrl} 
                                    alt={brand.name} 
                                    fill 
                                    className="object-contain p-2"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-primary">
                                    {brand.name[0]}
                                </div>
                            )}
                            {brand.donationRate > 0 && (
                                <div className="absolute -top-1 -right-1 bg-[#042654] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                    %{brand.donationRate}
                                </div>
                            )}
                        </div>
                        <span className="text-[11px] font-bold text-white text-center leading-tight group-hover:underline">
                            {brand.name}
                        </span>
                    </div>
                ))}
            </div>

            <div className="text-center pt-8">
                <Button variant="outline" asChild className="bg-white/10 text-white border-white/20 hover:bg-white hover:text-primary rounded-xl">
                    <Link href="/market" className="flex items-center gap-2">
                        Tüm Markaları Keşfet <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
      </section>

      {/* Features Summary */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                    <HeartHandshake className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Gönüllü Ol</h3>
                <p className="text-muted-foreground text-sm">Yüzlerce STK'nın ilanlarına göz at, yeteneklerine uygun projelerde yer al.</p>
            </div>
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto text-green-600">
                    <Store className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Bilinçli Alışveriş</h3>
                <p className="text-muted-foreground text-sm">Alışveriş yaparken hiçbir ek ücret ödemeden sivil toplumu destekle.</p>
            </div>
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto text-purple-600">
                    <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Etkini Ölç</h3>
                <p className="text-muted-foreground text-sm">Sağladığın sosyal etkiyi puanla, rozetler kazan ve topluluğa ilham ver.</p>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-slate-50 py-12 px-6">
        <div className="container mx-auto text-center space-y-6">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium text-muted-foreground">
                <Link href="/about" className="hover:text-primary">Hakkımızda</Link>
                <Link href="/support" className="hover:text-primary">Yardım Merkezi</Link>
                <Link href="/corporate" className="hover:text-primary">Kurumsal</Link>
                <Link href="/settings/contracts" className="hover:text-primary">Yasal Belgeler</Link>
            </div>
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                    Başka bir sorunuz mu var? <Link href="/support" className="text-primary hover:underline font-bold">Destek Merkezi'ni ziyaret edin</Link> veya <Link href="tel:+905547007007" className="text-primary hover:underline font-bold">+90 554 700 70 07</Link> numaralı telefonu arayın.
                </p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter opacity-60">
                    &copy; 2026 hangel.org. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
}
