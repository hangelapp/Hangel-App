'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Twitter, Instagram, Linkedin, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-foreground text-white overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070"
          alt="Topluluk"
          fill
          className="object-cover opacity-10"
          data-ai-hint="community hands"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/80 to-foreground" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center flex-1 text-center p-6 pt-24">
        <HangelLogo className="text-5xl md:text-6xl mb-6" />
        
        <p className="text-lg md:text-xl font-semibold text-primary/90 tracking-widest uppercase whitespace-nowrap">
          yok öyle yalnız başına mücadele etmek!
        </p>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-4 max-w-4xl">
          Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
        </h1>

        <p className="mt-8 max-w-3xl text-base md:text-lg text-white/80">
          Günlük alışverişini iyi fiyatlarla hangel üzerinden yap, ek masraf ödemeden alışverişin bağışa dönüşsün. Profesyonel yetkinliklerinle gönüllü olarak değer kat. Kolektif bilinç ile mücadele ediyoruz.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xs sm:max-w-md">
          <Button size="lg" asChild className="w-full">
            <Link href="/login/individual">Giriş Yap</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-black">
            <Link href="/login/individual">Kayıt Ol</Link>
          </Button>
        </div>
      </main>

      <footer className="relative z-10 w-full border-t border-white/10 pt-12 pb-8 text-white/70">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
                <div className="md:col-span-1">
                    <HangelLogo className="text-2xl" />
                    <p className="mt-4 text-xs text-white/50">
                        Alışverişlerimizde ek ödeme yapmaksızın seçtiğimiz Sivil Toplum Kuruluşlarına %15’e varan oranlarda bağış yapmamızı ve sahip olduğumuz profesyonel yetkinliklerimizle gönüllülük faaliyetlerine katkı sunmamızı mümkün kılan, bağış ve gönüllük odaklı bir Sosyal Etki Platformudur.
                    </p>
                </div>
                <div>
                    <h4 className="font-semibold text-white">Keşfet</h4>
                    <nav className="mt-4 flex flex-col gap-2">
                        <Link href="/market" className="hover:text-white">Markalar</Link>
                        <Link href="/volunteering" className="hover:text-white">Gönüllülük</Link>
                        <Link href="/ngos" className="hover:text-white">STK'lar</Link>
                        <Link href="/admin/clubs" className="hover:text-white">Öğrenci Kulüpleri</Link>
                        <Link href="/library" className="hover:text-white">Kütüphane</Link>
                    </nav>
                </div>
                 <div>
                    <h4 className="font-semibold text-white">Kurumsal</h4>
                    <nav className="mt-4 flex flex-col gap-2">
                        <Link href="/about" className="hover:text-white">Hakkımızda</Link>
                        <Link href="/yatirimci-iliskileri" className="hover:text-white">Yatırımcı İlişkileri</Link>
                        <Link href="/bilgi-toplumu-hizmetleri" className="hover:text-white">Bilgi Toplumu Hizmetleri</Link>
                        <Link href="/settings/contracts" className="hover:text-white">Sözleşmeler</Link>
                    </nav>
                </div>
                 <div>
                    <h4 className="font-semibold text-white">İletişim</h4>
                     <div className="mt-4 flex gap-4">
                        <a href="https://twitter.com/hangel" target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5 hover:text-white" /></a>
                        <a href="https://instagram.com/hangel" target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 hover:text-white" /></a>
                        <a href="https://linkedin.com/company/hangel" target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5 hover:text-white" /></a>
                    </div>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs">
                <p className="text-white/50">&copy; {new Date().getFullYear()} hangel.org. Tüm hakları saklıdır.</p>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <Globe className="h-4 w-4" />
                     <Select defaultValue="tr">
                        <SelectTrigger className="w-[180px] bg-transparent border-white/20 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-foreground border-white/20 text-white">
                            <SelectItem value="tr">Türkçe</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="de" disabled>Deutsch</SelectItem>
                            <SelectItem value="fr" disabled>Français</SelectItem>
                            <SelectItem value="es" disabled>Español</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
