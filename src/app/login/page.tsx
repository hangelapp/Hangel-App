
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { Globe, ArrowRight, Store, HeartHandshake, Users, Sparkles, CheckCircle2, ShieldCheck, Zap, Award, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';
import { translations } from '@/lib/translations';
import type { Language, Translation } from '@/lib/translations';
import { allEntityLists } from '@/lib/data';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
    { value: 'pa', label: 'ਪੰਜਾਬِي' },
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
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
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
            <Button variant="ghost" asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/login/selection?action=login">Giriş Yap</Link>
            </Button>
            <Button asChild size="sm">
                <Link href="/login/selection?action=register">Kayıt Ol</Link>
            </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-6 bg-slate-50 border-b overflow-hidden">
        <div className="container mx-auto text-center space-y-8 relative z-10">
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-[#042654] leading-[1.1] max-w-5xl mx-auto">
                    {selectedTranslations.title}
                </h1>
                <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                    {selectedTranslations.subtitle}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                <Button size="lg" asChild className="h-16 px-10 text-xl font-bold rounded-2xl shadow-xl hover:shadow-primary/20 transition-all">
                    <Link href="/login/selection?action=register">Hemen Başla</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-16 px-10 text-xl font-bold rounded-2xl bg-white shadow-sm">
                    <Link href="/onboarding">Nasıl Çalışır?</Link>
                </Button>
            </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 opacity-50" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-48 opacity-50" />
      </section>

      {/* Volunteering Section - Gönüllülük Ekranı */}
      <section className="py-24 px-6 bg-background">
        <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-bold text-sm uppercase tracking-wider">
                        <HeartHandshake className="h-4 w-4" /> Gönüllülük
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold font-headline text-[#042654] leading-tight">
                        Yeteneklerinizle Topluma <span className="text-primary underline decoration-primary/30">Değer Katın</span>
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Hangel Hub, yeteneklerinizi ve zamanınızı en verimli şekilde kullanabileceğiniz bir köprü kurar. İlgi alanlarınıza uygun yüzlerce gönüllülük fırsatı arasından seçiminizi yapın ve değişimin parçası olun.
                    </p>
                    <ul className="space-y-4">
                        {[
                            "Yüzlerce aktif STK ilanı",
                            "Yetenek bazlı akıllı eşleştirme",
                            "Sertifikalı gönüllülük programları",
                            "Esnek çalışma saatleri ve online fırsatlar"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 font-semibold text-[#042654]">
                                <CheckCircle2 className="h-5 w-5 text-green-500" /> {item}
                            </li>
                        ))}
                    </ul>
                    <div className="pt-4">
                        <Button asChild variant="link" className="px-0 text-lg font-bold group">
                            <Link href="/volunteering" className="flex items-center gap-2">
                                Gönüllülük Fırsatlarını Keşfet <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="relative aspect-square sm:aspect-video md:aspect-square bg-muted rounded-[2rem] overflow-hidden shadow-2xl">
                    <Image 
                        src="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop" 
                        alt="Volunteering" 
                        fill 
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#042654]/60 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white">
                        <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Bu Ay</p>
                        <p className="text-2xl font-bold">150.000+ Gönüllü</p>
                        <p className="text-sm opacity-90">Türkiye genelinde aktif olarak projelerde yer alıyor.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Narçiçeği Brands Section */}
      <section className="bg-primary py-24 px-6 border-y border-primary/20">
        <div className="container mx-auto space-y-16">
            <div className="text-center space-y-4 text-white">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white font-bold text-sm uppercase tracking-wider mb-2">
                    <Store className="h-4 w-4" /> hangel bağış
                </div>
                <h2 className="text-3xl md:text-5xl font-bold font-headline">Alışverişiniz İyiliğe Dönüşsün</h2>
                <p className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl">
                    Ek ödeme yapmaksızın seçtiğiniz STK'ya %15'e varan oranlarda bağış yapın.
                </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                {brands.map((brand) => (
                    <div key={brand.id} className="flex flex-col items-center gap-3 group cursor-pointer">
                        <div className="relative w-full aspect-square bg-white rounded-full p-4 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            {brand.logoUrl ? (
                                <Image 
                                    src={brand.logoUrl} 
                                    alt={brand.name} 
                                    fill 
                                    className="object-contain p-3"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xl">
                                    {brand.name[0]}
                                </div>
                            )}
                            {brand.donationRate > 0 && (
                                <div className="absolute -top-1 -right-1 bg-[#042654] text-white text-[11px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-primary">
                                    %{brand.donationRate}
                                </div>
                            )}
                        </div>
                        <span className="text-[12px] font-bold text-white text-center leading-tight group-hover:underline">
                            {brand.name}
                        </span>
                    </div>
                ))}
            </div>

            <div className="text-center pt-8">
                <Button size="lg" variant="outline" asChild className="h-14 px-8 bg-white/10 text-white border-white/30 hover:bg-white hover:text-primary rounded-xl font-bold transition-all">
                    <Link href="/market" className="flex items-center gap-3">
                        Tüm Markaları Keşfet (154) <ArrowRight className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="container mx-auto">
            <div className="text-center space-y-4 mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-600 font-bold text-sm uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" /> Sosyal Etki
                </div>
                <h2 className="text-3xl md:text-5xl font-bold font-headline text-[#042654]">Etkinizi Ölçün ve Büyütün</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Yaptığınız her olumlu katkı size puan, rozet ve toplumsal saygınlık olarak geri döner.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <Card className="p-8 space-y-6 hover:shadow-2xl transition-shadow border-none rounded-3xl">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                        <Zap className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Anlık Etki Puanı</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">Bağış ve gönüllülük faaliyetleriniz anında puanlanır ve profilinize işlenir.</p>
                    </div>
                </Card>
                <Card className="p-8 space-y-6 hover:shadow-2xl transition-shadow border-none rounded-3xl">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                        <Award className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Koleksiyonluk Rozetler</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">Çevre, eğitim, hayvan hakları gibi alanlarda uzmanlaştıkça özel rozetler kazanın.</p>
                    </div>
                </Card>
                <Card className="p-8 space-y-6 hover:shadow-2xl transition-shadow border-none rounded-3xl">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Şeffaflık Onayı</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">Bağışlarınızın her adımını şeffaflık raporları ile doğrulayın ve güvenle destekleyin.</p>
                    </div>
                </Card>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-[#f5f5f5] py-16 px-6">
        <div className="container mx-auto space-y-10">
            {/* Header: Logo and Large Prompt */}
            <div className="space-y-4">
                <HangelLogo className="text-4xl font-extrabold text-[#f34723]" />
                <p className="text-sm md:text-base text-muted-foreground font-medium">
                    Başka bir sorunuz mu var? <Link href="/support" className="text-primary hover:underline font-bold">Destek Merkezi'ni ziyaret edin</Link> veya <Link href="tel:+905547007007" className="text-primary hover:underline font-bold">+90 554 700 70 07</Link> numaralı telefonu arayın.
                </p>
            </div>

            <Separator className="bg-muted-foreground/20" />

            {/* Middle: Platforms, Language and Socials */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Link href="#" className="hover:text-foreground">App Store</Link>
                    <span className="text-muted-foreground/30">|</span>
                    <Link href="#" className="hover:text-foreground">Google Play</Link>
                    <span className="text-muted-foreground/30">|</span>
                    <Link href="#" className="hover:text-foreground">AppGallery</Link>
                    <span className="text-muted-foreground/30">|</span>
                    <Link href="#" className="hover:text-foreground">Chrome Store</Link>
                </div>

                <div className="flex items-center gap-2 px-4 border-l border-muted-foreground/30 h-6 text-xs font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <Globe className="h-4 w-4" />
                    <span>TÜRKÇE</span>
                    <ChevronRight className="h-3 w-3 rotate-90" />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider md:ml-auto">
                    <Link href="#" className="hover:text-foreground">x.com</Link>
                    <span className="text-muted-foreground/30">|</span>
                    <Link href="#" className="hover:text-foreground">Instagram</Link>
                    <span className="text-muted-foreground/30">|</span>
                    <Link href="#" className="hover:text-foreground">LinkedIn</Link>
                    <span className="text-muted-foreground/30">|</span>
                    <Link href="#" className="hover:text-foreground">Spotify</Link>
                </div>
            </div>

            {/* Bottom: Main Navigation */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-3 text-xs font-medium text-muted-foreground/80">
                <Link href="/about" className="hover:text-foreground">Hakkımızda</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/support" className="hover:text-foreground">Destek</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="#" className="hover:text-foreground">Kariyer</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/bilgi-toplumu-hizmetleri" className="hover:text-foreground">Bilgi Toplumu Hizmetleri</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/press" className="hover:text-foreground">Basın</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/corporate" className="hover:text-foreground">Kamu İlişkileri</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/yatirimci-iliskileri" className="hover:text-foreground">Yatırımcı İlişkileri</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="#" className="hover:text-foreground">Sürdürülebilirlik</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/settings/contracts" className="hover:text-foreground">Sözleşmeler</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/settings/contracts" className="hover:text-foreground">Politikalar</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/press" className="hover:text-foreground">Logo Kullanımı</Link>
            </div>

            {/* Copyright */}
            <div className="pt-4 text-left">
                <p className="text-xs text-muted-foreground/60 font-semibold tracking-wide uppercase">
                    &copy; 2026 hangel.org. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
}
