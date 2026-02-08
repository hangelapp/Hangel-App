'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Heart, Truck, Home, Newspaper, ExternalLink, School, Building2, Landmark, GraduationCap, Globe, Zap, MessageSquare } from 'lucide-react';
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
    <div className="text-left space-y-2 mb-12 px-6">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">{title}</h2>
        {subtitle && <p className="text-lg text-muted-foreground font-medium max-w-2xl">{subtitle}</p>}
    </div>
);

const EventLineup = ({ title, date, location, image, hint, description, category, icon: Icon }: any) => (
    <div className="group relative w-full border-b border-black/5 py-16 flex flex-col md:flex-row items-center gap-12 px-6 hover:bg-[#f5f5f7]/50 transition-colors">
        <div className="relative w-full md:w-96 aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl shrink-0">
            <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" data-ai-hint={hint} />
        </div>
        <div className="flex-1 text-left space-y-4">
            <div className="flex items-center gap-3">
                <Badge className="bg-primary/5 text-primary border-primary/10">{category}</Badge>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1d1d1f]/40 flex items-center gap-1"><Calendar className="h-3 w-3" /> {date}</span>
            </div>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-6 w-6 text-primary" />}
                <h3 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">{title}</h3>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-medium">{description}</p>
            <div className="flex items-center gap-4 pt-2">
                <span className="text-[11px] font-bold text-[#1d1d1f]/60 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {location}</span>
            </div>
        </div>
        <Button variant="outline" className="rounded-full px-8 h-12 font-bold border-black/10 hover:bg-white self-start md:self-center">İncele</Button>
    </div>
);

const InstitutionList = ({ title, count, items, icon: Icon }: { title: string, count: number, items: string[], icon: any }) => (
    <div className="space-y-8 bg-white p-8 rounded-[3rem] border border-black/5 shadow-sm hover:shadow-xl transition-all">
        <div className="flex items-end justify-between border-b border-black/5 pb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f5f5f7] rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">{title}</h3>
            </div>
            <span className="text-3xl font-black tracking-tighter text-primary/30">{count}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2">
            {items.map((item, i) => (
                <p key={i} className="text-[13px] font-medium text-[#1d1d1f]/70 leading-relaxed border-l-2 border-transparent hover:border-primary/20 hover:pl-2 transition-all">
                    {item}
                </p>
            ))}
        </div>
    </div>
);

export default function AssociationEventsPage() {
    const pressLinks = [
        { source: "AA", title: "Türkiye'nin Sosyal Girişimcilik Etki Haritası Çıkartılacak", url: "https://www.aa.com.tr/tr/turkiye/turkiyenin-sosyal-girisimcilik-etki-haritasi-cikartilacak/1526753" },
        { source: "TRT Haber", title: "Sosyal Girişimcilik Etki Haritası Çıkarılacak", url: "https://www.trthaber.com/haber/turkiye/turkiyenin-sosyal-girisimcilik-etki-haritasi-cikarilacak-422386.html" },
        { source: "Hürriyet", title: "Rekabetin Yeni Adı: Sosyal Fayda", url: "https://www.hurriyet.com.tr/yazarlar/sibel-bagci-uzun/rekabetin-yeni-adi-sosyal-fayda-41862206" },
        { source: "Milliyet", title: "Gençler Sektörün Zirvesindekilerle Buluştu", url: "https://www.milliyet.com.tr/yerel-haberler/manisa/gencler-sektorun-zirvesindekilerle-bulustu-13207259" },
        { source: "Akşam", title: "Uluslararası Çalıştay İstanbul'da Toplandı", url: "https://www.aksam.com.tr/guncel/uluslararasi-sosyal-girisimcilik-calistayi-istanbulda-toplandi/haber-1006693" },
        { source: "Platin", title: "Sosyal Girişimcilik Zirvesi Düzce Etabı", url: "https://www.platinonline.com/girisimcilik/uluslararasi-sosyal-girisimcilik-zirvesi-ilk-kez-duzcede-1012108" }
    ];

    const networkData = {
        universities: [
            "Sakarya Üniversitesi", "Mersin Üniversitesi", "Hakkari Üniversitesi 1", "Hakkari Üniversitesi 2", "İstanbul Üniversitesi",
            "Yıldız Teknik Üniversitesi", "Düzce Üniversitesi", "Bursa Teknik Üniversitesi", "Erzurum Atatürk Üniversitesi",
            "Akdeniz Üniversitesi", "Manisa Celal Bayar Üniversitesi", "İstanbul Medeniyet Üniversitesi", "İstanbul Medipol Üniversitesi",
            "İstanbul Gelişim Üniversitesi", "Çanakkale Üniversitesi", "İstanbul Kent Üniversitesi", "Maltepe Üniversitesi",
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

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="events" />

            <section className="pt-32 pb-20 px-6 text-center space-y-4 bg-[#f5f5f7]">
                <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-[#1d1d1f]">Saha & Etki.</h1>
                <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                    5 yılda 126 farkındalık etkinliği ile 15.621 kişiye doğrudan dokunduk. Türkiye'den dünyaya yayılan bir dayanışma modeli inşa ettik.
                </p>
            </section>

            {/* Categorized Projects: Afet Müdahalesi */}
            <div className="container mx-auto max-w-6xl py-20">
                <SectionHeader 
                    title="Afet ve Acil Durum" 
                    subtitle="SBG, en savunmasız anlarda toplumsal dayanışmanın liderliğini üstlenerek 4000 gönüllü ile sahadaydı." 
                />
                <div className="space-y-0">
                    <EventLineup 
                        category="AFET DAYANIŞMASI"
                        title="Hatay Antakya Örnek Köy Projesi"
                        date="2023 - 2024"
                        location="Antakya, Hatay"
                        icon={Home}
                        description="4000 gönüllü ve 2000 işletme desteğiyle; 10 tiny house, 1 kreş, 1 atölye ve 1 kütüphaneden oluşan sürdürülebilir yaşam alanını Hatay'da kurduk."
                        image="https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop"
                        hint="charity village concept"
                    />
                    <EventLineup 
                        category="LOJİSTİK DESTEK"
                        title="Afet Dönemi Yakıt & İlaç Köprüsü"
                        date="2023"
                        location="Gaziantep, Hatay, Suriye"
                        icon={Truck}
                        description="Shell Türkiye desteğiyle 120 ton yakıt krizine müdahale ettik. 70 tonu Ahbap ile paylaşılan yakıtın yanı sıra Romanya partnerimizle 2 TIR ilaç sevkiyatı gerçekleştirdik."
                        image="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop"
                        hint="truck delivery logistics"
                    />
                </div>
            </div>

            {/* Categorized Projects: Akademik & Farkındalık */}
            <div className="bg-[#f5f5f7] py-20 border-y border-black/5">
                <div className="container mx-auto max-w-6xl">
                    <SectionHeader 
                        title="Akademik Zirveler" 
                        subtitle="Yeni nesil sosyal girişimcilik modelini 42 üniversite kampüsünde ve uluslararası kürsülerde anlattık." 
                    />
                    <EventLineup 
                        category="VİZYON BULUŞMALARI"
                        title="Güçlü İyilik: Sosyal Girişim Zirvesi"
                        date="Dönemsel"
                        location="42 Üniversite Kampüsü"
                        icon={GraduationCap}
                        description="Atatürk, Hakkari ve Pamukkale Üniversiteleri başta olmak üzere Anadolu'nun her köşesinde gençlerimizle sosyal inovasyonu ve yeni nesil dayanışmayı konuştuk."
                        image="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop"
                        hint="university students seminar"
                    />
                </div>
            </div>

            {/* Comprehensive Network Section */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-6 max-w-6xl space-y-24">
                    <SectionHeader 
                        title="İyiliği Paylaşıyoruz." 
                        subtitle="Eğitim, konferans ve farkındalık çalışmaları yürüttüğümüz geniş kurumsal ağımız." 
                    />

                    <div className="grid grid-cols-1 gap-12">
                        <InstitutionList 
                            icon={GraduationCap}
                            title="Üniversiteler" 
                            count={42} 
                            items={networkData.universities} 
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <InstitutionList 
                                icon={Building2}
                                title="Ticaret Odaları ve Ajanslar" 
                                count={12} 
                                items={networkData.chambers} 
                            />
                            <InstitutionList 
                                icon={Landmark}
                                title="Valilikler ve Belediyeler" 
                                count={17} 
                                items={networkData.municipalities} 
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <InstitutionList 
                                icon={School}
                                title="İlköğretim ve Liseler" 
                                count={20} 
                                items={networkData.schools} 
                            />
                            <InstitutionList 
                                icon={Globe}
                                title="STK ve Uluslararası Networkler" 
                                count={22} 
                                items={networkData.ngos} 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Press Section */}
            <section id="haberler" className="py-32 bg-[#f5f5f7] border-t border-black/5">
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
                                className="group flex items-center justify-between p-6 bg-white rounded-2xl hover:shadow-xl transition-all border border-black/5"
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

            {/* Community Power Footer */}
            <section className="bg-black text-white py-32 text-center">
                <div className="container mx-auto px-6 max-w-4xl space-y-8">
                    <Heart className="h-16 w-16 text-primary mx-auto" />
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Dayanışmanın Lideriyiz.</h2>
                    <p className="text-xl md:text-2xl text-white/70 leading-relaxed font-medium italic">
                        "Bir toplumun gücü, en savunmasız anlarda gösterdiği dayanışma ile ölçülür."
                    </p>
                    <div className="pt-8">
                        <Button asChild size="lg" className="rounded-full px-12 h-14 font-bold bg-primary hover:bg-primary/90 text-lg shadow-2xl shadow-primary/20">
                            <Link href="/login/selection?action=register">Hemen Katıl</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="Dernek Etkinlikleri" />
        </div>
    );
}
