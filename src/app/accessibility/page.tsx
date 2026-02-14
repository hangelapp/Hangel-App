
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, 
    Eye, 
    Ear, 
    MousePointer2, 
    Brain, 
    Move, 
    ShieldCheck, 
    Globe, 
    Scale, 
    UserCheck,
    CheckCircle2,
    Clock,
    Zap,
    Info,
    ChevronRight,
    Type,
    Layers,
    AlertTriangle,
    Target
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const FeatureCard = ({ icon: Icon, title, description, badge }: { icon: any, title: string, description: string, badge?: string }) => (
    <Card className="bg-white rounded-[2rem] p-8 border border-black/5 shadow-sm hover:shadow-xl transition-all duration-500 group h-full">
        <div className="flex flex-col h-full">
            <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <Icon className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                    {badge && <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">{badge}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
            </div>
        </div>
    </Card>
);

const wcagCriteria = [
    { feature: "Yüksek Kontrast", wcag: "1.4.3 Contrast (Min)", level: "AA", status: "Sağlanıyor", desc: "Metin–arka plan kontrastı kullanıcı tarafından artırılabiliyor" },
    { feature: "Yazı Tipi Boyutu", wcag: "1.4.4 Resize Text", level: "AA", status: "Sağlanıyor", desc: "Metin ölçekleme arayüz bozulmadan destekleniyor" },
    { feature: "Satır Aralığı", wcag: "1.4.12 Text Spacing", level: "AA", status: "Sağlanıyor", desc: "Satır ve paragraf aralığı ayarlanabiliyor" },
    { feature: "Renk Körlüğü Filtresi", wcag: "1.4.1 Use of Color", level: "A", status: "Sağlanıyor", desc: "Bilgi yalnızca renkle aktarılmıyor" },
    { feature: "Disleksi Dostu Yazı Tipi", wcag: "1.4.8 Visual Presentation", level: "AAA (destekleyici)", status: "Sağlanıyor", desc: "Okunabilirliği artıran alternatif yazı tipi" },
    { feature: "Animasyonları Azalt", wcag: "2.3.3 Animation", level: "AAA (destekleyici)", status: "Sağlanıyor", desc: "Hareket hassasiyeti olan kullanıcılar için" },
    { feature: "Büyük Dokunma Alanları", wcag: "2.5.5 Target Size", level: "AA", status: "Sağlanıyor", desc: "Dokunma hedefleri minimum boyutun üzerine çıkarılabiliyor" },
    { feature: "Uzun Basma Süresi", wcag: "2.1.1 Key/Pointer Control", level: "A", status: "Kısmen", desc: "Yanlış tetikleme azaltılıyor" },
    { feature: "Basitleştirilmiş Dil", wcag: "3.1.5 Reading Level", level: "AAA (destekleyici)", status: "Kısmen", desc: "Arayüz dili sade, içerik için rehber gerekli" },
    { feature: "Sade Mod (Odak Modu)", wcag: "2.2.2 Pause, Stop, Hide", level: "A", status: "Sağlanıyor", desc: "Dikkat dağıtıcı öğeler kullanıcı kontrolünde" },
    { feature: "ARIA ve Anonslar", wcag: "4.1.2 Name, Role, Value", level: "A", status: "Sağlanıyor", desc: "Semantik yapı ve ARIA etiketleri mevcut" },
    { feature: "Sesli Geri Bildirim", wcag: "1.1.1 Non-text Content", level: "A", status: "Sağlanıyor", desc: "Metinsel uyarılar sesli geri bildirimle destekleniyor" },
    { feature: "Zaman Sınırlarını Kapat", wcag: "2.2.1 Timing Adjustable", level: "A", status: "Sağlanıyor", desc: "Süre kısıtları kullanıcı tarafından kontrol ediliyor" },
    { feature: "İşlem Onayları", wcag: "3.3.4 Error Prevention", level: "AA", status: "Sağlanıyor", desc: "Kritik işlemler için ek onay adımı var" },
];

const complianceRates = [
    { standard: "European Accessibility Act (EAA)", region: "Avrupa Birliği", scope: "Dijital ürün ve hizmetlerde erişilebilirlik yükümlülükleri", rate: "75–80", desc: "Ürün mimarisi ve kullanıcı deneyimi EAA’ya uyumlu olacak şekilde tasarlanmıştır. Resmî uygunluk beyanı için sürekli izleme gereklidir." },
    { standard: "EN 301 549", region: "Avrupa", scope: "Kamuya açık dijital ürünler için teknik erişilebilirlik", rate: "80–85", desc: "WCAG tabanlı kriterlerin büyük bölümü sağlanmakta, bazı kamuya özgü dokümantasyon gereklilikleri kapsam dışındadır." },
    { standard: "ISO 9241-171", region: "Uluslararası", scope: "İnsan–bilgisayar etkileşimi ve kullanılabilirlik", rate: "70–75", desc: "Kullanılabilirlik ilkeleri uygulanmaktadır; kullanıcı testlerinin sürekliliğiyle artırılabilir." },
    { standard: "WAI-ARIA Authoring Practices", region: "Uluslararası", scope: "Ekran okuyucu ve semantik yapı uygulamaları", rate: "85–90", desc: "ARIA etiketleri ve semantik yapı büyük ölçüde uygulanmaktadır." },
    { standard: "Türkiye Erişilebilirlik Mevzuatı", region: "Türkiye", scope: "Ulusal erişilebilirlik çerçevesi", rate: "65–70", desc: "Doğrudan sertifikasyon yoktur, ancak mevzuat ilkeleri referans alınmıştır." },
    { standard: "Kamu Dijital Hizmet Rehberleri", region: "Türkiye", scope: "Kamu dijital servis beklentileri", rate: "60–65", desc: "Kamuya özel format ve raporlama gereksinimleri kapsam dışıdır." },
];

export default function AccessibilityPublicPage() {
    const router = useRouter();
    const heroImage = PlaceHolderImages.find(img => img.id === 'accessibility-hero');

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Navigation */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">Erişilebilirlik Beyanı</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Link href="/settings/accessibility">Ayarları Yapılandır</Link>
                    </Button>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-24 px-6 text-center bg-[#f5f5f7] overflow-hidden border-b border-black/5">
                    <div className="container mx-auto max-w-4xl space-y-6 relative z-10 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] leading-[0.95]">
                            Herkes İçin <br /> Tasarlandı.
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-tight">
                            İyilikte engel tanımaz. Hangel, teknolojinin birleştirici gücünü herkes için erişilebilir kılma vizyonuyla geliştirilmiştir.
                        </p>
                    </div>
                    <div className="relative w-full max-w-6xl mx-auto aspect-[21/9] mt-16 rounded-t-[3rem] overflow-hidden shadow-2xl">
                        <Image 
                            src={heroImage?.imageUrl || "https://images.unsplash.com/photo-1534643900521-643015c44185?q=80&w=2070&auto=format&fit=crop"} 
                            alt="Inclusive Design" 
                            fill 
                            className="object-cover"
                            data-ai-hint={heroImage?.imageHint || "empowered disabled"}
                        />
                    </div>
                </section>

                {/* Hangi Engel Gruplarını Gözetiyoruz */}
                <section className="py-32 px-6">
                    <div className="container mx-auto max-w-6xl space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Hangi Engel Gruplarını Gözetiyoruz?</h2>
                            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Platformumuz, farklı ihtiyaçlara sahip kullanıcılarımızın deneyimini en üst seviyeye çıkarmak için optimize edilmiştir.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FeatureCard 
                                icon={Eye} 
                                title="Görme Engelliler" 
                                description="Tam görme kaybı veya az görme durumunda; ekran okuyucu (ARIA) uyumluluğu ve yüksek kontrastlı arayüz desteği sunuyoruz." 
                            />
                            <FeatureCard 
                                icon={Zap} 
                                title="Renk Körlüğü" 
                                description="Protanopia, Deuteranopia ve Tritanopia filtreleriyle tüm bilgilerin renkten bağımsız olarak algılanmasını sağlıyoruz." 
                            />
                            <FeatureCard 
                                icon={Type} 
                                title="Disleksi" 
                                description="Okuma güçlüğü çeken kullanıcılar için OpenDyslexic yazı tipi, satır aralığı ve metin hizalama ayarları mevcuttur." 
                            />
                            <FeatureCard 
                                icon={Brain} 
                                title="Bilişsel Zorluklar" 
                                description="DEHB veya anksiyete durumları için dikkat dağıtıcıları gizleyen 'Sade Mod' ve basitleştirilmiş dil seçenekleri tasarladık." 
                            />
                            <FeatureCard 
                                icon={MousePointer2} 
                                title="Motor Beceriler" 
                                description="Titreme veya sınırlı hareket durumunda; büyük dokunma alanları ve ayarlanabilir basma süreleri ile kontrolü kolaylaştırıyoruz." 
                            />
                            <FeatureCard 
                                icon={Move} 
                                title="Vestibüler Hassasiyet" 
                                description="Hareket ve animasyon duyarlılığı olanlar için sistem genelinde geçiş efektlerini azaltma seçeneği sunuyoruz." 
                            />
                            <FeatureCard 
                                icon={Ear} 
                                title="İşitme Engelliler" 
                                description="İşitsel uyarılar yerine görsel parlamalar ve titreşimli geri bildirim alternatifleri ile etkileşimi destekliyoruz." 
                            />
                            <FeatureCard 
                                icon={Clock} 
                                title="Geçici Engeller" 
                                description="Yorgunluk, parlak ışık veya geçici sakatlık durumlarında; tek elle kullanım ve yüksek okunabilirlik standartları sağlıyoruz." 
                            />
                        </div>
                    </div>
                </section>

                {/* Uyum Sağlanan Standartlar */}
                <section className="py-32 px-6 bg-black text-white overflow-hidden text-center">
                    <div className="container mx-auto max-w-6xl space-y-24">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-7xl font-black tracking-tighter">Uluslararası Standartlar.</h2>
                            <p className="text-xl text-white/60 font-medium leading-relaxed max-w-2xl mx-auto">
                                Hangel, küresel erişilebilirlik standartlarını bir "check-list" olarak değil, bir tasarım felsefesi olarak benimser.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="p-3 bg-white/10 rounded-xl text-primary w-fit mx-auto"><ShieldCheck className="h-6 w-6" /></div>
                                <h4 className="text-lg font-bold">WCAG 2.2 AA</h4>
                                <p className="text-sm text-white/50">Esas aldığımız temel standart. Web içeriği erişilebilirliğinde en yüksek kurumsal uyumu hedefler.</p>
                            </div>
                            <div className="space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="p-3 bg-white/10 rounded-xl text-primary w-fit mx-auto"><Layers className="h-6 w-6" /></div>
                                <h4 className="text-lg font-bold">WCAG 2.2 AAA</h4>
                                <p className="text-sm text-white/50">İleri seviye kullanıcı kontrolü sağlayan, isteğe bağlı aktive edilebilen üst düzey kriterler.</p>
                            </div>
                            <div className="space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="p-3 bg-white/10 rounded-xl text-primary w-fit mx-auto"><Globe className="h-6 w-6" /></div>
                                <h4 className="text-lg font-bold">EN 301 549 & ISO/IEC</h4>
                                <p className="text-sm text-white/50">Avrupa ve uluslararası dijital erişilebilirlik gereksinimleriyle uyumlu teknik mimari.</p>
                            </div>
                        </div>

                        {/* Ulusal & Uluslararası Standartlar Uyum Tablosu */}
                        <div className="space-y-12 text-left mt-16 pt-16 border-t border-white/10">
                            <div className="text-center space-y-4">
                                <h3 className="text-2xl md:text-4xl font-bold tracking-tight">Ulusal & Uluslararası Standartlar</h3>
                                <p className="text-white/40 uppercase tracking-widest text-xs font-black">UYUM ORANI VE TEKNİK ANALİZ TABLOSU</p>
                            </div>
                            <Card className="overflow-hidden border-none shadow-2xl rounded-[2rem] bg-white/5 text-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-white/10 border-none hover:bg-white/10">
                                            <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-white/60">Standart / Politika</TableHead>
                                            <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-white/60">Bölge</TableHead>
                                            <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-white/60">Hangel Uyum Oranı</TableHead>
                                            <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-white/60">Açıklama</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {complianceRates.map((item, i) => (
                                            <TableRow key={i} className="hover:bg-white/5 border-white/10">
                                                <TableCell className="py-6 px-8">
                                                    <p className="font-bold text-base">{item.standard}</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{item.scope}</p>
                                                </TableCell>
                                                <TableCell className="py-6 px-8 text-sm font-medium text-white/60">{item.region}</TableCell>
                                                <TableCell className="py-6 px-8">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl font-black text-primary tracking-tighter">%{item.rate}</span>
                                                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="bg-primary h-full rounded-full" style={{ width: `${item.rate.split('–')[1] || item.rate}%` }} />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-8 text-xs leading-relaxed text-white/50 font-medium max-w-xs">{item.desc}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>

                        {/* Neden %100 Erişilebilirlik Değil? Section */}
                        <div className="max-w-4xl mx-auto space-y-12 text-left pt-16">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white mb-4 border border-white/5">
                                <Target className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Gerçekçi Yaklaşım</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">Neden %100 <br /> Erişilebilirlik Değil?</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <p className="text-lg text-white/70 leading-relaxed font-medium">
                                        Dijital erişilebilirlik, tek seferde tamamlanan bir durum değil; sürekli geliştirilen bir standarttır. Hangel, web ve mobil erişilebilirlikte <strong>WCAG 2.2 AA</strong> seviyesini temel alır.
                                    </p>
                                    <p className="text-lg text-white/70 leading-relaxed font-medium">
                                        WCAG 2.2 AAA kapsamında yer alan bazı ileri seviye kriterler ise, tüm kullanıcılar için aynı anda geçerli olmayabileceğinden isteğe bağlı ve kişiselleştirilebilir ayarlar olarak sunulur.
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    <p className="text-lg text-white/70 leading-relaxed font-medium">
                                        Uluslararası standartlar dahi, özellikle AAA seviyesinde %100 uyumu zorunlu bir hedef olarak tanımlamaz. Farklı engel gruplarının ihtiyaçları zaman zaman birbirleriyle çelişebilir.
                                    </p>
                                    <p className="text-lg text-white/70 leading-relaxed font-medium">
                                        Hangel, %100 gibi mutlak iddialar yerine; <strong>gerçekçi, ölçülebilir ve sürdürülebilir</strong> bir erişilebilirlik yaklaşımını düzenli iyileştirme taahhüdüyle sunar.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-white text-black rounded-[2.5rem] mt-8 text-center space-y-4 shadow-2xl">
                                <p className="text-2xl font-black tracking-tight">Amacımız, erişilebilirliği bir vaat değil, kalıcı bir standart haline getirmektir.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Uyumluluk Standartları Tablosu (Existing) */}
                <section className="py-32 px-6 bg-white border-b border-black/5">
                    <div className="container mx-auto max-w-6xl space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Kriter Detayları.</h2>
                            <p className="text-xl text-muted-foreground uppercase tracking-widest font-black">WCAG 2.2 AA – KRİTER EŞLEŞTİRME VE HANGEL UYUM TABLOSU</p>
                        </div>
                        
                        <Card className="overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-[#f5f5f7] border-none">
                                        <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Ayar / Özellik</TableHead>
                                        <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">WCAG Kriteri</TableHead>
                                        <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Hangel Durumu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wcagCriteria.map((item, i) => (
                                        <TableRow key={i} className="hover:bg-muted/30 transition-colors border-border/50">
                                            <TableCell className="py-6 px-8 font-bold text-lg text-[#1d1d1f]">{item.feature}</TableCell>
                                            <TableCell className="py-6 px-8">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-sm text-foreground">{item.wcag}</p>
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest h-5 px-2 border-none bg-muted">{item.level}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 px-8">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        {item.status === 'Sağlanıyor' ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                                        )}
                                                        <span className={cn(
                                                            "font-black text-[10px] uppercase tracking-widest",
                                                            item.status === 'Sağlanıyor' ? "text-green-700" : "text-amber-700"
                                                        )}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </section>

                {/* Yasal ve Politik Çerçeve */}
                <section className="py-32 px-6 border-b border-black/5 bg-[#f5f5f7]">
                    <div className="container mx-auto max-w-4xl text-center space-y-12">
                        <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto"><Scale className="h-8 w-8 text-primary" /></div>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Yasal ve Politik Çerçeve.</h2>
                        <div className="text-left space-y-8 bg-white p-10 md:p-16 rounded-[3rem] border border-black/5 shadow-xl">
                            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                                Hangel, <strong>Avrupa Erişilebilirlik Yasası (European Accessibility Act – EAA)</strong> ve AB dijital hizmetler direktifleriyle uyumlu olacak şekilde tasarlanmıştır. Bu uyum, sadece bir yasal zorunluluk değil, sivil toplumun dijitalleşmesinde herkesin eşit haklara sahip olduğu inancımızın bir parçasıdır.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                                Türkiye’deki erişilebilirlik yaklaşımlarını yakından takip ediyor ve platformumuzu yerel beklentilerle evrensel standartların kesişiminde sürekli olarak güncelliyoruz. İyileştirme süreçlerimizi düzenli denetimler ve bağımsız testlerle destekliyoruz.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Erişilebilirlik Yaklaşımımız (Prensipler) */}
                <section className="py-32 px-6 bg-white">
                    <div className="container mx-auto max-w-6xl space-y-20">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Erişilebilirlik Yaklaşımımız.</h2>
                            <p className="text-xl text-muted-foreground">Prensiplerimiz, kapsayıcı bir toplum inşa etme vizyonuumuzun temelidir.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold flex items-center gap-3"><CheckCircle2 className="text-primary" /> Bir Özellik Değil, Standarttır.</h3>
                                <p className="text-muted-foreground font-medium leading-relaxed">Erişilebilirlik, platformun üzerine sonradan eklenen bir modül değil; tasarımın en başından itibaren her bileşene entegre edilmiş bir kalite standardıdır.</p>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold flex items-center gap-3"><UserCheck className="text-primary" /> Kullanıcıya Kontrol Verme.</h3>
                                <p className="text-muted-foreground font-medium leading-relaxed">Tek bir kullanıcı profiline göre tasarım yapmak yerine, her bireyin kendi ihtiyaçlarına göre özelleştirebileceği gelişmiş erişilebilirlik ayarları sunuyoruz.</p>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold flex items-center gap-3"><Zap className="text-primary" /> Varsayılan Sadelik.</h3>
                                <p className="text-muted-foreground font-medium leading-relaxed">Uygulamamız varsayılan olarak sade ve net bir yapıdadır. İhtiyaç duyulduğunda aktive edilen gelişmiş özellikler (AAA kriterleri), bu sadeliği bozmadan etkiyi artırır.</p>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold flex items-center gap-3"><Info className="text-primary" /> Şeffaf ve Süreklilik.</h3>
                                <p className="text-muted-foreground font-medium leading-relaxed">Erişilebilirlik uyumluluğumuzu düzenli olarak değerlendiriyor, kullanıcının geri bildirimlerini teknik yol haritamızın en başına koyuyoruz.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 px-6 text-center bg-[#f5f5f7]">
                    <div className="container mx-auto max-w-3xl space-y-10">
                        <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-6" />
                        <h2 className="text-4xl font-black tracking-tighter">Sürekli İyileştirme Taahhüdü.</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                            Hangel olarak erişilebilirliği bitmiş bir süreç değil, sürekli bir gelişim yolculuğu olarak görüyoruz. Teknik ve içerik ekiplerimiz, en yüksek erişilebilirlik farkındalığıyla platformu her gün daha kapsayıcı hale getirmek için çalışmaktadır.
                        </p>
                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button asChild size="lg" className="rounded-full px-12 h-14 font-bold shadow-xl shadow-primary/20 text-lg">
                                <Link href="/feedback">Geri Bildirim Ver</Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="rounded-full px-12 h-14 font-bold border border-black/10 hover:bg-white text-lg">
                                <Link href="/support">Destek Al</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter currentPageLabel="Erişilebilirlik" />
        </div>
    );
}
