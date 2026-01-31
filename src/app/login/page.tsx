'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { 
  Globe, ArrowRight, HeartHandshake, CheckCircle2, ShieldCheck, Zap, Award, 
  ChevronRight, Store, MessageSquare, Smartphone, Mail, Twitter, Instagram, 
  Linkedin, Briefcase, Sparkles, Search, Filter, ArrowDownUp
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';
import { translations } from '@/lib/translations';
import type { Language, Translation } from '@/lib/translations';
import { allEntityLists, marketCategories } from '@/lib/data';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    { value: 'mr', label: 'มराठी' },
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

  const brands = allEntityLists.slice(0, 16);

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
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 opacity-50" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-48 opacity-50" />
      </section>

      {/* Volunteering Section */}
      <section className="py-24 px-6 bg-background border-b">
        <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-8 text-left">
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
                    <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white text-left">
                        <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Bu Ay</p>
                        <p className="text-2xl font-bold">150.000+ Gönüllü</p>
                        <p className="text-sm opacity-90">Türkiye genelinde aktif olarak projelerde yer alıyor.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Mini Marketplace Section (Narçiçeği) */}
      <section className="bg-primary py-24 px-4 sm:px-6 border-y border-primary/20">
        <div className="container mx-auto space-y-12">
            <div className="text-center space-y-4 text-white">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white font-bold text-sm uppercase tracking-wider mb-2">
                    <Store className="h-4 w-4" /> hangel bağış
                </div>
                <h2 className="text-3xl md:text-5xl font-bold font-headline">Alışverişiniz İyiliğe Dönüşsün</h2>
                <p className="text-white/80 max-w-2xl mx-auto text-lg">
                    Ek ödeme yapmaksızın seçtiğiniz STK'ya %15'e varan oranlarda bağış yapın.
                </p>
            </div>

            {/* Marketplace UI Container */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-4 sm:p-8 border border-white/10 shadow-2xl">
                <Tabs defaultValue="all" className="w-full mb-8">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-white/10 text-white h-auto p-1">
                        <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-primary py-3">Tümü</TabsTrigger>
                        <TabsTrigger value="cooperative" className="data-[state=active]:bg-white data-[state=active]:text-primary py-3">Kooperatif</TabsTrigger>
                        <TabsTrigger value="economic" className="data-[state=active]:bg-white data-[state=active]:text-primary py-3 hidden sm:block">İktisadi İşl.</TabsTrigger>
                        <TabsTrigger value="brand" className="data-[state=active]:bg-white data-[state=active]:text-primary py-3">Marka</TabsTrigger>
                        <TabsTrigger value="social" className="data-[state=active]:bg-white data-[state=active]:text-primary py-3">Sosyal İşl.</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Categories - Horizontal on mobile, vertical on desktop */}
                    <div className="w-full lg:w-1/4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-4 lg:pb-0 scrollbar-hide">
                        {marketCategories.map((cat) => (
                            <Button 
                                key={cat.mainCategory}
                                variant="ghost"
                                className="text-white/70 hover:text-white hover:bg-white/10 justify-start h-10 px-4 whitespace-nowrap lg:w-full font-semibold"
                            >
                                {cat.mainCategory}
                            </Button>
                        ))}
                    </div>

                    {/* Brands Grid */}
                    <div className="flex-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {brands.map((brand) => (
                                <Link href={`/market/${brand.id}`} key={brand.id} className="group flex flex-col items-center gap-3">
                                    <div className="relative w-full aspect-square bg-white rounded-full p-4 shadow-xl group-hover:scale-105 transition-transform duration-300">
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
                                            <div className="absolute -top-1 -right-1 bg-[#042654] text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-primary">
                                                %{brand.donationRate}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-bold text-white text-center leading-tight group-hover:underline">
                                        {brand.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center pt-4">
                <Button size="lg" variant="outline" asChild className="h-14 px-8 bg-white text-primary border-white hover:bg-white/90 rounded-xl font-bold transition-all shadow-xl">
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

            <div className="grid md:grid-cols-3 gap-8 text-left">
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

      {/* Apple Style Footer */}
      <footer className="bg-[#f5f5f7] py-12 px-6 border-t text-[#1d1d1f]">
        <div className="container mx-auto max-w-5xl space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[#6e6e73] font-medium">
                <HangelLogo className="text-lg opacity-70" />
                <ChevronRight className="h-3 w-3" />
                <span>Yasal Bilgiler</span>
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
                    <AccordionItem value="impact" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">Sosyal Etki</AccordionTrigger>
                        <AccordionContent className="text-xs flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/leaderboard">Liderlik Tablosu</Link>
                            <Link href="/my-badges">Rozetler ve Sertifikalar</Link>
                            <Link href="/impact-story">Etki Hikayem</Link>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="corporate" className="border-b border-[#d2d2d7]">
                        <AccordionTrigger className="text-xs font-semibold py-3 hover:no-underline">Kurumsal</AccordionTrigger>
                        <AccordionContent className="text-xs flex flex-col gap-3 py-2 text-[#424245]">
                            <Link href="/about">Hakkımızda</Link>
                            <Link href="/corporate">Kamu İlişkileri</Link>
                            <Link href="/yatirimci-iliskileri">Yatırımcı İlişkileri</Link>
                            <Link href="/bilgi-toplumu-hizmetleri">Bilgi Toplumu Hizmetleri</Link>
                            <Link href="/press">Basın Odası</Link>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            {/* Grid View (Desktop Only) */}
            <div className="hidden lg:grid grid-cols-5 gap-8">
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
                    <h4 className="text-xs font-semibold">Sosyal Etki</h4>
                    <ul className="text-xs flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/leaderboard" className="hover:underline">Liderlik Tablosu</Link></li>
                        <li><Link href="/my-badges" className="hover:underline">Rozetler ve Sertifikalar</Link></li>
                        <li><Link href="/impact-story" className="hover:underline">Etki Hikayem</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold">Kurumsal</h4>
                    <ul className="text-xs flex flex-col gap-2 text-[#424245]">
                        <li><Link href="/about" className="hover:underline">Hakkımızda</Link></li>
                        <li><Link href="/corporate" className="hover:underline">Kamu İlişkileri</Link></li>
                        <li><Link href="/yatirimci-iliskileri" className="hover:underline">Yatırımcı İlişkileri</Link></li>
                        <li><Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link></li>
                        <li><Link href="/press" className="hover:underline">Basın Odası</Link></li>
                    </ul>
                </div>
            </div>

            {/* Shopping Options */}
            <div className="text-xs text-[#6e6e73] space-y-4 pt-4">
                <p>
                    Başka bir sorunuz mu var? <Link href="/support" className="text-[#0066cc] hover:underline">Destek Merkezi'ni</Link> ziyaret edin veya <span className="whitespace-nowrap">+90 554 700 70 07</span> numaralı telefonu arayın.
                </p>
                <Separator className="bg-[#d2d2d7]" />
            </div>

            {/* Bottom Footer */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 text-xs text-[#6e6e73]">
                <div className="order-2 lg:order-1 flex flex-col lg:flex-row gap-4">
                    <span>Telif Hakkı © 2026 Hangel Hub Inc. Tüm hakları saklıdır.</span>
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <Link href="/settings/contracts/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link>
                        <span className="text-[#d2d2d7]">|</span>
                        <Link href="/settings/contracts/cerez-politikasi" className="hover:underline">Çerezlerin Kullanımı</Link>
                        <span className="text-[#d2d2d7]">|</span>
                        <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:underline">Kullanım Şartları</Link>
                        <span className="text-[#d2d2d7]">|</span>
                        <Link href="/settings/contracts/bagis-ve-yardim-politikasi" className="hover:underline">Satış ve Para İadesi</Link>
                        <span className="text-[#d2d2d7]">|</span>
                        <Link href="/settings/contracts" className="hover:underline">Yasal Bilgiler</Link>
                        <span className="text-[#d2d2d7]">|</span>
                        <Link href="#" className="hover:underline">Site Haritası</Link>
                        <span className="text-[#d2d2d7]">|</span>
                        <Link href="/bilgi-toplumu-hizmetleri" className="hover:underline">Bilgi Toplumu Hizmetleri</Link>
                    </div>
                </div>
                <div className="order-1 lg:order-2 font-semibold hover:underline cursor-pointer">
                    Türkiye
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
