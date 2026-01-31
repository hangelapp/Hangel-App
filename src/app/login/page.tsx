'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { Globe, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';
import { translations } from '@/lib/translations';
import type { Language, Translation } from '@/lib/translations';

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
    { value: 'mr', label: 'మराठी' },
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

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[#042654] text-white">
      {/* Background Video Overlay */}
      <div className="absolute inset-0 z-0">
        <video
            className="w-full h-full object-cover opacity-20"
            src="https://videos.pexels.com/video-files/6646661/6646661-uhd_1440_2160_25fps.mp4"
            autoPlay
            loop
            muted
            playsInline
        ></video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#042654]/90 via-transparent to-[#042654]" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-16 flex items-center justify-between px-6 border-b border-white/5 backdrop-blur-md">
        <HangelLogo className="text-2xl text-white" />
        <Select value={language} onValueChange={(value) => handleLanguageChange(value as Language)}>
            <SelectTrigger className="w-auto border-none bg-transparent text-white focus:ring-0 gap-2 h-auto py-1 text-xs">
                <Globe className="h-4 w-4 opacity-70" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
                {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="max-w-lg space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                    {selectedTranslations.title}
                </h1>
                <p className="text-base md:text-xl text-white/70 font-medium max-w-sm mx-auto">
                    {selectedTranslations.subtitle}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button size="lg" asChild className="w-full h-14 text-lg font-bold rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                    <Link href="/login/selection?action=login">Giriş Yap</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full h-14 text-lg font-bold rounded-2xl bg-white/5 border-white/20 hover:bg-white hover:text-[#042654] transition-all hover:scale-[1.02]">
                    <Link href="/login/selection?action=register">Kayıt Ol</Link>
                </Button>
            </div>
            
            <div className="pt-2">
                <Button variant="link" asChild className="text-white/40 hover:text-white group">
                    <Link href="/onboarding" className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
                        Nasıl çalışır? <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 border-t border-white/5 bg-[#042654]/40 backdrop-blur-lg">
        <div className="max-w-2xl mx-auto space-y-3 text-center">
            <p className="text-[11px] md:text-xs text-white/60 leading-relaxed">
                Başka bir sorunuz mu var? <Link href="/support" className="text-primary hover:underline font-bold">Destek Merkezi'ni ziyaret edin</Link> veya <Link href="tel:+905547007007" className="text-primary hover:underline font-bold">+90 554 700 70 07</Link> numaralı telefonu arayın.
            </p>
            <p className="text-[10px] uppercase tracking-tighter text-white/30 font-medium">
                &copy; 2026 hangel.org. Tüm hakları saklıdır.
            </p>
        </div>
      </footer>
    </div>
  );
}
