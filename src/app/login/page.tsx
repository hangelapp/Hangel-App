'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { volunteeringOpportunities, allEntityLists } from '@/lib/data';
import React, { useState } from 'react';
import { translations } from '@/lib/translations';
import type { Language, Translation } from '@/lib/translations';


const SpotifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
      <title>Spotify</title>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.839 17.334c-.198.293-.57.394-.863.197-2.435-1.48-5.488-1.822-9.065-.995-.348.08-.68-.15-.76-.497-.08-.347.15-.68.497-.76 3.863-.89 7.22-.513 9.914 1.113.294.198.395.57.198.863zm1.14-2.54a.65.65 0 0 1-.926.275c-2.716-1.72-6.81-2.212-10.01-1.21a.63.63 0 0 1-.722-.553.63.63 0 0 1 .553-.722c3.553-1.088 8.01-.553 11.08 1.334a.623.623 0 0 1 .275.926zm.23-2.733c-3.213-1.95-8.503-2.12-11.758-1.157a.78.78 0 0 1-.87-.662.78.78 0 0 1 .662-.87c3.608-1.054 9.352-.84 12.96 1.334a.78.78 0 0 1 .373 1.018.778.778 0 0 1-1.018.373z" />
    </svg>
);

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
    { value: 'mr', label: 'मराठी' },
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
    <div className="flex flex-col min-h-screen bg-secondary overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-20 h-16 bg-white flex items-center justify-center shadow-sm">
        <HangelLogo className="text-3xl text-primary" />
      </header>
      <main className="relative flex-grow flex flex-col items-center justify-center bg-[#042654] text-white pt-16 pb-12">
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

        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-7xl mx-auto pt-16 px-6 sm:px-8 lg:px-16 text-center">
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
                <p className="font-semibold text-white">
                bağış ve gönüllük odaklı bir Sosyal Etki Platformudur.
                </p>
              </div>

              <div className="mt-12 flex flex-row items-center justify-center gap-4 w-full max-w-md">
                <Button size="lg" asChild className="w-full h-12 text-base">
                  <Link href="/login/selection?action=login">Giriş Yap</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full h-12 text-base bg-white/10 border-white/20 text-white hover:bg-white hover:text-[#042654]">
                  <Link href="/login/selection?action=register">Kayıt Ol</Link>
                </Button>
              </div>
        </div>
      </main>

      <section className="bg-secondary">
        <div className="container mx-auto flex justify-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col h-full max-w-xl text-center">
                <h2 className="text-3xl font-bold mb-4 text-secondary-foreground">hangel imece</h2>
                <p className="text-center mb-8 text-muted-foreground">
                Yetenekleriniz ve zamanınızla topluma değer katın. İlgi alanlarınıza uygun gönüllülük fırsatlarını keşfedin.
                </p>
                <div className="space-y-3 flex-grow">
                <div className="p-4 bg-background border rounded-lg text-left">
                    <h4 className="font-semibold text-foreground">Afet Bölgesi Yardım Dağıtımı</h4>
                    <p className="text-sm text-muted-foreground">Ahbap Derneği - Hatay</p>
                </div>
                <div className="p-4 bg-background border rounded-lg text-left">
                    <h4 className="font-semibold text-foreground">Ağaç Kardeşliği Projesi - Fidan Dikimi</h4>
                    <p className="text-sm text-muted-foreground">TEMA Vakfı - İstanbul</p>
                </div>
                <div className="p-4 bg-background border rounded-lg text-left">
                    <h4 className="font-semibold text-foreground">Sosyal Medya İçerik Gönüllüsü</h4>
                    <p className="text-sm text-muted-foreground">Tohum Otizm Vakfı - Online</p>
                </div>
                </div>
                <Button asChild variant="outline" className="w-full mt-8 border-primary text-primary hover:bg-primary/5 hover:text-primary font-bold">
                <Link href="/volunteering">Tüm İlanları Gör ({volunteeringOpportunities.length})</Link>
                </Button>
            </div>
        </div>
      </section>
      
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex justify-center py-16 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col h-full max-w-xl text-center">
            <h2 className="text-3xl font-bold mb-4">hangel bağış</h2>
            <p className="text-center mb-8 text-primary-foreground/90">
              Alışverişlerinizle sosyal fayda yaratın. Anlaşmalı markalardan yapacağınız her harcama, seçtiğiniz STK'ya bağışa dönüşsün.
            </p>
            <div className="grid grid-cols-4 gap-x-6 gap-y-8 items-center justify-items-center flex-grow">
              <div className="relative h-12 w-full"><Image src="https://logo.clearbit.com/decathlon.com.tr" alt="Decathlon" fill className="object-contain" /></div>
              <div className="relative h-12 w-full"><Image src="https://logo.clearbit.com/koton.com" alt="Koton" fill className="object-contain" /></div>
              <div className="relative h-12 w-full"><Image src="https://logo.clearbit.com/boyner.com.tr" alt="Boyner" fill className="object-contain" /></div>
              <div className="relative h-12 w-full"><Image src="https://logo.clearbit.com/ayakkabidunyasi.com.tr" alt="Ayakkabı Dünyası" fill className="object-contain" /></div>
              <div className="relative h-12 w-full"><Image src="https://logo.clearbit.com/teknosa.com" alt="Teknosa" fill className="object-contain" /></div>
              <div className="relative h-12 w-full"><Image src="https://logo.clearbit.com/getir.com" alt="Getir" fill className="object-contain" /></div>
              <div className="relative h-12 w-full"><Image src="https://logo.clearbit.com/dr.com.tr" alt="D&R" fill className="object-contain" /></div>
              <div className="relative h-12 w-full"><Image src="https://logo.clearbit.com/mediamarkt.com.tr" alt="MediaMarkt" fill className="object-contain" /></div>
            </div>
             <Button asChild variant="outline" className="w-full mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold">
              <Link href="/market">Tüm Markaları Keşfet ({allEntityLists.length})</Link>
            </Button>
          </div>
        </div>
      </section>
      
      <footer className="w-full bg-secondary text-secondary-foreground border-t">
        <div className="container mx-auto p-6 text-xs text-muted-foreground space-y-4">
            <div className="md:hidden">
              <Accordion type="single" collapsible className="w-full text-sm">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="font-semibold text-secondary-foreground">Sivil Toplum Kuruluşları</AccordionTrigger>
                  <AccordionContent className="flex flex-col items-start gap-3 pl-2">
                    <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Dernek</Link>
                    <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Vakıf</Link>
                    <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Spor Kulübü</Link>
                    <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Özel İzinli</Link>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="font-semibold text-secondary-foreground">Markalar</AccordionTrigger>
                  <AccordionContent className="flex flex-col items-start gap-3 pl-2">
                    <Link href="/market" className="text-muted-foreground hover:text-foreground">Kooperatifler</Link>
                    <Link href="/market" className="text-muted-foreground hover:text-foreground">İktisadi işletmeler</Link>
                    <Link href="/market" className="text-muted-foreground hover:text-foreground">Sosyal Girişimler</Link>
                    <Link href="/market" className="text-muted-foreground hover:text-foreground">Ticari Markalar</Link>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="font-semibold text-secondary-foreground">Gönüllülük</AccordionTrigger>
                  <AccordionContent className="flex flex-col items-start gap-3 pl-2">
                    <Link href="/volunteering" className="text-muted-foreground hover:text-foreground">Gönüllülük İlanları</Link>
                    <Link href="/my-applications" className="text-muted-foreground hover:text-foreground">Başvurularım</Link>
                    <Link href="/my-badges" className="text-muted-foreground hover:text-foreground">Etki Puanım</Link>
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-4">
                  <AccordionTrigger className="font-semibold text-secondary-foreground">Öğrenci Kulüpleri</AccordionTrigger>
                  <AccordionContent className="flex flex-col items-start gap-3 pl-2">
                    <Link href="/admin/clubs" className="text-muted-foreground hover:text-foreground">Kulüpleri Keşfet</Link>
                    <Link href="/admin/events" className="text-muted-foreground hover:text-foreground">Etkinlikler</Link>
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-5">
                  <AccordionTrigger className="font-semibold text-secondary-foreground">Kütüphane</AccordionTrigger>
                  <AccordionContent className="flex flex-col items-start gap-3 pl-2">
                    <Link href="/library/akademik-makaleler" className="text-muted-foreground hover:text-foreground">Akademik Makaleler</Link>
                    <Link href="/library/sosyal-etki-raporlari" className="text-muted-foreground hover:text-foreground">Raporlar</Link>
                    <Link href="/library" className="text-muted-foreground hover:text-foreground">Kitap, Film ve Podcastler</Link>
                    <Link href="/library/sivil-toplum-sozlugu" className="text-muted-foreground hover:text-foreground">Sözlük</Link>
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-6">
                  <AccordionTrigger className="font-semibold text-secondary-foreground">Hangel Foundation</AccordionTrigger>
                  <AccordionContent className="flex flex-col items-start gap-3 pl-2">
                    <Link href="/foundation" className="text-muted-foreground hover:text-foreground">Hakkında</Link>
                    <Link href="/foundation" className="text-muted-foreground hover:text-foreground">Projeler</Link>
                    <Link href="/foundation" className="text-muted-foreground hover:text-foreground">Raporlar</Link>
                    <Link href="/foundation/workshops" className="text-muted-foreground hover:text-foreground">Çalıştaylar</Link>
                    <Link href="/foundation/law-proposal" className="text-muted-foreground hover:text-foreground">Yasa Teklifi</Link>
                    <Link href="/foundation/events" className="text-muted-foreground hover:text-foreground">Etkinlikler</Link>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div className="hidden md:grid md:grid-cols-6 gap-8 text-sm">
                <div className="space-y-3">
                    <h5 className="font-semibold text-foreground">Sivil Toplum Kuruluşları</h5>
                    <div className="flex flex-col items-start gap-2">
                       <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Dernek</Link>
                       <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Vakıf</Link>
                       <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Spor Kulübü</Link>
                       <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Özel İzinli</Link>
                    </div>
                </div>
                <div className="space-y-3">
                    <h5 className="font-semibold text-foreground">Markalar</h5>
                    <div className="flex flex-col items-start gap-2">
                        <Link href="/market" className="text-muted-foreground hover:text-foreground">Kooperatifler</Link>
                        <Link href="/market" className="text-muted-foreground hover:text-foreground">İktisadi işletmeler</Link>
                        <Link href="/market" className="text-muted-foreground hover:text-foreground">Sosyal Girişimler</Link>
                        <Link href="/market" className="text-muted-foreground hover:text-foreground">Ticari Markalar</Link>
                    </div>
                </div>
                 <div className="space-y-3">
                    <h5 className="font-semibold text-foreground">Gönüllülük</h5>
                    <div className="flex flex-col items-start gap-2">
                       <Link href="/volunteering" className="text-muted-foreground hover:text-foreground">Gönüllülük İlanları</Link>
                       <Link href="/my-applications" className="text-muted-foreground hover:text-foreground">Başvurularım</Link>
                       <Link href="/my-badges" className="text-muted-foreground hover:text-foreground">Etki Puanım</Link>
                    </div>
                </div>
                 <div className="space-y-3">
                    <h5 className="font-semibold text-foreground">Öğrenci Kulüpleri</h5>
                     <div className="flex flex-col items-start gap-2">
                       <Link href="/admin/clubs" className="text-muted-foreground hover:text-foreground">Kulüpleri Keşfet</Link>
                       <Link href="/admin/events" className="text-muted-foreground hover:text-foreground">Etkinlikler</Link>
                    </div>
                </div>
                 <div className="space-y-3">
                    <h5 className="font-semibold text-foreground">Kütüphane</h5>
                    <div className="flex flex-col items-start gap-2">
                       <Link href="/library/akademik-makaleler" className="text-muted-foreground hover:text-foreground">Akademik Makaleler</Link>
                       <Link href="/library/sosyal-etki-raporlari" className="text-muted-foreground hover:text-foreground">Raporlar</Link>
                       <Link href="/library" className="text-muted-foreground hover:text-foreground">Kitap, Film ve Podcastler</Link>
                       <Link href="/library/sivil-toplum-sozlugu" className="text-muted-foreground hover:text-foreground">Sözlük</Link>
                    </div>
                </div>
                 <div className="space-y-3">
                    <h5 className="font-semibold text-foreground">Hangel Foundation</h5>
                    <div className="flex flex-col items-start gap-2">
                       <Link href="/foundation" className="text-muted-foreground hover:text-foreground">Hakkında</Link>
                       <Link href="/foundation" className="text-muted-foreground hover:text-foreground">Projeler</Link>
                       <Link href="/foundation" className="text-muted-foreground hover:text-foreground">Raporlar</Link>
                       <Link href="/foundation/workshops" className="text-muted-foreground hover:text-foreground">Çalıştaylar</Link>
                       <Link href="/foundation/law-proposal" className="text-muted-foreground hover:text-foreground">Yasa Teklifi</Link>
                       <Link href="/foundation/events" className="text-muted-foreground hover:text-foreground">Etkinlikler</Link>
                    </div>
                </div>
            </div>
            <p className="text-xs text-center sm:text-left py-4">
                Başka bir sorunuz mu var? <Link href="/support" className="text-primary hover:underline">Destek Merkezi'ni ziyaret edin</Link> veya <Link href="tel:+905547007007" className="text-primary hover:underline">+90 554 700 70 07</Link> numaralı telefonu arayın.
            </p>
            <div className="border-b"></div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-y-4">
                <div className="w-full flex flex-wrap items-center gap-x-2 gap-y-1">
                    <a href="#" className="hover:text-foreground">App Store</a>
                    <span className="text-muted-foreground">|</span>
                    <a href="#" className="hover:text-foreground">Google Play</a>
                    <span className="text-muted-foreground">|</span>
                    <a href="#" className="hover:text-foreground">AppGallery</a>
                    <span className="text-muted-foreground">|</span>
                    <a href="#" className="hover:text-foreground">Chrome Store</a>
                </div>
                <div className="flex items-center gap-x-4">
                    <Link href="/support" className="hidden sm:block hover:text-foreground">Destek</Link>
                    <Select value={language} onValueChange={(value) => handleLanguageChange(value as Language)}>
                        <SelectTrigger className="w-auto border-none focus:ring-0 bg-transparent p-0 h-auto">
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
            <div className="border-b"></div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link href="/about" className="hover:text-foreground">Hakkımızda</Link>
                <Link href="/support" className="hover:text-foreground">Destek</Link>
                <Link href="/kariyer" className="hover:text-foreground">Kariyer</Link>
                <Link href="/bilgi-toplumu-hizmetleri" className="hover:text-foreground">Bilgi Toplumu Hizmetleri</Link>
                <Link href="/press" className="hover:text-foreground">Basın</Link>
                <Link href="/corporate" className="hover:text-foreground">Kamu İlişkileri</Link>
                <Link href="/yatirimci-iliskileri" className="hover:text-foreground">Yatırımcı İlişkileri</Link>
                <Link href="/surdurulebilirlik" className="hover:text-foreground">Sürdürülebilirlik</Link>
                <Link href="/settings/contracts" className="hover:text-foreground">Sözleşmeler</Link>
                <Link href="/settings/contracts" className="hover:text-foreground">Politikalar</Link>
                <Link href="/press" className="hover:text-foreground">Logo Kullanımı</Link>
            </div>
            <div className="border-b sm:hidden"></div>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-4">
                 <div className="flex items-center gap-x-4 text-muted-foreground">
                    <a href="#" className="hover:text-foreground">x.com</a>
                    <span className="text-muted-foreground">|</span>
                    <a href="#" className="hover:text-foreground">Instagram</a>
                    <span className="text-muted-foreground">|</span>
                    <a href="#" className="hover:text-foreground">LinkedIn</a>
                    <span className="text-muted-foreground">|</span>
                    <a href="#" className="hover:text-foreground">Spotify</a>
                </div>
                 <div className="flex items-center gap-x-4">
                    <a href="#" className="sm:hidden hover:text-foreground">Destek</a>
                </div>
            </div>
             <p className="py-4 text-left">&copy; {new Date().getFullYear()} hangel.org. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
