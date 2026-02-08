'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Heart, Truck, Home, Newspaper, ExternalLink, School, Building2, Landmark, GraduationCap, Globe } from 'lucide-react';
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

const EventLineup = ({ title, date, location, image, hint, description, category, icon: Icon }: any) => (
    <div className="group relative w-full border-b border-black/5 py-16 flex flex-col md:flex-row items-center gap-12 px-6 hover:bg-[#f5f5f7]/50 transition-colors">
        <div className="relative w-full md:w-96 aspect-video rounded-[2rem] overflow-hidden shadow-2xl shrink-0">
            <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" data-ai-hint={hint} />
        </div>
        <div className="flex-1 text-left space-y-4">
            <div className="flex items-center gap-3">
                <Badge className="bg-primary/5 text-primary border-primary/10 font-bold uppercase text-[9px] tracking-widest px-3 py-1 rounded-full">{category}</Badge>
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
        <Button variant="outline" className="rounded-full px-8 h-12 font-bold border-black/10 hover:bg-white self-start md:self-center">Detayları Gör</Button>
    </div>
);

const Badge = ({ children, className }: any) => (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", className)}>
        {children}
    </span>
);

const InstitutionList = ({ title, count, items, icon: Icon }: { title: string, count: number, items: string[], icon: any }) => (
    <div className="space-y-8">
        <div className="flex items-end justify-between border-b border-black/5 pb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f5f5f7] rounded-lg">
                    <Icon className="h-5 w-5 text-[#1d1d1f]/60" />
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
            "Yıldız Teknik Üniversitesi", "Düzce Üniversitesi", "Bursa Teknik Üniversitesi", "Sakarya Üniversitesi", "Erzurum Atatürk Üniversitesi",
            "Akdeniz Üniversitesi", "Manisa Celal Bayar Üniversitesi", "İstanbul Medeniyet Üniversitesi", "İstanbul Medipol Üniversitesi",
            "Celal Bayar Üniversitesi", "Sakarya Üniversitesi", "İstanbul Gelişim Üniversitesi", "Çanakkale Üniversitesi", "İstanbul Kent Üniversitesi",
            "Maltepe Üniversitesi", "Tekirdağ Namık Kemal Üniversitesi", "Karamanoğlu Mehmetbey Üniversitesi", "İstanbul Şehir Üniversitesi",
            "Pamukkale Üniversitesi İlahiyat Fakültesi", "Pamukkale Üniversitesi Eğitim Fakültesi", "Mustafa Kemal Üniversitesi Merkez Kampüs",
            "Mustafa Kemal Üniversitesi Yayladağ Meslek Yüksekokulu", "Mustafa Kemal Üniversitesi Reyhanlı Meslek Yüksekokulu", "İzmir Ekonomi Üniversitesi",
            "Süleyman Demirel Üniversitesi Merkez Kampüs", "Süleyman Demirel Üniversitesi Eğirdir Meslek Yüksekokulu", "Sabahattin Zaim Üniversitesi Halkalı Kampüsü",
            "Sabahattin Zaim Üniversitesi Altunizade Kampüsü", "İstanbul Atlas Üniversitesi", "Kars Kafkas Üniversitesi", "Tunceli Munzur Üniversitesi",
            "Bandırma 17 Eylül Üniversitesi", "Ankara Medipol Üniversitesi", "Ankara Üniversitesi", "Kayseri Erciyes Üniversitesi",
            "Polonya Uluslararası Bilim ve Teknoloji Üniversitesi", "Yeditepe Üniversitesi", "Hacı Bayram Veli Üniversitesi"
        ],
        chambers: [
            "Tekirdağ Ticaret ve Sanayi Odası", "Ağrı Ticaret ve Sanayi Odası", "Karaman Ticaret ve Sanayi Odası", "Erdemli Ticaret ve Sanayi Odası",
            "Düzce Ticaret ve Sanayi Odası", "Antalya Ticaret ve Sanayi Odası", "Mersin Ticaret ve Sanayi Odası",
            "Azerbaycan Küçük ve Orta Ölçekli İşletmeleri Geliştirme Ajansı (KOBİA)", "Bursa Eskişehir Kalkınma Ajansı (BEBKA)",
            "İzmir Bornova Gençlik ve Spor Bakanlığı Gençlik Merkezi", "GAP İdaresi", "Etimesgut Kent Konseyi", "Ankara Kent Konseyi"
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
            "Şemdinli Anadolu Lisesi", "Şemdinli İmam Hatip Lisesi", "Antalya Manavgat Namuk Kamancı Fen Lisesi 1", "Antalya Manavgat Namuk Kamancı Fen Lisesi 2",
            "Antalya Manavgat Meslek Lisesi", "Manavgat Evliya Çelebi Teknik Lisesi", "Şule Muzaffer Büyük Meslek Lisesi", "Fethi Yılmaz Sezer Meslek Lisesi",
            "Antalya Manavgat Anadolu Lisesi", "Antalya Manavgat Batı Koleji", "Antalya Manavgat Bilsem"
        ],
        ngos: [
            "Tüzder Üstün Zekalılar Derneği", "Gaziantep JCI Temsilciliği", "Bursa JCI Temsilciliği", "Bursa Simbiyoz Aktivite Derneği",
            "İzmir Pergamon Lions Kulübü", "TÜGVA İzmir Temsilciliği", "AIESEC İstanbul İl Kongresi", "Azerbaycan Enactus Temsilciliği",
            "TÜMMİAD Uluslararası Mucit Girişimcilik Derneği", "Ability Pool", "Herbalife Eskişehir", "Genç Sosyal Hizmet Platformu",
            "Güçlü İyilik Platformu", "Doğa Koleji Beykent Kampüsü", "Evokulu Derneği", "e-gönüllü", "Azerbaycan Gençler Fondu",
            "Karadeniz Vakfı", "Gençlik Otobüsü Derneği", "Türkiye Patent Hareketi", "Gençler İçin Yeşil", "Grofrc9436"
        ]
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="events" />

            <section className="pt-32 pb-20 px-6 text-center space-y-4 bg-[#f5f5f7]">
                <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-[#1d1d1f]">Topluluk Gücü.</h1>
                <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                    5 yılda 126 farkındalık etkinliği ile 15.621 kişiye ulaştık. Türkiye'nin 42 üniversitesinde, ticaret odalarında ve sivil toplum kuruluşlarında vizyon buluşmaları gerçekleştirdik.
                </p>
            </section>

            {/* Showcase Section */}
            <div className="container mx-auto max-w-6xl">
                <EventLineup 
                    category="AFET DAYANIŞMASI"
                    title="Deprem Bölgesi Örnek Köy Projesi"
                    date="2023 - 2024"
                    location="Hatay, Antakya"
                    icon={Home}
                    description="4000 gönüllü ve 2000 işletme desteğiyle; 10 tiny house, 1 kreş, 1 atölye ve 1 kütüphaneden oluşan yaşam alanını Hatay'da kurduk. Haos Design işbirliğiyle hayata geçen bu model, sivil dayanışmanın en somut örneklerinden biridir."
                    image="https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop"
                    hint="charity village concept"
                />
                <EventLineup 
                    category="LOJİSTİK DESTEK"
                    title="Afet Dönemi Yakıt & İlaç Köprüsü"
                    date="2023"
                    location="Gaziantep, Hatay, Suriye"
                    icon={Truck}
                    description="Shell Türkiye desteğiyle 120 ton yakıt krizine müdahale ederek 70 tonu Ahbap ile paylaştık. Romanya partnerimiz vasıtasıyla gelen 2 TIR ilaç, İskenderun Devlet Hastanesi ve TSK koordinasyonuyla Suriye'deki ihtiyaç sahiplerine ulaştırıldı."
                    image="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop"
                    hint="truck delivery logistics"
                />
                <EventLineup 
                    category="AKADEMİK ZİRVE"
                    title="Güçlü İyilik: Sosyal Girişim Zirvesi"
                    date="Dönemsel"
                    location="42 Üniversite Kampüsü"
                    icon={Users}
                    description="Atatürk, Hakkari ve Pamukkale Üniversiteleri başta olmak üzere Anadolu'nun her köşesinde gençlerimizle sosyal inovasyonu konuştuk. 126 farkındalık konferansı ile yeni nesil girişimcilik modelini müfredata taşıdık."
                    image="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop"
                    hint="university students seminar"
                />
            </div>

            {/* Network Section - New Extensive List */}
            <section className="py-32 bg-white border-t border-black/5">
                <div className="container mx-auto px-6 max-w-6xl space-y-24">
                    <div className="text-left space-y-4 max-w-3xl">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">İyiliği Paylaşıyoruz.</h2>
                        <p className="text-xl text-muted-foreground font-medium">Eğitim, konferans ve farkındalık çalışmaları yürüttüğümüz kurumsal ağımız.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-20">
                        <InstitutionList 
                            icon={GraduationCap}
                            title="Üniversiteler" 
                            count={42} 
                            items={networkData.universities} 
                        />
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
            </section>

            {/* Basında Biz Section */}
            <section className="py-32 bg-[#f5f5f7] border-t border-black/5">
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

            <section className="bg-black text-white py-32 text-center">
                <div className="container mx-auto px-6 max-w-4xl space-y-8">
                    <Heart className="h-16 w-16 text-primary mx-auto" />
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Dayanışmanın Lideriyiz.</h2>
                    <p className="text-xl md:text-2xl text-white/70 leading-relaxed font-medium">
                        "Bir toplumun gücü, en savunmasız anlarda gösterdiği dayanışma ile ölçülür." Social Business Global olarak sadece geçmişi raporlamıyor, geleceğin iyilik mirasını birlikte yazıyoruz.
                    </p>
                </div>
            </section>

            <PublicFooter currentPageLabel="Dernek Etkinlikleri" />
        </div>
    );
}
