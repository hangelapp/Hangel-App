'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-foreground text-white text-center p-6" style={{'--background': '#042654', '--foreground': '#ffffff'}}>
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

      <main className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
        <HangelLogo className="text-5xl md:text-6xl mb-8" />

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight max-w-2xl">
          Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.
        </h1>

        <p className="mt-6 max-w-xl text-base md:text-lg text-white/80">
          İyiliğin ve sosyal etkinin buluşma noktasına hoş geldin.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xs sm:max-w-sm">
          <Button size="lg" asChild className="w-full h-12 text-base">
            <Link href="/login/individual">Bireysel Giriş</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full h-12 text-base bg-white/10 border-white/20 text-white hover:bg-white hover:text-foreground">
            <Link href="/login/corporate">Kurumsal Giriş</Link>
          </Button>
        </div>
      </main>

       <footer className="relative z-10 w-full pb-8">
         <div className="container mx-auto px-6 text-center text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} hangel.org. Tüm hakları saklıdır.</p>
             <div className="flex justify-center gap-4 mt-4">
                  <Link href="/about" className="hover:text-white">Hakkımızda</Link>
                  <Link href="/settings/contracts" className="hover:text-white">Sözleşmeler</Link>
                   <Link href="/support" className="hover:text-white">Destek</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
