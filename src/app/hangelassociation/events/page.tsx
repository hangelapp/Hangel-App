
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, ArrowLeft, Calendar, MapPin, Users, Heart, Zap, Search, 
    Filter, ArrowDownUp, GraduationCap, Building2, Landmark, School, Globe,
    Target, Newspaper, ExternalLink, Award
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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

const EventCard = ({ day, month, title, desc, location, time, category, onClick }: any) => (
    <button onClick={onClick} className="group relative w-full text-left bg-[#f5f5f7] rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-10 hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-black/5">
        <div className="flex flex-col items-center justify-center bg-white rounded-3xl w-24 h-24 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
            <span className="text-3xl font-black tracking-tighter leading-none">{day}</span>
            <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100">{month}</span>
        </div>
        <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] font-black tracking-widest px-3 py-1 rounded-full">{category}</Badge>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {time}</span>
                {location && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary" /> {location}</span>}
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] tracking-tight group-hover:text-primary transition-colors leading-tight">{title}</h3>
            <p className="text-base text-muted-foreground leading-relaxed font-medium line-clamp-3">{desc}</p>
        </div>
        <div className="self-start md:self-center">
            <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                <ChevronRight className="h-6 w-6" />
            </div>
        </div>
    </button>
);

const InstitutionList = ({ title, count, items, icon: Icon, onDetailClick }: any) => (
    <div className="bg-white p-10 md:p-16 rounded-[3.5rem] border border-black/5 shadow-sm hover:shadow-2xl transition-all duration-700">
        <div className="flex items-center justify-between mb-12 border-b border-black/5 pb-8">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-[#f5f5f7] rounded-[1.5rem]">
                    <Icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h3 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">{title}</h3>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-60">Kurumsal Faaliyet Ağı</p>
                </div>
            </div>
            <span className="text-6xl md:text-8xl font-black tracking-tighter text-primary/10">{count}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
            {items.map((item: string, i: number) => (
                <button 
                    key={i} 
                    onClick={() => onDetailClick?.(item)}
                    className="flex items-center gap-4 text-sm font-bold text-[#1d1d1f]/70 text-left hover:text-primary transition-colors py-1 group"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:scale-150 transition-transform" />
                    {item}
                </button>
            ))}
        </div>
    </div>
);

export default function AssociationEventsPage() {
    const { toast } = useToast();
    
    const networkData = {
        universities: [
            "Sakarya Üniversitesi", "Mersin Üniversitesi", "Hakkari Üniversitesi 1", "Hakkari Üniversitesi 2", "İstanbul Üniversitesi",
            "Yıldız Teknik Üniversitesi", "Düzce Üniversitesi", "Bursa Teknik Üniversitesi", "Erzurum Atatürk Üniversitesi",
            "Akdeniz Üniversitesi", "Manisa Celal Bayar Üniversitesi", "İstanbul Medeniyet Üniversitesi", "İstanbul Medipol Üniversitesi",
            "İstanbul Gelişim Üniversitesi", "Çanakkale 18 Mart Üniversitesi", "İstanbul Kent Üniversitesi", "Maltepe Üniversitesi",
            "Tekirdağ Namık Kemal Üniversitesi", "Karamanoğlu Mehmetbey Üniversitesi", "İstanbul Şehir Üniversitesi",
            "Pamukkale Üniversitesi", "Mustafa Kemal Üniversitesi", "İzmir Ekonomi Üniversitesi", "Süleyman Demirel Üniversitesi",
            "Sabahattin Zaim Üniversitesi", "İstanbul Atlas Üniversitesi", "Kars Kafkas Üniversitesi", "Tunceli Munzur Üniversitesi",
            "Bandırma 17 Eylül Üniversitesi", "Ankara Medipol Üniversitesi", "Ankara Üniversitesi", "Kayseri Erciyes Üniversitesi",
            "Polonya Uluslararası Bilim ve Teknoloji Üniversitesi", "Yeditepe Üniversitesi", "Hacı Bayram Veli Üniversitesi"
        ],
        chambers: [
            "Tekirdağ Ticaret ve Sanayi Odası", "Ağrı Ticaret ve Sanayi Odası", "Karaman Ticaret ve Sanayi Odası", "Erdemli Ticaret ve Sanayi Odası",
            "Düzce Ticaret ve Sanayi Odası", "Antalya Ticaret ve Sanayi Odası", "Mersin Ticaret ve Sanayi Odası",
            "KOBİA (Azerbaycan)", "BEBKA", "İzmir Bornova Gençlik Merkezi", "GAP İdaresi", "Etimesgut Kent Konseyi", "Ankara Kent Konseyi"
        ],
        municipalities: [
            "Hakkari Valiliği", "Bilecik Valiliği", "İstanbul Büyükşehir Belediyesi", "Eskişehir Büyükşehir Belediyesi", "İzmir Büyükşehir Belediyesi",
            "İzmir Çiğli Belediyesi", "İzmir Bayraklı Belediyesi", "İzmir Bornova Belediyesi", "İzmir Buca Belediyesi", "İzmir Karşıyaka Belediyesi",
            "İzmir Bergama Belediyesi", "Manisa Şehzadeler Belediyesi", "Bursa İnegöl Belediyesi", "İstanbul Üsküdar Belediyesi", "Ankara Etimesgut Belediyesi",
            "Konya Büyükşehir Belediyesi"
        ],
        ngos: [
            "Tüzder Üstün Zekalılar Derneği", "Gaziantep JCI", "Bursa JCI", "Bursa Simbiyoz Aktivite",
            "İzmir Pergamon Lions Kulübü", "TÜGVA İzmir", "AIESEC İstanbul", "Azerbaycan Enactus",
            "TÜMMİAD", "Ability Pool", "Herbalife Eskişehir", "Genç Sosyal Hizmet Platformu", "Güçlü İyilik Platformu",
            "Evokulu Derneği", "e-gönüllü", "Azerbaycan Gençler Fondu", "Türkiye Patent Hareketi"
        ]
    };

    const handleEventClick = (title: string) => {
        toast({
            title: title,
            description: "Etkinlik detayları ve kayıt modülü hazırlanıyor.",
        });
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="events" />

            <section className="pt-32 pb-20 px-6 text-center space-y-6 bg-[#f5f5f7]">
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f]">Etkinlikler.</h1>
                <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-tight">
                    Türkiye genelinde 126 farkındalık konferansı ve zirve ile sosyal inovasyon bilincini yaygınlaştırıyoruz.
                </p>
            </section>

            <div className="container mx-auto max-w-6xl py-24 px-6 space-y-8">
                <div className="flex items-center gap-4 mb-10 border-b pb-6">
                    <Calendar className="h-10 w-10 text-primary" />
                    <h2 className="text-4xl font-bold tracking-tight">Öne Çıkan Etkinlikler</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                    <EventCard 
                        day="27" month="ARA" category="EĞİTİM & KONFERANS"
                        title="STK'larda Gelir Modeli Oluşturma ve Sürdürülebilirlik – Tekirdağ"
                        desc="Sivil toplum kuruluşlarının değişen dünyaya hızla uyum sağlayabilmesi, kendi kaynaklarını geliştirebilmesi ve toplumsal etki üretme kapasitesini güçlendirebilmesi artık her zamankinden daha kritik."
                        location="Tekirdağ Ticaret ve Sanayi Odası"
                        time="14:00 - 17:00"
                        onClick={() => handleEventClick("Tekirdağ STK Zirvesi")}
                    />
                    <EventCard 
                        day="01" month="ARA" category="ULUSLARARASI ÇALIŞTAY"
                        title="5. Uluslararası Sosyal Girişimcilik Çalıştayı"
                        desc="Her yıl yaklaşık 20 farklı ülkeden katılımcının yer aldığı, küresel sorunlara kolektif çözümlerin arandığı Social Business Global vizyon buluşması bu yıl Ankara'da."
                        location="Ankara, Türkiye"
                        time="08:00 - 17:00"
                        onClick={() => handleEventClick("5. Uluslararası Çalıştay")}
                    />
                    <EventCard 
                        day="06" month="ARA" category="ATÖLYE ÇALIŞMASI"
                        title="Canva Sivil Toplum Atölyesi"
                        desc="SivilFest Karşıyaka kapsamında düzenlenen Canva Atölyesi, STK'lar ve gönüllüler için pratik içerik üretme deneyimi sunuyor."
                        location="Karşıyaka, İzmir"
                        time="15:00 - 16:00"
                        onClick={() => handleEventClick("Canva Atölyesi")}
                    />
                </div>
            </div>

            <section className="py-32 px-6 bg-white">
                <div className="container mx-auto max-w-6xl space-y-12">
                    <InstitutionList icon={GraduationCap} title="Üniversiteler" count={42} items={networkData.universities} onDetailClick={(item: any) => handleEventClick(item)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <InstitutionList icon={Building2} title="Ticaret Odaları" count={12} items={networkData.chambers} onDetailClick={(item: any) => handleEventClick(item)} />
                        <InstitutionList icon={Landmark} title="Belediyeler" count={17} items={networkData.municipalities} onDetailClick={(item: any) => handleEventClick(item)} />
                    </div>
                    <InstitutionList icon={Globe} title="Sivil Toplum & Networkler" count={22} items={networkData.ngos} onDetailClick={(item: any) => handleEventClick(item)} />
                </div>
            </section>

            <PublicFooter currentPageLabel="Dernek Etkinlikleri" />
        </div>
    );
}
