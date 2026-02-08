'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Calendar, MapPin, Users, Heart, Zap, ExternalLink, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';

const AssociationHeader = ({ currentPage }: { currentPage: string }) => {
    const router = useRouter();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.push('/hangelassociation')} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-[#1d1d1f]/60">
                    <Link href="/hangelassociation/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>Dernek Hakkında</Link>
                    <Link href="/hangelassociation/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>Dernek Etkinlikleri</Link>
                    <Link href="/hangelassociation/workshop" className={cn("hover:text-primary transition-colors", currentPage === 'workshop' && "text-primary")}>Uluslararası Çalıştay</Link>
                    <Link href="/hangelassociation/legislation" className={cn("hover:text-primary transition-colors", currentPage === 'legislation' && "text-primary")}>Mevzuat Taslağı</Link>
                </nav>
                <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                    <Link href="/login/selection?action=register">Gönüllü Ol</Link>
                </Button>
            </div>
        </header>
    );
};

const EventLineup = ({ title, date, location, image, hint, description, category }: any) => (
    <div className="group relative w-full border-b border-black/5 py-16 flex flex-col md:flex-row items-center gap-12 px-6 hover:bg-[#f5f5f7]/50 transition-colors">
        <div className="relative w-full md:w-80 aspect-video rounded-[2rem] overflow-hidden shadow-2xl shrink-0">
            <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" data-ai-hint={hint} />
        </div>
        <div className="flex-1 text-left space-y-4">
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold uppercase text-[9px] tracking-widest px-3 py-1 rounded-full">{category}</Badge>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1d1d1f]/40 flex items-center gap-1"><Calendar className="h-3 w-3" /> {date}</span>
            </div>
            <h3 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">{title}</h3>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-medium">{description}</p>
            <div className="flex items-center gap-4 pt-2">
                <span className="text-[11px] font-bold text-[#1d1d1f]/60 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {location}</span>
            </div>
        </div>
        <Button variant="outline" className="rounded-full px-8 h-12 font-bold border-black/10 hover:bg-white self-start md:self-center">İncele</Button>
    </div>
);

const Badge = ({ children, className }: any) => (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", className)}>
        {children}
    </span>
);

export default function AssociationEventsPage() {
    const pressLinks = [
        { source: "AA", title: "Türkiye'nin Sosyal Girişimcilik Etki Haritası", url: "https://www.aa.com.tr/tr/turkiye/turkiyenin-sosyal-girisimcilik-etki-haritasi-cikartilacak/1526753" },
        { source: "TRT Haber", title: "Sosyal Girişimcilik Etki Haritası Çıkarılacak", url: "https://www.trthaber.com/haber/turkiye/turkiyenin-sosyal-girisimcilik-etki-haritasi-cikarilacak-422386.html" },
        { source: "Akşam", title: "Uluslararası Çalıştay İstanbul'da Toplandı", url: "https://www.aksam.com.tr/guncel/uluslararasi-sosyal-girisimcilik-calistayi-istanbulda-toplandi/haber-1006693" },
        { source: "Platin", title: "Sosyal Girişimcilik Zirvesi Düzce'de", url: "https://www.platinonline.com/girisimcilik/uluslararasi-sosyal-girisimcilik-zirvesi-ilk-kez-duzcede-1012108" },
        { source: "Hürriyet", title: "Rekabetin Yeni Adı: Sosyal Fayda", url: "https://www.hurriyet.com.tr/yazarlar/sibel-bagci-uzun/rekabetin-yeni-adi-sosyal-fayda-41862206" }
    ];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="events" />

            <section className="pt-32 pb-20 px-6 text-center space-y-4 bg-[#f5f5f7]">
                <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-[#1d1d1f]">Topluluk Gücü.</h1>
                <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                    5 yılda 126 farkındalık etkinliği ile 15.621 kişiye ulaştık. Türkiye'nin 42 üniversitesinde vizyon buluşmaları gerçekleştirdik.
                </p>
            </section>

            <div className="container mx-auto max-w-6xl">
                <EventLineup 
                    category="AFET DAYANIŞMASI"
                    title="Deprem Bölgesi Örnek Köy Projesi"
                    date="2023 - 2024"
                    location="Hatay, Antakya"
                    description="4000 gönüllü ve 2000 işletme desteğiyle; 10 tiny house, 1 kreş, 1 atölye ve 1 kütüphaneden oluşan yaşam alanını Hatay'da kurduk."
                    image="https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop"
                    hint="charity village concept"
                />
                <EventLineup 
                    category="GLOBAL DİYALOG"
                    title="Uluslararası Sosyal Girişimcilik Çalıştayı"
                    date="Yıllık Periyot"
                    location="İstanbul, Mersin, İzmir, Tunceli"
                    description="54 ülkeden 421 vizyoner liderle ortak sorunlara kolektif çözümler ürettik. 632 sosyal girişimi big data formatında raporladık."
                    image="https://images.unsplash.com/photo-1540575861501-7ad0582371f3?q=80&w=2070&auto=format&fit=crop"
                    hint="international conference auditorium"
                />
                <EventLineup 
                    category="AKADEMİK ZİRVE"
                    title="Güçlü İyilik: Sosyal Girişim Zirvesi"
                    date="Dönemsel"
                    location="42 Üniversite Kampüsü"
                    description="Atatürk, Hakkari ve Pamukkale Üniversiteleri başta olmak üzere Anadolu'nun her köşesinde gençlerimizle sosyal inovasyonu konuştuk."
                    image="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop"
                    hint="university students seminar"
                />
            </div>

            {/* Basında Biz Section */}
            <section className="py-32 bg-white border-t border-black/5">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="flex items-center gap-3 mb-12">
                        <Newspaper className="h-8 w-8 text-primary" />
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">Basında Biz.</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {pressLinks.map((link, i) => (
                            <a 
                                key={i} 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group flex items-center justify-between p-6 bg-[#f5f5f7] rounded-2xl hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-black/5"
                            >
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{link.source}</span>
                                    <h4 className="text-lg font-bold text-[#1d1d1f] group-hover:text-primary transition-colors">{link.title}</h4>
                                </div>
                                <ExternalLink className="h-5 w-5 text-[#1d1d1f]/20 group-hover:text-primary transition-colors" />
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-black text-white py-32 text-center">
                <div className="container mx-auto px-6 max-w-4xl space-y-8">
                    <Heart className="h-16 w-16 text-primary mx-auto" />
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Dayanışmanın Lideriyiz.</h2>
                    <p className="text-xl md:text-2xl text-white/70 leading-relaxed font-medium">
                        "Bir toplumun gücü, en savunmasız anlarda gösterdiği dayanışma ile ölçülür." 60 karavan gönüllüsüyle sahada arama kurtarma ve eczacı ekiplerine ev sahipliği yaptık.
                    </p>
                </div>
            </section>

            <PublicFooter currentPageLabel="Dernek Etkinlikleri" />
        </div>
    );
}
