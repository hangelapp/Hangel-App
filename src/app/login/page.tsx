'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Globe, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const footerSections = [
    {
      title: 'Sivil Toplum Kuruluşları',
      links: [
        { label: 'Dernek', href: '/ngos' },
        { label: 'Vakıf', href: '/ngos' },
        { label: 'Spor Kulübü', href: '/ngos' },
        { label: 'Özel İzinli', href: '/ngos' },
      ],
    },
    {
      title: 'Markalar',
      links: [
        { label: 'Giyim', href: '/market' },
        { label: 'Elektronik', href: '/market' },
        { label: 'Ev & Yaşam', href: '/market' },
        { label: 'Tüm Markalar', href: '/market' },
      ],
    },
    {
      title: 'Gönüllülük',
      links: [
        { label: 'Gönüllülük İlanları', href: '/volunteering' },
        { label: 'Başvurularım', href: '/my-applications' },
        { label: 'Etki Puanım', href: '/my-badges' },
      ],
    },
    {
      title: 'Öğrenci Kulüpleri',
      links: [
        { label: 'Kulüpleri Keşfet', href: '/admin/clubs' },
        { label: 'Etkinlikler', href: '/events' },
      ],
    },
    {
      title: 'Kütüphane',
      links: [
        { label: 'Tüm İçerikler', href: '/library' },
        { label: 'Raporlar', href: '/library/sosyal-etki-raporlari' },
        { label: 'Sözlük', href: '/library/sivil-toplum-sozlugu' },
      ],
    },
  ];

const SpotifyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
      <title>Spotify</title>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.839 17.334c-.198.293-.57.394-.863.197-2.435-1.48-5.488-1.822-9.065-.995-.348.08-.68-.15-.76-.497-.08-.347.15-.68.497-.76 3.863-.89 7.22- .513 9.914 1.113.294.198.395.57.198.863zm1.14-2.54a.65.65 0 0 1-.926.275c-2.716-1.72-6.81-2.212-10.01-1.21a.63.63 0 0 1-.722-.553.63.63 0 0 1 .553-.722c3.553-1.088 8.01-.553 11.08 1.334a.623.623 0 0 1 .275.926zm.23-2.733c-3.213-1.95-8.503-2.12-11.758-1.157a.78.78 0 0 1-.87-.662.78.78 0 0 1 .662-.87c3.608-1.054 9.352-.84 12.96 1.334a.78.78 0 0 1 .373 1.018.778.778 0 0 1-1.018.373z"/>
    </svg>
);


export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <header className="fixed top-0 left-0 right-0 z-20 h-16 bg-white flex items-center justify-center shadow-sm">
        <HangelLogo className="text-3xl text-primary" />
      </header>
      <div className="relative flex-grow flex flex-col items-center bg-[#042654] text-white text-center pt-16">
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

        <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center p-6">
            <main className="flex flex-col items-center justify-center flex-1 w-full">
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

               <nav className="relative z-10 w-full mt-8">
                  <div className="container mx-auto px-6 text-center text-white/80 space-y-4">
                      <div className="flex justify-center items-center gap-x-8">
                          <Link href="/market" className="hover:text-white font-bold text-xl">hangel bağış</Link>
                          <Link href="/market" className="hover:text-white font-bold text-xl">hangel imece</Link>
                      </div>
                  </div>
              </nav>
          </main>
        </div>
      </div>
      
      <footer className="w-full bg-secondary text-secondary-foreground border-t">
        <div className="container mx-auto px-6 py-6 md:px-8 space-y-6">
            <div className="flex items-center text-sm text-muted-foreground border-b pb-4">
                <HangelLogo className="text-xl" />
                <span className="mx-2">&gt;</span>
                <span>Sosyal Etki Platformu</span>
            </div>

            <div className="md:hidden">
                <Accordion type="single" collapsible className="w-full">
                    {footerSections.map((section) => (
                    <AccordionItem key={section.title} value={section.title}>
                        <AccordionTrigger className="text-sm font-semibold">{section.title}</AccordionTrigger>
                        <AccordionContent>
                        <ul className="space-y-2 pt-2">
                            {section.links.map((link) => (
                            <li key={link.label}>
                                <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
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

            <div className="hidden md:grid md:grid-cols-5 gap-6">
                {footerSections.map((section) => (
                    <div key={section.title}>
                    <h3 className="text-xs font-semibold text-foreground mb-3">{section.title}</h3>
                    <ul className="space-y-2">
                        {section.links.map((link) => (
                        <li key={link.label}>
                            <Link href={link.href} className="text-xs text-muted-foreground hover:text-foreground">
                            {link.label}
                            </Link>
                        </li>
                        ))}
                    </ul>
                    </div>
                ))}
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                    Başka bir sorunuz mu var? <Link href="/support" className="text-primary hover:underline">Destek Merkezi'ni ziyaret edin</Link> veya <Link href="tel:02120000000" className="text-primary hover:underline">0212 000 00 00</Link> numaralı telefonu arayın.
                </p>
            </div>

            <div className="border-t pt-4 text-muted-foreground text-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <p>&copy; {new Date().getFullYear()} hangel.org. Tüm hakları saklıdır.</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
                        <Link href="/settings/contracts/gizlilik-politikasi" className="hover:text-foreground">Gizlilik Politikası</Link>
                        <span className="hidden sm:inline">|</span>
                        <Link href="/settings/contracts" className="hover:text-foreground">Kullanım Şartları</Link>
                         <span className="hidden sm:inline">|</span>
                        <Link href="/support" className="hover:text-foreground">Destek</Link>
                    </div>
                     <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Türkçe (21 dil desteklenmektedir)</span>
                    </div>
                </div>
                 <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center pt-2">
                    <Link href="/about" className="hover:text-foreground">Hakkımızda</Link>
                    <span className="hidden sm:inline">|</span>
                    <Link href="/yatirimci-iliskileri" className="hover:text-foreground">Yatırımcı İlişkileri</Link>
                    <span className="hidden sm:inline">|</span>
                    <Link href="/bilgi-toplumu-hizmetleri" className="hover:text-foreground">Bilgi Toplumu Hizmetleri</Link>
                </div>
                 <div className="flex justify-start gap-5 pt-4">
                    <a href="#" target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5 hover:text-foreground" /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 hover:text-foreground" /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5 hover:text-foreground" /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer"><SpotifyIcon className="h-5 w-5 hover:text-foreground" /></a>
                </div>
            </div>
        </div>
    </footer>
    </div>
  );
}
