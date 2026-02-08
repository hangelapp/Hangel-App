'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Heart, Truck, Home, Newspaper, ExternalLink, School, Building2, Landmark, GraduationCap, Globe, Zap, MessageSquare, Briefcase, Target, Award, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

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

const ArrowLeft = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const Badge = ({ children, className }: any) => (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest", className)}>
        {children}
    </span>
);

const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="text-left space-y-2 mb-12">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">{title}</h2>
        {subtitle && <p className="text-lg text-muted-foreground font-medium max-w-2xl">{subtitle}</p>}
    </div>
);

const InstitutionList = ({ title, count, items, icon: Icon, logos, onDetailClick }: { title: string, count: number, items: string[], icon: any, logos?: string[], onDetailClick?: (item: string) => void }) => (
    <div className="space-y-8 bg-white p-8 md:p-12 rounded-[3rem] border border-black/5 shadow-sm hover:shadow-2xl transition-all">
        <div className="flex items-end justify-between border-b border-black/5 pb-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#f5f5f7] rounded-2xl">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">{title}</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aktif İş Birliği</p>
                </div>
            </div>
            <span className="text-5xl font-black tracking-tighter text-primary/20">{count}</span>
        </div>
        
        {logos && (
            <div className="flex flex-wrap gap-6 mb-8 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                {logos.map((logo, i) => (
                    <Avatar key={i} className="h-12 w-12 border bg-white p-1 rounded-xl">
                        <AvatarImage src={logo} className="object-contain" />
                        <AvatarFallback><Building2 /></AvatarFallback>
                    </Avatar>
                ))}
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-3">
            {items.map((item, i) => (
                <button 
                    key={i} 
                    onClick={() => onDetailClick?.(item)}
                    className="flex items-center gap-3 text-[13px] font-medium text-[#1d1d1f]/70 text-left leading-relaxed border-l-2 border-transparent hover:border-primary/20 hover:pl-3 transition-all"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
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
            "KOBİA (Azerbaycan)", "BEBKA (Bursa Eskişehir Kalkınma Ajansı)", "Gençlik ve Spor Bakanlığı Gençlik Merkezi", "GAP İdaresi", "Etimesgut Kent Konseyi", "Ankara Kent Konseyi"
        ],
        municipalities: [
            "Hakkari Valiliği", "Bilecik Valiliği", "İstanbul Büyükşehir Belediyesi", "Eskişehir Büyükşehir Belediyesi", "İzmir Büyükşehir Belediyesi",
            "İzmir Çiğli Belediyesi", "İzmir Bayraklı Belediyesi", "İzmir Bornova Belediyesi", "İzmir Buca Belediyesi", "İzmir Karşıyaka Belediyesi",
            "İzmir Bergama Belediyesi", "Manisa Şehzadeler Belediyesi", "Bursa İnegöl Belediyesi", "İstanbul Üsküdar Belediyesi", "Ankara Etimesgut Belediyesi",
            "Konya Büyükşehir Belediyesi"
        ],
        schools: [
            "İstanbul Doğa Koleji", "Bursa Şükrü Şenkaya Anadolu Lisesi", "İzmir Suphi Koyuncu Lisesi", "İzmir Bornova Anadolu Lisesi",
            "Ferhatlar Koleji (Denizli)", "İzmir İsabet Koleji", "Manisa Endüstri Meslek Lisesi", "Manisa Kız Meslek Lisesi", "Hakkari Anadolu Lisesi",
            "Şemdinli Anadolu Lisesi", "Şemdinli İmam Hatip Lisesi", "Antalya Manavgat Fen Lisesi", "Antalya Manavgat Meslek Lisesi",
            "Manavgat Evliya Çelebi Teknik Lisesi", "Antalya Manavgat Bilsem"
        ],
        ngos: [
            "Tüzder Üstün Zekalılar Derneği", "Gaziantep JCI Temsilciliği", "Bursa JCI Temsilciliği", "Bursa Simbiyoz Aktivite Derneği",
            "İzmir Pergamon Lions Kulübü", "TÜGVA İzmir Temsilciliği", "AIESEC İstanbul", "Azerbaycan Enactus Temsilciliği",
            "TÜMMİAD", "Ability Pool", "Herbalife Eskişehir", "Genç Sosyal Hizmet Platformu", "Güçlü İyilik Platformu",
            "Evokulu Derneği", "e-gönüllü", "Azerbaycan Gençler Fondu", "Türkiye Patent Hareketi"
        ]
    };

    const universityLogos = [
        "https://logo.clearbit.com/itu.edu.tr",
        "https://logo.clearbit.com/boun.edu.tr",
        "https://logo.clearbit.com/odtu.edu.tr",
        "https://logo.clearbit.com/gsu.edu.tr",
        "https://logo.clearbit.com/mersin.edu.tr",
        "https://logo.clearbit.com/maltepe.edu.tr",
        "https://logo.clearbit.com/istanbul.edu.tr"
    ];

    const handleInstitutionClick = (item: string) => {
        toast({
            title: item,
            description: "Kurumsal iş birliği detayları ve geçmiş etkinlik raporları yükleniyor.",
        });
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="events" />

            <section className="pt-32 pb-20 px-6 text-center space-y-4 bg-[#f5f5f7]">
                <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-[#1d1d1f]">Kurumsal Ağımız.</h1>
                <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                    Türkiye'nin dört bir yanında 42 üniversite, 17 belediye ve onlarca kamu kuruluşuyla sosyal etkiyi örgütlüyoruz.
                </p>
            </section>

            <div className="container mx-auto max-w-6xl py-20 px-6 space-y-12">
                <InstitutionList 
                    icon={GraduationCap}
                    title="Üniversiteler" 
                    count={42} 
                    items={networkData.universities} 
                    logos={universityLogos}
                    onDetailClick={handleInstitutionClick}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <InstitutionList 
                        icon={Building2}
                        title="Ticaret Odaları" 
                        count={12} 
                        items={networkData.chambers} 
                        onDetailClick={handleInstitutionClick}
                    />
                    <InstitutionList 
                        icon={Landmark}
                        title="Belediyeler" 
                        count={17} 
                        items={networkData.municipalities} 
                        onDetailClick={handleInstitutionClick}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <InstitutionList 
                        icon={School}
                        title="Okullar" 
                        count={20} 
                        items={networkData.schools} 
                        onDetailClick={handleInstitutionClick}
                    />
                    <InstitutionList 
                        icon={Globe}
                        title="Networkler" 
                        count={22} 
                        items={networkData.ngos} 
                        onDetailClick={handleInstitutionClick}
                    />
                </div>
            </div>

            {/* SivilFest Section */}
            <section className="py-32 px-6 bg-black text-white overflow-hidden">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
                        <div className="space-y-8">
                            <Badge className="bg-primary text-white border-none">Öne Çıkan Etkinlik</Badge>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">SivilFest Karşıyaka.</h2>
                            <p className="text-xl text-white/70 leading-relaxed font-medium">
                                Sivil toplumun gücünü yerel yönetimlerle birleştirdiğimiz, binlerce vatandaşın sosyal fayda projeleriyle buluştuğu Türkiye'nin en kapsamlı sivil festivallerinden biri.
                            </p>
                            <Button size="lg" className="rounded-full px-10 h-14 font-bold bg-white text-black hover:bg-white/90" onClick={() => toast({ title: "SivilFest", description: "Festival programı ve katılım rehberi yükleniyor." })}>Festivali Keşfet</Button>
                        </div>
                        <div className="relative aspect-square rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl">
                            <Image src="https://images.unsplash.com/photo-1540575861501-7ad0582371f3?q=80&w=2070&auto=format&fit=crop" alt="Festival" fill className="object-cover" />
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="Dernek Etkinlikleri" />
        </div>
    );
}
