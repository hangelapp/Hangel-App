'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Menu, 
    Globe, 
    Instagram, 
    Facebook, 
    Linkedin, 
    Youtube, 
    ArrowRight,
    MapPin,
    Search,
    ChevronRight,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    Carousel, 
    CarouselContent, 
    CarouselItem 
} from '@/components/ui/carousel';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Autoplay from "embla-carousel-autoplay";

const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const Header = () => (
    <header className="fixed top-0 inset-x-0 z-[100] bg-white/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1">
                <HangelLogo className="text-2xl" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Türkiye</span>
            </Link>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Menu className="h-6 w-6" />
                </Button>
            </div>
        </div>
    </header>
);

const HeroCard = ({ title, description, color, logo }: { title: string, description: string, color: string, logo?: string }) => (
    <div className={cn("relative h-[500px] w-full rounded-[2.5rem] overflow-hidden p-8 flex flex-col items-center justify-center text-center text-white", color)}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 space-y-6 max-w-xs">
            {logo && <div className="text-4xl font-black italic tracking-tighter opacity-90">{logo}</div>}
            <h2 className="text-2xl md:text-3xl font-bold leading-tight drop-shadow-md">{title}</h2>
            <p className="text-sm font-medium opacity-90 leading-relaxed">{description}</p>
            <Button variant="secondary" className="rounded-full px-8 h-12 font-bold shadow-lg">Detayları Keşfet</Button>
        </div>
    </div>
);

const PartnerLogo = ({ name, url, hint }: { name: string, url: string, hint: string }) => (
    <div className="aspect-square bg-white border rounded-2xl flex items-center justify-center p-4 hover:shadow-md transition-all group">
        <div className="relative w-full h-full">
            <Image src={url} alt={name} fill className="object-contain filter grayscale group-hover:grayscale-0 transition-all" data-ai-hint={hint} />
        </div>
    </div>
);

export default function LoginPage() {
    const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

    const partners = [
        { name: 'TEMA', url: 'https://logo.clearbit.com/tema.org.tr', hint: 'nature logo' },
        { name: 'Ahbap', url: 'https://logo.clearbit.com/ahbap.org', hint: 'community logo' },
        { name: 'LÖSEV', url: 'https://logo.clearbit.com/losev.org.tr', hint: 'charity logo' },
        { name: 'Decathlon', url: 'https://logo.clearbit.com/decathlon.com.tr', hint: 'sport logo' },
        { name: 'Hotiç', url: 'https://logo.clearbit.com/hotic.com.tr', hint: 'shoe logo' },
        { name: 'Network', url: 'https://logo.clearbit.com/network.com.tr', hint: 'fashion logo' },
    ];

    return (
        <div className="min-h-screen bg-[#f5f5f5] selection:bg-primary selection:text-white">
            <Header />
            
            <main className="pt-14">
                {/* Hero Slider */}
                <section className="py-6 px-4">
                    <Carousel plugins={[plugin.current]} className="w-full max-w-5xl mx-auto">
                        <CarouselContent className="-ml-4">
                            <CarouselItem className="pl-4 basis-[90%] md:basis-full">
                                <HeroCard 
                                    title="İyiliğin ve Sosyal Etkinin Buluşma Noktası" 
                                    description="Toplumsal sorunlara birlikte çözüm üretiyor, umudu el ele büyütüyoruz." 
                                    color="bg-gradient-to-br from-[#f34723] to-[#ff7a45]"
                                    logo="hangel"
                                />
                            </CarouselItem>
                            <CarouselItem className="pl-4 basis-[90%] md:basis-full">
                                <HeroCard 
                                    title="Alışverişlerinizi Bağışa Dönüştürün" 
                                    description="Seçtiğiniz markalardan yapacağınız harcamalar, hiçbir ek ücret ödemeden STK'lara hayat veriyor." 
                                    color="bg-gradient-to-br from-[#042654] to-[#1a4a8a]"
                                    logo="market"
                                />
                            </CarouselItem>
                            <CarouselItem className="pl-4 basis-[90%] md:basis-full">
                                <HeroCard 
                                    title="Gönüllülükte Yeni Bir Boyut" 
                                    description="Yeteneklerinizi toplumsal fayda için kullanın, Sosyal Etki Puanı ile etkinizi takip edin." 
                                    color="bg-gradient-to-br from-[#10b981] to-[#34d399]"
                                    logo="imece"
                                />
                            </CarouselItem>
                        </CarouselContent>
                    </Carousel>
                </section>

                {/* Main Title */}
                <section className="py-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#1d1d1f] uppercase">hangel Hub</h1>
                </section>

                {/* Story Section */}
                <section className="px-4 py-8 space-y-12 max-w-5xl mx-auto">
                    <Card className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-white">
                        <CardHeader className="p-8 md:p-12 text-center space-y-6">
                            <CardTitle className="text-3xl font-bold">Hikayemiz</CardTitle>
                            <div className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto space-y-4">
                                <p>Hangel, Türkiye’nin en güçlü sivil toplum ve sosyal etki ekosistemini dijital dünyada inşa etmek üzere yola çıktı.</p>
                                <p>Bireylerin sadece tüketici değil, aynı zamanda birer değişim öncüsü olabileceği bir dünya hayal ediyoruz. Her alışveriş, her gönüllülük saati ve her paylaşım, toplumsal bir soruna çözüm olma potansiyeli taşır.</p>
                            </div>
                            <div className="pt-4">
                                <Button variant="outline" className="rounded-full px-10 h-14 border-2 font-bold hover:bg-primary hover:text-white transition-all" asChild>
                                    <Link href="/about">Hangel Hakkında Daha Fazlası</Link>
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="relative h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
                        <Image 
                            src="https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop" 
                            alt="History" 
                            fill 
                            className="object-cover" 
                            data-ai-hint="volunteers together"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    <Card className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-white">
                        <CardHeader className="p-8 md:p-12 text-center space-y-6">
                            <CardTitle className="text-3xl font-bold">Sürdürülebilirlik ve Şeffaflık</CardTitle>
                            <div className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto space-y-4">
                                <p>Platformumuzun temelini hesap verebilirlik oluşturur. Toplanan her kuruşun ve tamamlanan her gönüllülük faaliyetinin sosyal etkisini ölçümlüyor ve raporluyoruz.</p>
                                <p>Hangel Şeffaflık Endeksi ile sivil toplum kuruluşlarının güvenilirliğini teyit ederken, markaların sosyal sorumluluk taahhütlerini yerine getirmelerini sağlıyoruz. Gelecek nesillere daha yaşanabilir bir dünya bırakmak için çalışıyoruz.</p>
                            </div>
                            <div className="pt-4">
                                <Button variant="outline" className="rounded-full px-10 h-14 border-2 font-bold hover:bg-primary hover:text-white transition-all" asChild>
                                    <Link href="/impact-story">Etki Raporlarımızı İnceleyin</Link>
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="relative h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
                        <Image 
                            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop" 
                            alt="Impact" 
                            fill 
                            className="object-cover" 
                            data-ai-hint="data charts"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                </section>

                {/* Announcements */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <h2 className="text-3xl font-black tracking-tighter text-center uppercase mb-12">GÜNCEL DUYURULAR</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="relative h-[500px] rounded-[2.5rem] overflow-hidden group shadow-lg">
                                <Image src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop" alt="News 1" fill className="object-cover group-hover:scale-105 transition-transform duration-700" data-ai-hint="happy people" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-8 text-white space-y-3">
                                    <Badge className="bg-primary hover:bg-primary">Kampanya</Badge>
                                    <h3 className="text-2xl font-bold leading-tight">Üniversite Temsilciliği Başvuruları Başladı!</h3>
                                    <p className="text-sm opacity-80">Kampüsünüzde sosyal etkiyi örgütleyin, Hangel elçisi olun.</p>
                                </div>
                            </div>
                            <div className="relative h-[500px] rounded-[2.5rem] overflow-hidden group shadow-lg">
                                <Image src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" alt="News 2" fill className="object-cover group-hover:scale-105 transition-transform duration-700" data-ai-hint="modern building" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-8 text-white space-y-3">
                                    <Badge className="bg-blue-600 hover:bg-blue-600">Teknoloji</Badge>
                                    <h3 className="text-2xl font-bold leading-tight">QR Ödeme Altyapımız Yayında</h3>
                                    <p className="text-sm opacity-80">Üye işyerlerinde hızlı ve bağış odaklı ödeme dönemi.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Partners Grid */}
                <section className="py-24 bg-[#f5f5f5]">
                    <div className="container mx-auto px-4 max-w-5xl text-center">
                        <h2 className="text-3xl font-black tracking-tighter uppercase mb-12">ÖNE ÇIKAN ORTAKLARIMIZ</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {partners.map(p => (
                                <PartnerLogo key={p.name} name={p.name} url={p.url} hint={p.hint} />
                            ))}
                        </div>
                        <div className="mt-12">
                            <Button size="lg" className="rounded-full px-12 h-14 font-bold text-lg shadow-xl" asChild>
                                <Link href="/login/selection?action=register">Hemen Katıl</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Corporate Footer */}
            <footer className="bg-black text-white py-16">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16 border-b border-white/10 pb-16">
                        <div className="space-y-6 max-w-xs">
                            <HangelLogo className="text-4xl text-white" />
                            <p className="text-sm text-gray-400">Umudu büyütüyor, toplumsal sorunlar için teknolojiyle birlikte çalışıyoruz.</p>
                            <Button variant="outline" className="border-white/20 text-white rounded-full hover:bg-white hover:text-black">
                                <MapPin className="mr-2 h-4 w-4" /> Türkiye
                            </Button>
                        </div>
                        
                        <div className="w-full md:w-[60%]">
                            <Accordion type="single" collapsible className="w-full text-white">
                                <AccordionItem value="item-1" className="border-white/10">
                                    <AccordionTrigger className="text-lg font-bold hover:no-underline py-6 uppercase tracking-wider text-left">HAKKIMIZDA</AccordionTrigger>
                                    <AccordionContent className="space-y-4 text-gray-400">
                                        <Link href="/about" className="block hover:text-white transition-colors">Biz Kimiz?</Link>
                                        <Link href="/impact-story" className="block hover:text-white transition-colors">Sosyal Etkimiz</Link>
                                        <Link href="/press" className="block hover:text-white transition-colors">Basın Odası</Link>
                                        <Link href="/yatirimci-iliskileri" className="block hover:text-white transition-colors">Yatırımcı İlişkileri</Link>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2" className="border-white/10">
                                    <AccordionTrigger className="text-lg font-bold hover:no-underline py-6 uppercase tracking-wider text-left">YARDIM MI GEREKİYOR?</AccordionTrigger>
                                    <AccordionContent className="space-y-4 text-gray-400">
                                        <Link href="/support" className="block hover:text-white transition-colors">Destek Merkezi</Link>
                                        <Link href="/support/faq" className="block hover:text-white transition-colors">Sıkça Sorulan Sorular</Link>
                                        <Link href="/contact" className="block hover:text-white transition-colors">Bize Ulaşın</Link>
                                        <Link href="/merchant" className="block hover:text-white transition-colors">Üye İşyeri Başvurusu</Link>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                        <div className="flex flex-wrap justify-center gap-6 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                            <Link href="/settings/contracts/kullanici-sozlesmesi" className="hover:text-white">Kullanım Şartları</Link>
                            <Link href="/settings/contracts/gizlilik-politikasi" className="hover:text-white">Gizlilik Politikası</Link>
                            <Link href="/settings/contracts/cerez-politikasi" className="hover:text-white">Çerezler</Link>
                            <Link href="/bilgi-toplumu-hizmetleri" className="hover:text-white">Bilgi Toplumu Hizmetleri</Link>
                        </div>
                        
                        <div className="flex gap-4">
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><XIcon className="h-5 w-5" /></Button>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><Instagram className="h-5 w-5" /></Button>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><Facebook className="h-5 w-5" /></Button>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><Linkedin className="h-5 w-5" /></Button>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><Youtube className="h-5 w-5" /></Button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex gap-4">
                            <div className="relative w-32 h-10 border border-white/20 rounded-md bg-white/5 flex items-center justify-center">
                                <span className="text-[10px] font-bold">App Store'dan İndir</span>
                            </div>
                            <div className="relative w-32 h-10 border border-white/20 rounded-md bg-white/5 flex items-center justify-center">
                                <span className="text-[10px] font-bold">Google Play'den Alın</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600">© 2024 Hangel Teknoloji A.Ş. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
