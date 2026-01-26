'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Globe, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SpotifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
      <title>Spotify</title>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.839 17.334c-.198.293-.57.394-.863.197-2.435-1.48-5.488-1.822-9.065-.995-.348.08-.68-.15-.76-.497-.08-.347.15-.68.497-.76 3.863-.89 7.22-.513 9.914 1.113.294.198.395.57.198.863zm1.14-2.54a.65.65 0 0 1-.926.275c-2.716-1.72-6.81-2.212-10.01-1.21a.63.63 0 0 1-.722-.553.63.63 0 0 1 .553-.722c3.553-1.088 8.01-.553 11.08 1.334a.623.623 0 0 1 .275.926zm.23-2.733c-3.213-1.95-8.503-2.12-11.758-1.157a.78.78 0 0 1-.87-.662.78.78 0 0 1 .662-.87c3.608-1.054 9.352-.84 12.96 1.334a.78.78 0 0 1 .373 1.018.778.778 0 0 1-1.018.373z"/>
    </svg>
);

const countries = [
    { value: 'tr', label: 'Türkiye' },
    { value: 'de', label: 'Almanya' },
    { value: 'fr', label: 'Fransa' },
    { value: 'nl', label: 'Hollanda' },
    { value: 'us', label: 'Amerika Birleşik Devletleri' },
    { value: 'at', label: 'Avusturya' },
    { value: 'gb', label: 'Birleşik Krallık' },
    { value: 'be', label: 'Belçika' },
    { value: 'ch', label: 'İsviçre' },
    { value: 'au', label: 'Avustralya' },
    { value: 'se', label: 'İsveç' },
    { value: 'ca', label: 'Kanada' },
    { value: 'dk', label: 'Danimarka' },
    { value: 'no', label: 'Norveç' },
    { value: 'sa', label: 'Suudi Arabistan' },
    { value: 'ru', label: 'Rusya' },
    { value: 'bg', label: 'Bulgaristan' },
    { value: 'gr', label: 'Yunanistan' },
    { value: 'it', label: 'İtalya' },
    { value: 'az', label: 'Azerbaycan' },
    { value: 'kz', label: 'Kazakistan' },
    { value: 'cy', label: 'Kıbrıs' },
];


export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-20 h-16 bg-white flex items-center justify-center shadow-sm">
        <HangelLogo className="text-3xl text-primary" />
      </header>
      <div className="relative flex-grow flex flex-col items-center justify-center bg-[#042654] text-white text-center pt-16 pb-12 px-4">
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

        <main className="relative z-10 flex flex-col items-center justify-center w-full">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
                yok öyle yalnız başına mücadele etmek!
              </h1>
              
              <p className="mt-8 max-w-3xl text-base text-white/80 leading-relaxed">
               Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz. Günlük alışverişini iyi fiyatlarla hangel üzerinden yap, ek masraf ödemeden alışverişin bağışa dönüşsün. Alışverişlerimizde ek ödeme yapmaksızın her birimizin ayrı ayrı seçtiğimiz Sivil Toplum Kuruluşlarına %15’e varan oranlarda bağış yapmamızı mümkün kılan, sahip olduğumuz profesyonel yetkinliklerimiz ve sosyal hassasiyetlerimiz doğrultusunda gönüllülük faaliyetlerine katkı sunmamızı mümkün kılan, bağış ve gönüllük odaklı Sosyal Etki Platformudur.
              </p>

              <div className="mt-12 flex flex-row items-center justify-center gap-4 w-full max-w-md">
                <Button size="lg" asChild className="w-full h-12 text-base">
                  <Link href="/login/selection?action=login">Giriş Yap</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full h-12 text-base bg-white/10 border-white/20 text-white hover:bg-white hover:text-[#042654]">
                  <Link href="/login/selection?action=register">Kayıt Ol</Link>
                </Button>
              </div>
              
              <nav className="w-full pt-4 mt-4">
                  <div className="container mx-auto px-6 text-center text-white/80 space-y-2">
                      <div className="flex justify-center items-center gap-x-6">
                          <Link href="/market" className="hover:text-white font-bold text-lg">hangel bağış</Link>
                          <Link href="/market" className="hover:text-white font-bold text-lg">hangel imece</Link>
                      </div>
                  </div>
              </nav>
        </main>
      </div>
      
      <footer className="w-full bg-secondary text-secondary-foreground border-t">
        <div className="container mx-auto p-4 md:px-6 md:py-6 text-xs text-muted-foreground space-y-5">
            <nav className="md:hidden">
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
                    <Link href="/library/akademik-makaleler" className="text-muted-foreground hover:text-foreground">akademik makaleler</Link>
                    <Link href="/library/sosyal-etki-raporlari" className="text-muted-foreground hover:text-foreground">Raporlar</Link>
                    <Link href="/library" className="text-muted-foreground hover:text-foreground">kitap, film ve Podcastler</Link>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </nav>
            <nav className="hidden md:grid md:grid-cols-5 gap-8 text-sm">
                <div className="space-y-3">
                    <h5 className="font-semibold text-secondary-foreground">Sivil Toplum Kuruluşları</h5>
                    <div className="flex flex-col items-start gap-2">
                       <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Dernek</Link>
                       <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Vakıf</Link>
                       <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Spor Kulübü</Link>
                       <Link href="/ngos" className="text-muted-foreground hover:text-foreground">Özel İzinli</Link>
                    </div>
                </div>
                <div className="space-y-3">
                    <h5 className="font-semibold text-secondary-foreground">Markalar</h5>
                    <div className="flex flex-col items-start gap-2">
                        <Link href="/market" className="text-muted-foreground hover:text-foreground">Kooperatifler</Link>
                        <Link href="/market" className="text-muted-foreground hover:text-foreground">İktisadi işletmeler</Link>
                        <Link href="/market" className="text-muted-foreground hover:text-foreground">Sosyal Girişimler</Link>
                        <Link href="/market" className="text-muted-foreground hover:text-foreground">Ticari Markalar</Link>
                    </div>
                </div>
                 <div className="space-y-3">
                    <h5 className="font-semibold text-secondary-foreground">Gönüllülük</h5>
                    <div className="flex flex-col items-start gap-2">
                       <Link href="/volunteering" className="text-muted-foreground hover:text-foreground">Gönüllülük İlanları</Link>
                       <Link href="/my-applications" className="text-muted-foreground hover:text-foreground">Başvurularım</Link>
                       <Link href="/my-badges" className="text-muted-foreground hover:text-foreground">Etki Puanım</Link>
                    </div>
                </div>
                 <div className="space-y-3">
                    <h5 className="font-semibold text-secondary-foreground">Öğrenci Kulüpleri</h5>
                     <div className="flex flex-col items-start gap-2">
                       <Link href="/admin/clubs" className="text-muted-foreground hover:text-foreground">Kulüpleri Keşfet</Link>
                       <Link href="/admin/events" className="text-muted-foreground hover:text-foreground">Etkinlikler</Link>
                    </div>
                </div>
                 <div className="space-y-3">
                    <h5 className="font-semibold text-secondary-foreground">Kütüphane</h5>
                    <div className="flex flex-col items-start gap-2">
                       <Link href="/library/akademik-makaleler" className="text-muted-foreground hover:text-foreground">akademik makaleler</Link>
                       <Link href="/library/sosyal-etki-raporlari" className="text-muted-foreground hover:text-foreground">Raporlar</Link>
                       <Link href="/library" className="text-muted-foreground hover:text-foreground">kitap, film ve Podcastler</Link>
                    </div>
                </div>
            </nav>
            <div className="border-b"></div>
            <div>
                <p>
                    Başka bir sorunuz mu var? <Link href="/support" className="text-primary hover:underline">Destek Merkezi'ni ziyaret edin</Link> veya <Link href="tel:+905547007007" className="text-primary hover:underline">+90 554 700 70 07</Link> numaralı telefonu arayın.
                </p>
            </div>
            <div className="border-b pb-4">
                <Select defaultValue="tr">
                    <SelectTrigger className="w-auto border-none focus:ring-0 bg-transparent p-0 h-auto">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {countries.map(country => (
                            <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-4 sm:flex sm:flex-col sm:items-start sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center text-left gap-y-2 gap-x-4">
                    <p>&copy; {new Date().getFullYear()} hangel.org. Tüm hakları saklıdır.</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link href="/settings/contracts" className="hover:text-foreground">Tüm Sözleşmeler</Link>
                        <span>|</span>
                        <Link href="/about" className="hover:text-foreground">Hakkımızda</Link>
                        <span>|</span>
                        <Link href="/yatirimci-iliskileri" className="hover:text-foreground">Yatırımcı İlişkileri</Link>
                        <span>|</span>
                        <Link href="/bilgi-toplumu-hizmetleri" className="hover:text-foreground">Bilgi Toplumu Hizmetleri</Link>
                    </div>
                </div>
                <div className="flex items-center gap-x-1 text-muted-foreground">
                    <a href="#" className="hover:text-foreground">x.com</a>
                    <span className="mx-1">|</span>
                    <a href="#" className="hover:text-foreground">Instagram</a>
                    <span className="mx-1">|</span>
                    <a href="#" className="hover:text-foreground">LinkedIn</a>
                    <span className="mx-1">|</span>
                    <a href="#" className="hover:text-foreground">Spotify</a>
                </div>
            </div>
        </div>
    </footer>
    </div>
  );
}
