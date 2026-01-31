
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Globe, Mail, MapPin, Calendar, Briefcase, Filter, Search, Award, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { volunteeringOpportunities, allEntityLists } from '@/lib/data';
import React, { useState } from 'react';
import { translations } from '@/lib/translations';
import type { Language, Translation } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
    { value: 'mr', label: 'มраठी' },
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

  const featuredOpportunities = volunteeringOpportunities.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-secondary overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-20 h-16 bg-white flex items-center justify-center shadow-sm">
        <HangelLogo className="text-3xl text-primary" />
      </header>
      
      <main className="relative flex-grow flex flex-col items-center justify-center bg-[#042654] text-white py-16 lg:py-24">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070"
            alt="Topluluk"
            fill
            className="object-cover opacity-10"
            data-ai-hint="community hands"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#042654] via-[#042654]/80 to-[#042654]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 gap-12">
            {/* Sol Kısım: Video */}
            <div className="w-full lg:w-1/2 flex justify-center">
                <div className="w-full max-w-md aspect-video rounded-lg overflow-hidden shadow-2xl border-4 border-white/10 bg-black">
                    <video
                        className="w-full h-full object-cover"
                        src="https://videos.pexels.com/video-files/6646661/6646661-uhd_1440_2160_25fps.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                    ></video>
                </div>
            </div>
            
            {/* Sağ Kısım: Metinler ve Butonlar */}
            <div className="w-full lg:w-1/2 text-center lg:text-left flex flex-col items-center lg:items-start">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
                    {selectedTranslations.title}
                  </h1>
                  
                  <p className="text-lg font-semibold text-white/90 mt-8">{selectedTranslations.subtitle}</p>
                  
                  <div className="mt-4 max-w-3xl text-base text-white/80 leading-relaxed space-y-3">
                    <p>
                    Günlük alışverişini iyi fiyatlarla hangel üzerinden yap, ek masraf ödemeden alışverişin bağışa dönüşsün.
                    </p>
                    <p>
                    Alışverişlerimizde ek ödeme yapmaksızın her birimizin ayrı ayrı seçtiğimiz Sivil Toplum Kuruluşlarına %15’e varan oranlarda bağış yapmamızı mümkün kılan, sahip olduğumuz profesyonel yetkinliklerimiz ve sosyal hassasiyetlerimiz doğrultusunda gönüllülük faaliyetlerine katkı sunmamızı mümkün kılan,
                    </p>
                    <p className="font-semibold text-white">bağış ve gönüllük odaklı bir Sosyal Etki Platformudur.</p>
                  </div>

                  <div className="mt-12 flex flex-row items-center justify-center lg:justify-start gap-4 w-full max-w-md">
                    <Button size="lg" asChild className="w-full h-12 text-base">
                      <Link href="/login/selection?action=login">Giriş Yap</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="w-full h-12 text-base bg-white/10 border-white/20 text-white hover:bg-white hover:text-[#042654]">
                      <Link href="/login/selection?action=register">Kayıt Ol</Link>
                    </Button>
                  </div>
            </div>
        </div>
      </main>

      <section className="bg-secondary py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 text-secondary-foreground font-headline tracking-tight">hangel imece</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Yeteneklerinizi ve zamanınızı toplumsal faydaya dönüştürün. Size en uygun gönüllülük ilanını hemen bulun.
                </p>
            </div>

            {/* Profesyonel Filtre Çubuğu */}
            <Card className="mb-8 shadow-sm">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="İlan başlığı veya yetkinlik..." className="pl-9" />
                        </div>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Şehir Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="istanbul">İstanbul</SelectItem>
                                <SelectItem value="ankara">Ankara</SelectItem>
                                <SelectItem value="izmir">İzmir</SelectItem>
                                <SelectItem value="online">Online / Her Yer</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Sosyal Alan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="afet">Afet</SelectItem>
                                <SelectItem value="cevre">Çevre</SelectItem>
                                <SelectItem value="egitim">Eğitim</SelectItem>
                                <SelectItem value="hayvan">Hayvan Hakları</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="w-full">
                            <Filter className="mr-2 h-4 w-4" /> İlanları Filtrele
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* İlan Listesi */}
            <div className="space-y-4">
                {featuredOpportunities.map((opp) => (
                    <Link href={`/volunteering/${opp.id}`} key={opp.id} className="block">
                        <Card className="hover:border-primary transition-all hover:shadow-md group overflow-hidden border-l-4 border-l-primary">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                            <Briefcase className="h-7 w-7 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{opp.title}</h3>
                                                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                                                    {opp.socialArea}
                                                </Badge>
                                            </div>
                                            <p className="text-base font-semibold text-muted-foreground">{opp.organization}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                                                <span className="flex items-center text-sm text-muted-foreground">
                                                    <MapPin className="mr-1.5 h-4 w-4" /> {opp.location.city} ({opp.location.type})
                                                </span>
                                                <span className="flex items-center text-sm text-muted-foreground">
                                                    <Clock className="mr-1.5 h-4 w-4" /> {opp.commitment}
                                                </span>
                                                <span className="flex items-center text-sm font-bold text-orange-600">
                                                    <Award className="mr-1.5 h-4 w-4" /> {opp.points} Puan
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto">
                                        <div className="text-right hidden md:block">
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Son Başvuru</p>
                                            <p className="text-sm font-bold">{opp.dates.applicationEnd}</p>
                                        </div>
                                        <Button className="w-full md:w-auto px-8">İncele</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="text-center mt-12">
                <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 hover:text-primary font-bold px-12 h-14">
                    <Link href="/volunteering">Tüm Gönüllülük İlanlarını Gör ({volunteeringOpportunities.length}+)</Link>
                </Button>
            </div>
        </div>
      </section>
      
      {/* Genişletilmiş Markalar Bölümü */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex justify-center py-16 px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col h-full w-full text-center">
            <h2 className="text-3xl font-bold mb-4">hangel bağış</h2>
            <p className="text-center mb-8 text-primary-foreground/90">
              Alışverişlerinizle sosyal fayda yaratın. Anlaşmalı markalardan yapacağınız her harcama, seçtiğiniz STK'ya bağışa dönüşsün.
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-x-4 gap-y-6 items-center justify-items-center flex-grow">
              {allEntityLists.slice(0, 48).map((brand) => (
                <div key={brand.id} className="relative h-10 w-full hover:scale-110 transition-transform">
                  <Image 
                    src={brand.logoUrl || `https://logo.clearbit.com/${brand.name.toLowerCase().replace(/\s/g, '')}.com`} 
                    alt={brand.name} 
                    fill 
                    className="object-contain filter brightness-0 invert" 
                  />
                </div>
              ))}
            </div>
             <Button asChild variant="outline" className="w-full max-w-md mx-auto mt-12 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold">
              <Link href="/market">Tüm Markaları Keşfet ({allEntityLists.length})</Link>
            </Button>
          </div>
        </div>
      </section>
      
      <footer className="w-full bg-secondary text-secondary-foreground border-t">
        <div className="container mx-auto p-6 text-xs text-muted-foreground space-y-6">
            <div className="py-4 space-y-4 text-left">
                <HangelLogo className="text-2xl"/>
                <p className="text-xs max-w-lg">
                    Başka bir sorunuz mu var? <Link href="/support" className="text-primary hover:underline font-semibold">Destek Merkezi'ni ziyaret edin</Link> veya <Link href="tel:+905547007007" className="text-primary hover:underline font-semibold">+90 554 700 70 07</Link> numaralı telefonu arayın.
                </p>
            </div>

            <div className="border-t pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <a href="#" className="hover:text-foreground font-medium">App Store</a>
                        <span className="text-muted-foreground/30">|</span>
                        <a href="#" className="hover:text-foreground font-medium">Google Play</a>
                        <span className="text-muted-foreground/30">|</span>
                        <a href="#" className="hover:text-foreground font-medium">AppGallery</a>
                        <span className="text-muted-foreground/30">|</span>
                        <a href="#" className="hover:text-foreground font-medium">Chrome Store</a>
                        
                        {/* Masaüstünde App Store sağında Dil Seçimi */}
                        <div className="hidden md:flex items-center gap-x-3 ml-4 border-l pl-4">
                            <Select value={language} onValueChange={(value) => handleLanguageChange(value as Language)}>
                                <SelectTrigger className="w-auto border-none focus:ring-0 bg-transparent p-0 h-auto font-medium">
                                <Globe className="mr-2 h-4 w-4" /> <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map(lang => (
                                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-x-4">
                            <a href="#" className="hover:text-foreground">x.com</a>
                            <span className="text-muted-foreground/30">|</span>
                            <a href="#" className="hover:text-foreground">Instagram</a>
                            <span className="text-muted-foreground/30">|</span>
                            <a href="#" className="hover:text-foreground">LinkedIn</a>
                            <span className="text-muted-foreground/30">|</span>
                            <a href="#" className="hover:text-foreground">Spotify</a>
                            
                            {/* Mobilde Sosyal Medya sağında Dil Seçimi ve Destek */}
                            <div className="md:hidden flex items-center gap-x-3 ml-2 border-l pl-2">
                                <Select value={language} onValueChange={(value) => handleLanguageChange(value as Language)}>
                                    <SelectTrigger className="w-auto border-none focus:ring-0 bg-transparent p-0 h-auto font-medium">
                                    <Globe className="mr-2 h-4 w-4" /> <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languages.map(lang => (
                                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-muted-foreground/30">|</span>
                                <Link href="/support" className="hover:text-foreground font-medium">Destek</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t pt-6 flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link href="/about" className="hover:text-foreground">Hakkımızda</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/support" className="hover:text-foreground">Destek</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/kariyer" className="hover:text-foreground">Kariyer</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/bilgi-toplumu-hizmetleri" className="hover:text-foreground">Bilgi Toplumu Hizmetleri</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/press" className="hover:text-foreground">Basın</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/corporate" className="hover:text-foreground">Kamu İlişkileri</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/yatirimci-iliskileri" className="hover:text-foreground">Yatırımcı İlişkileri</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/surdurulebilirlik" className="hover:text-foreground">Sürdürülebilirlik</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/settings/contracts" className="hover:text-foreground">Sözleşmeler</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/settings/contracts" className="hover:text-foreground">Politikalar</Link>
                <span className="text-muted-foreground/30">|</span>
                <Link href="/press" className="hover:text-foreground">Logo Kullanımı</Link>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-y-2">
                <p className="text-left">&copy; 2026 hangel.org. Tüm hakları saklıdır.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
