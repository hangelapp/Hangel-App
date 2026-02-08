'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
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
                <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-[#1d1d1f]/60">
                    <Link href="/association/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>Hakkında</Link>
                    <Link href="/association/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>Etkinlikler</Link>
                    <Link href="/association/workshop" className={cn("hover:text-primary transition-colors", currentPage === 'workshop' && "text-primary")}>Uluslararası Çalıştay</Link>
                    <Link href="/association/legislation" className={cn("hover:text-primary transition-colors", currentPage === 'legislation' && "text-primary")}>Mevzuat Taslağı</Link>
                </nav>
                <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                    <Link href="/login/selection?action=register">Gönüllü Ol</Link>
                </Button>
            </div>
        </header>
    );
};

const EventLineup = ({ title, date, location, image, hint, description }: any) => (
    <div className="group relative w-full border-b border-black/5 py-12 flex flex-col md:flex-row items-center gap-8 px-6 hover:bg-[#f5f5f7]/50 transition-colors">
        <div className="relative w-full md:w-64 aspect-video rounded-2xl overflow-hidden shadow-lg shrink-0">
            <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={hint} />
        </div>
        <div className="flex-1 text-left space-y-2">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {date}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {location}</span>
            </div>
            <h3 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{description}</p>
        </div>
        <Button variant="outline" className="rounded-full px-6 font-bold self-start md:self-center">Detaylar</Button>
    </div>
);

export default function AssociationEventsPage() {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="events" />

            <section className="pt-32 pb-20 px-6 text-center space-y-4 bg-[#f5f5f7]">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f]">Topluluk Gücü.</h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                    5 yılda 126 farkındalık etkinliği ile 15.621 kişiye doğrudan ulaştık. İşte bazı vizyon buluşmalarımız.
                </p>
            </section>

            <div className="container mx-auto max-w-5xl">
                <EventLineup 
                    title="Uluslararası Sosyal Girişimcilik Çalıştayı"
                    date="Yıllık Periyot"
                    location="İstanbul, Mersin, İzmir, Tunceli"
                    description="54 ülkeden 421 katılımcı ile sınırları aşan bir öğrenme ve etki modeli. Her yıl farklı bir şehirde global sorunlara kolektif çözümler."
                    image="https://images.unsplash.com/photo-1540575861501-7ad0582371f3?q=80&w=2070&auto=format&fit=crop"
                    hint="international conference auditorium"
                />
                <EventLineup 
                    title="Güçlü İyilik: Sosyal Girişim Zirvesi"
                    date="Dönemsel"
                    location="Üniversite Kampüsleri"
                    description="Atatürk, Hakkari ve Pamukkale Üniversiteleri başta olmak üzere 42 üniversitede düzenlenen akademi-saha buluşmaları."
                    image="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop"
                    hint="university students seminar"
                />
                <EventLineup 
                    title="Deprem Bölgesitiny House & Kreş Kurulumu"
                    date="2023 - 2024"
                    location="Hatay, Antakya"
                    description="4000 gönüllü ve 2000 işletme desteğiyle Hatay'da kurulan Örnek Köy projesi kapsamında tiny house, kreş ve kütüphane teslimatları."
                    image="https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop"
                    hint="charity box delivery"
                />
                <EventLineup 
                    title="Etki Odaklı İstihdam Protokolü Lansmanı"
                    date="2024"
                    location="İstanbul"
                    description="Arçelik ile başlatılan, gönüllülük faaliyetlerini resmi özgeçmişin bir parçası sayan Türkiye'nin ilk istihdam protokolü duyurusu."
                    image="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop"
                    hint="business handshake corporate"
                />
            </div>

            <PublicFooter currentPageLabel="Etkinlikler" />
        </div>
    );
}
