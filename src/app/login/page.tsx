'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070"
          alt="Topluluk"
          fill
          className="object-cover opacity-20"
          data-ai-hint="community hands"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/80 to-black" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center flex-1">
        <HangelLogo className="text-5xl md:text-6xl mb-6" />
        
        <p className="text-lg md:text-xl font-semibold text-primary/90 tracking-widest uppercase">
          yok öyle yalnız başına mücadele etmek!
        </p>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-4 max-w-4xl">
          Umudu Büyütüyoruz, Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
        </h1>

        <p className="mt-8 max-w-2xl text-base md:text-lg text-white/80">
          Kolektif bilinç ile mücadele ediyoruz. Profesyonel yetkinliklerinle gönüllü olarak değer kat, alışverişlerinle ek ödeme yapmadan %20'ye varan oranlarda bağışa dönüştür.
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

      <footer className="relative z-10 w-full max-w-4xl py-8 text-center text-xs text-white/40">
        <p>
            Alışverişlerimizde ek ödeme yapmaksızın seçtiğimiz Sivil Toplum Kuruluşlarına bağış yapmamızı; sahip olduğumuz profesyonel yetkinliklerimizle gönüllülük faaliyetlerine katkı sunmamızı mümkün kılan, bağış ve gönüllük odaklı bir Sosyal Etki Platformudur.
        </p>
        <nav className="mt-6 flex justify-center gap-4 sm:gap-6 text-sm">
            <Link href="/market" className="transition-colors hover:text-white">Markalar</Link>
            <Link href="/volunteering" className="transition-colors hover:text-white">Gönüllülük</Link>
            <Link href="/ngos" className="transition-colors hover:text-white">STK'lar</Link>
            <Link href="/admin/clubs" className="transition-colors hover:text-white">Öğrenci Kulüpleri</Link>
            <Link href="/library" className="transition-colors hover:text-white">Kütüphane</Link>
        </nav>
      </footer>
    </div>
  );
}
