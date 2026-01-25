'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Heart, ShoppingCart, BarChart, Menu } from 'lucide-react';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';


const PublicHeader = () => (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
            <div className="mr-4 hidden md:flex">
                <Link href="/login" className="mr-6 flex items-center space-x-2">
                    <HangelLogo className="text-2xl" />
                </Link>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="/market" className="transition-colors hover:text-foreground/80 text-foreground/60">Markalar</Link>
                    <Link href="/volunteering" className="transition-colors hover:text-foreground/80 text-foreground/60">Gönüllülük</Link>
                    <Link href="/ngos" className="transition-colors hover:text-foreground/80 text-foreground/60">STK'lar</Link>
                    <Link href="/admin/clubs" className="transition-colors hover:text-foreground/80 text-foreground/60">Öğrenci Kulüpleri</Link>
                    <Link href="/library" className="transition-colors hover:text-foreground/80 text-foreground/60">Kütüphane</Link>
                </nav>
            </div>

            <div className='md:hidden'>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Menüyü Aç</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <div className="flex flex-col space-y-4 py-6">
                            <SheetClose asChild>
                                <Link href="/login" className="flex items-center space-x-2 px-4 mb-4">
                                    <HangelLogo className="text-2xl" />
                                </Link>
                            </SheetClose>
                            <SheetClose asChild><Link href="/market" className="text-lg p-4 border-b">Markalar</Link></SheetClose>
                            <SheetClose asChild><Link href="/volunteering" className="text-lg p-4 border-b">Gönüllülük</Link></SheetClose>
                            <SheetClose asChild><Link href="/ngos" className="text-lg p-4 border-b">STK'lar</Link></SheetClose>
                            <SheetClose asChild><Link href="/admin/clubs" className="text-lg p-4 border-b">Öğrenci Kulüpleri</Link></SheetClose>
                            <SheetClose asChild><Link href="/library" className="text-lg p-4">Kütüphane</Link></SheetClose>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="flex flex-1 items-center justify-end space-x-2">
                <nav className="flex items-center gap-2">
                     <Button variant="ghost" asChild>
                        <Link href="/login/individual">Giriş Yap</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/login/individual">Kayıt Ol</Link>
                    </Button>
                </nav>
            </div>
        </div>
    </header>
);


const FeatureCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <div className="relative overflow-hidden rounded-lg border bg-card p-6">
        <div className="flex flex-col justify-between rounded-md h-full">
            <div className="space-y-4">
                <Icon className="h-10 w-10 text-primary" />
                <h3 className="text-2xl font-bold">{title}</h3>
                <p className="text-base text-muted-foreground">{children}</p>
            </div>
        </div>
    </div>
);

export default function LoginPage() {
  return (
    <div className="bg-background">
      <PublicHeader />
      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32">
            <div className="container text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                    İyiliği Bir Yaşam Biçimi Haline Getirin
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
                    Hangel, sosyal etki yaratmak isteyen bireyleri, sivil toplum kuruluşlarını ve sosyal sorumlu markaları tek bir platformda birleştirir.
                </p>
                <div className="flex justify-center gap-4">
                    <Button size="lg" asChild>
                        <Link href="/login/individual">Hemen Katıl <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="#features">Daha Fazlasını Keşfet</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-24 bg-muted">
            <div className="container">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Neler Yapabilirsiniz?</h2>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard icon={Heart} title="Gönüllü Olun, Değer Katın">
                        Yeteneklerinize ve ilgi alanlarınıza uygun gönüllülük fırsatlarını keşfedin. Zamanınızla ve bilginizle topluma doğrudan katkıda bulunun.
                    </FeatureCard>
                    <FeatureCard icon={ShoppingCart} title="Alışverişle Destek Olun">
                        Anlaşmalı yüzlerce markadan yaptığınız her alışverişle, hiçbir ek ücret ödemeden seçtiğiniz STK'ya bağış yapılmasını sağlayın.
                    </FeatureCard>
                    <FeatureCard icon={BarChart} title="Etkinizi Görün ve Paylaşın">
                        Yaptığınız her katkıyla 'Sosyal Etki Puanı' kazanın. Rozetler ve sertifikalarla başarılarınızı sergileyerek çevrenize ilham kaynağı olun.
                    </FeatureCard>
                </div>
            </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-24">
            <div className="container grid items-center gap-12 lg:grid-cols-2">
                 <div>
                    <Image
                        src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070"
                        alt="How it works"
                        width={600}
                        height={400}
                        className="rounded-xl object-cover"
                        data-ai-hint="team helping community"
                    />
                </div>
                <div className="space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold">Nasıl Çalışır?</h2>
                    <div className="space-y-4 text-lg text-muted-foreground">
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0 mt-1">1</div>
                            <p>İlgi alanlarınıza ve desteklemek istediğiniz sosyal konulara göre STK'ları ve markaları takip edin.</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0 mt-1">2</div>
                            <p>Anlaşmalı markalardan alışveriş yaparak veya gönüllülük faaliyetlerine katılarak sosyal etki yaratın.</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0 mt-1">3</div>
                            <p>Profilinizde biriken etki puanlarınızı, kazandığınız rozetleri ve yarattığınız pozitif değişimi takip edin.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Partners Section */}
        <section className="py-20 md:py-24 bg-muted">
            <div className="container">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Paydaşlarımız</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center">
                    {['tema.org.tr', 'ahbap.org', 'losev.org.tr', 'tegv.org', 'tohumotizm.org.tr', 'decathlon.com.tr', 'patagonia.com', 'ipekyol.com.tr', 'boyner.com.tr', 'karaca.com'].map(logo => (
                        <Image key={logo} src={`https://logo.clearbit.com/${logo}`} alt={logo} width={120} height={40} className="mx-auto grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
                    ))}
                </div>
            </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 md:py-24">
            <div className="container text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Değişimin Bir Parçası Olun</h2>
                <p className="mx-auto max-w-xl text-lg text-muted-foreground mb-8">
                    Hemen ücretsiz bir hesap oluşturarak iyilik hareketine katılın.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                     <Button size="lg" asChild>
                        <Link href="/login/individual">Bireysel Olarak Katıl</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/login/corporate">Kurumsal Olarak Katıl</Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-12">
            <div className="grid gap-8 md:grid-cols-4">
                <div className="space-y-4">
                    <HangelLogo className="text-2xl" />
                    <p className="text-sm text-muted-foreground">İyiliğin ve sosyal etkinin buluşma noktası.</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Keşfet</h4>
                    <nav className="space-y-2 text-sm">
                        <Link href="/market" className="block text-muted-foreground hover:text-foreground">Markalar</Link>
                        <Link href="/volunteering" className="block text-muted-foreground hover:text-foreground">Gönüllülük</Link>
                        <Link href="/ngos" className="block text-muted-foreground hover:text-foreground">STK'lar</Link>
                        <Link href="/admin/clubs" className="block text-muted-foreground hover:text-foreground">Öğrenci Kulüpleri</Link>
                    </nav>
                </div>
                 <div>
                    <h4 className="font-semibold mb-4">Hakkımızda</h4>
                    <nav className="space-y-2 text-sm">
                        <Link href="/about" className="block text-muted-foreground hover:text-foreground">Hakkımızda</Link>
                        <Link href="/support" className="block text-muted-foreground hover:text-foreground">Destek Merkezi</Link>
                        <Link href="/settings/contracts" className="block text-muted-foreground hover:text-foreground">Sözleşmeler</Link>
                    </nav>
                </div>
                 <div>
                    <h4 className="font-semibold mb-4">Bizi Takip Edin</h4>
                     <nav className="space-y-2 text-sm">
                        <a href="#" className="block text-muted-foreground hover:text-foreground">Twitter</a>
                        <a href="#" className="block text-muted-foreground hover:text-foreground">Instagram</a>
                        <a href="#" className="block text-muted-foreground hover:text-foreground">LinkedIn</a>
                    </nav>
                </div>
            </div>
            <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Hangel. Tüm hakları saklıdır.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
