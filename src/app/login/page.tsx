'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Globe, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const footerSections = [
    {
      title: 'Keşfet',
      links: [
        { label: 'Markalar', href: '/market' },
        { label: 'STK\'lar', href: '/ngos' },
        { label: 'Gönüllülük', href: '/volunteering' },
        { label: 'Öğrenci Kulüpleri', href: '/admin/clubs' },
        { label: 'Kütüphane', href: '/library' },
      ],
    },
    {
      title: 'Hesap',
      links: [
        { label: 'Profilim', href: '/profile' },
        { label: 'Bağışlarım', href: '/my-donations' },
        { label: 'Başvurularım', href: '/my-applications' },
        { label: 'Ayarlar', href: '/settings' },
      ],
    },
    {
      title: 'Hangel Hakkında',
      links: [
        { label: 'Hakkımızda', href: '/about' },
        { label: 'Yatırımcı İlişkileri', href: '/yatirimci-iliskileri' },
        { label: 'Bilgi Toplumu Hizmetleri', href: '/bilgi-toplumu-hizmetleri' },
        { label: 'Destek', href: '/support' },
        { label: 'İletişim', href: '/support' },
      ],
    },
    {
      title: 'Yasal',
      links: [
        { label: 'Tüm Sözleşmeler', href: '/settings/contracts' },
        { label: 'Gizlilik Politikası', href: '/settings/contracts/gizlilik-politikasi' },
        { label: 'Kullanıcı Sözleşmesi', href: '/settings/contracts/kullanici-sozlesmesi' },
      ],
    },
  ];

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <div className="relative flex-grow flex flex-col items-center bg-[#042654] text-white text-center">
        {/* Background Image */}
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

        <header className="fixed top-0 left-0 right-0 z-20 h-16 bg-white flex items-center justify-center shadow-sm">
          <HangelLogo className="text-3xl text-primary" />
        </header>

        <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center p-6 pt-20">
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
        <div className="container mx-auto p-6 md:px-8 space-y-6">
            <div className="flex items-center text-sm text-muted-foreground border-b pb-6">
                <HangelLogo className="text-xl" />
                <span className="mx-2">&gt;</span>
                <span>Sosyal Etki Platformu</span>
            </div>

            <div className="md:hidden">
                <Accordion type="single" collapsible className="w-full">
                    {footerSections.map((section) => (
                    <AccordionItem key={section.title} value={section.title}>
                        <AccordionTrigger className="text-base">{section.title}</AccordionTrigger>
                        <AccordionContent>
                        <ul className="space-y-3 pt-2">
                            {section.links.map((link) => (
                            <li key={link.label}>
                                <Link href={link.href} className="text-muted-foreground hover:text-foreground">
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

            <div className="hidden md:grid md:grid-cols-4 gap-8">
                {footerSections.map((section) => (
                    <div key={section.title}>
                    <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
                    <ul className="space-y-3">
                        {section.links.map((link) => (
                        <li key={link.label}>
                            <Link href={link.href} className="text-muted-foreground hover:text-foreground">
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

            <div className="border-t pt-6 text-muted-foreground text-xs space-y-4">
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
                 <div className="flex justify-start gap-5 pt-4">
                    <a href="#" target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5 hover:text-foreground" /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 hover:text-foreground" /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5 hover:text-foreground" /></a>
                </div>
            </div>
        </div>
    </footer>
    </div>
  );
}
