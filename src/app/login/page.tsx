'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Globe, Twitter, Instagram, Linkedin } from 'lucide-react';


export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center bg-[#042654] text-white text-center p-6 overflow-hidden">
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

      <header className="relative z-10 w-full pt-4">
        <HangelLogo className="text-4xl" />
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center flex-1 w-full my-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
          yok öyle yalnız başına mücadele etmek!
        </h1>
        
        <p className="mt-4 text-lg md:text-xl max-w-3xl">
          Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
        </p>

        <p className="mt-8 max-w-3xl text-base text-white/80 leading-relaxed">
          Günlük alışverişlerini iyi fiyatlarla hangel üzerinden yap, ek masraf ödemeden alışverişin bağışa dönüşsün. Sahip olduğun profesyonel yetkinliklerle gönüllülük faaliyetlerine katılarak değer kat. Kollektif bilinç ile mücadele ediyoruz.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <Button size="lg" asChild className="w-full h-12 text-base">
            <Link href="/login/individual">Bireysel Giriş / Kayıt Ol</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full h-12 text-base bg-white/10 border-white/20 text-white hover:bg-white hover:text-[#042654]">
            <Link href="/login/corporate">Kurumsal Giriş / Kayıt Ol</Link>
          </Button>
        </div>
      </main>

      <nav className="relative z-10 w-full py-8">
        <div className="container mx-auto px-6 text-center text-white/80">
          <div className="flex justify-center gap-x-8 gap-y-2 flex-wrap">
            <Link href="/timeline" className="hover:text-white font-medium">Keşfet</Link>
            <Link href="/market" className="hover:text-white font-medium">Markalar</Link>
            <Link href="/volunteering" className="hover:text-white font-medium">Gönüllülük</Link>
            <Link href="/ngos" className="hover:text-white font-medium">STK'lar</Link>
            <Link href="/admin/clubs" className="hover:text-white font-medium">Öğrenci Kulüpleri</Link>
            <Link href="/library" className="hover:text-white font-medium">Kütüphane</Link>
          </div>
        </div>
      </nav>

      <footer className="relative z-10 w-full pt-8 pb-4">
         <div className="container mx-auto px-6 text-center text-white/60 text-xs space-y-4">
            <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap">
                <Link href="/about" className="hover:text-white">Hakkımızda</Link>
                <Link href="/yatirimci-iliskileri" className="hover:text-white">Yatırımcı İlişkileri</Link>
                <Link href="/bilgi-toplumu-hizmetleri" className="hover:text-white">Bilgi Toplumu Hizmetleri</Link>
                <Link href="/settings/contracts" className="hover:text-white">Sözleşmeler</Link>
                <Link href="/support" className="hover:text-white">İletişim</Link>
            </div>
            <div className="flex justify-center gap-5">
                <a href="#" target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5 hover:text-white" /></a>
                <a href="#" target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 hover:text-white" /></a>
                <a href="#" target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5 hover:text-white" /></a>
            </div>
            <div className="flex justify-center items-center gap-2 pt-2">
                <Globe className="h-4 w-4" />
                <span>Türkçe (21 dil desteklenmektedir)</span>
            </div>
            <p className='pt-4'>&copy; {new Date().getFullYear()} hangel.org. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
