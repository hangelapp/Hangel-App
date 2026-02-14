
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
    Type,
    Layers,
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
    <Card className="bg-white rounded-[2rem] p-6 md:p-8 border border-black/5 shadow-sm hover:shadow-xl transition-all duration-500 group h-full">
        <div className="flex flex-col h-full">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <Icon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            </div>
            <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight">{title}</h3>
                    {badge && <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">{badge}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
            </div>
        </div>
    </Card>
);

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
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <span className="text-[10px] font-bold tracking-tight uppercase hidden sm:inline">Erişilebilirlik Beyanı</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Link href="/settings/accessibility">Ayarları Yapılandır</Link>
                    </Button>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-6 text-center bg-[#f5f5f7] overflow-hidden border-b border-black/5">
                    <div className="container mx-auto max-w-4xl space-y-6 relative z-10 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                        <h1 className="text-4xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] leading-[0.95]">
                            Herkes İçin <br /> Tasarlandı.
                        </h1>
                        <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-tight">
                            İyilikte engel tanımaz. Hangel, teknolojinin birleştirici gücünü herkes için erişilebilir kılma vizyonuyla geliştirilmiştir.
                        </p>
                    </div>
                    <div className="relative w-full max-w-6xl mx-auto aspect-[16/9] md:aspect-[21/9] mt-12 md:mt-16 rounded-t-[2rem] md:rounded-t-[3rem] overflow-hidden shadow-2xl">
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
                <section className="py-16 md:py-32 px-6">
                    <div className="container mx-auto max-w-6xl space-y-12 md:space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-6xl font-bold tracking-tight">Hangi Engel Gruplarını Gözetiyoruz?</h2>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">Platformumuz, farklı ihtiyaçlara sahip kullanıcılarımızın deneyimini en üst seviyeye çıkarmak için optimize edilmiştir.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                <section className="py-16 md:py-32 px-6 bg-black text-white overflow-hidden text-center">
                    <div className="container mx-auto max-w-6xl space-y-16 md:space-y-24">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-7xl font-black tracking-tighter">Uluslararası Standartlar.</h2>
                            <p className="text-lg md:text-xl text-white/60 font-medium leading-relaxed max-w-2xl mx-auto">
                                Hangel, küresel erişilebilirlik standartlarını bir "check-list" olarak değil, bir tasarım felsefesi olarak benimser.
                            </p>
                        </div>

                        {/* Ulusal & Uluslararası Standartlar Uyum Tablosu */}
                        <div className="space-y-8 md:space-y-12 text-left mt-8 md:mt-16 pt-8 md:pt-16 border-t border-white/10">
                            <Card className="overflow-hidden border-none shadow-2xl rounded-[1.5rem] md:rounded-[2rem] bg-white/5 text-white">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-white/10 border-none hover:bg-white/10">
                                                <TableHead className="py-4 md:py-6 px-4 md:px-8 text-[10px] font-black uppercase tracking-widest text-white/60 whitespace-nowrap">Standart / Politika</TableHead>
                                                <TableHead className="py-4 md:py-6 px-4 md:px-8 text-[10px] font-black uppercase tracking-widest text-white/60 whitespace-nowrap">Bölge</TableHead>
                                                <TableHead className="py-4 md:py-6 px-4 md:px-8 text-[10px] font-black uppercase tracking-widest text-white/60 whitespace-nowrap">Hangel Uyum Oranı</TableHead>
                                                <TableHead className="py-4 md:py-6 px-4 md:px-8 text-[10px] font-black uppercase tracking-widest text-white/60 whitespace-nowrap">Açıklama</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {complianceRates.map((item, i) => (
                                                <TableRow key={i} className="hover:bg-white/5 border-white/10">
                                                    <TableCell className="py-4 md:py-6 px-4 md:px-8">
                                                        <p className="font-bold text-sm md:text-base">{item.standard}</p>
                                                        <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{item.scope}</p>
                                                    </TableCell>
                                                    <TableCell className="py-4 md:py-6 px-4 md:px-8 text-xs md:text-sm font-medium text-white/60 whitespace-nowrap">{item.region}</TableCell>
                                                    <TableCell className="py-4 md:py-6 px-4 md:px-8">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg md:text-xl font-black text-primary tracking-tighter">%{item.rate}</span>
                                                            <div className="w-12 md:w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                                                <div className="bg-primary h-full rounded-full" style={{ width: `${item.rate.split('–')[1] || item.rate}%` }} />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 md:py-6 px-4 md:px-8 text-[11px] md:text-xs leading-relaxed text-white/50 font-medium min-w-[200px] max-w-xs">{item.desc}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>

                        {/* Neden %100 Erişilebilirlik Değil? Section */}
                        <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 text-left pt-12 md:pt-16">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white mb-4 border border-white/5">
                                <Target className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Gerçekçi Yaklaşım</span>
                            </div>
                            <h2 className="text-3xl md:text-6xl font-black tracking-tighter leading-[0.95]">Neden %100 <br /> Erişilebilirlik Değil?</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                <div className="space-y-6">
                                    <p className="text-base md:text-lg text-white/70 leading-relaxed font-medium">
                                        Dijital erişilebilirlik, tek seferde tamamlanan bir durum değil; sürekli geliştirilen bir standarttır. Hangel, web ve mobil erişilebilirlikte <strong>WCAG 2.2 AA</strong> seviyesini temel alır.
                                    </p>
                                    <p className="text-base md:text-lg text-white/70 leading-relaxed font-medium">
                                        WCAG 2.2 AAA kapsamında yer alan bazı ileri seviye kriterler ise, tüm kullanıcılar için aynı anda geçerli olmayabileceğinden isteğe bağlı ve kişiselleştirilebilir ayarlar olarak sunulur.
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    <p className="text-base md:text-lg text-white/70 leading-relaxed font-medium">
                                        Uluslararası standartlar dahi, özellikle AAA seviyesinde %100 uyumu zorunlu bir hedef olarak tanımlamaz. Farklı engel gruplarının ihtiyaçları zaman zaman birbirleriyle çelişebilir.
                                    </p>
                                    <p className="text-base md:text-lg text-white/70 leading-relaxed font-medium">
                                        Hangel, %100 gibi mutlak iddialar yerine; <strong>gerçekçi, ölçülebilir ve sürdürülebilir</strong> bir erişilebilirlik yaklaşımını düzenli iyileştirme taahhüdüyle sunar.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="p-6 md:p-8 bg-white text-black rounded-[1.5rem] md:rounded-[2.5rem] mt-8 text-center space-y-4 shadow-2xl">
                                <p className="text-xl md:text-2xl font-black tracking-tight leading-tight">Amacımız, erişilebilirliği bir vaat değil, kalıcı bir standart haline getirmektir.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Yasal ve Politik Çerçeve */}
                <section className="py-16 md:py-32 px-6 border-b border-black/5 bg-[#f5f5f7]">
                    <div className="container mx-auto max-w-4xl text-center space-y-8 md:space-y-12">
                        <div className="p-3 md:p-4 bg-primary/10 rounded-2xl w-fit mx-auto"><Scale className="h-6 w-6 md:h-8 md:w-8 text-primary" /></div>
                        <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Yasal ve Politik Çerçeve.</h2>
                        <div className="text-left space-y-6 md:space-y-8 bg-white p-6 md:p-16 rounded-[2rem] md:rounded-[3rem] border border-black/5 shadow-xl">
                            <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                                Hangel, <strong>Avrupa Erişilebilirlik Yasası (European Accessibility Act – EAA)</strong> ve AB dijital hizmetler direktifleriyle uyumlu olacak şekilde tasarlanmıştır. Bu uyum, sadece bir yasal zorunluluk değil, sivil toplumun dijitalleşmesinde herkesin eşit haklara sahip olduğu inancımızın bir parçasıdır.
                            </p>
                            <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                                Türkiye’deki erişilebilirlik yaklaşımlarını yakından takip ediyor ve platformumuzu yerel beklentilerle evrensel standartların kesişiminde sürekli olarak güncelliyoruz. İyileştirme süreçlerimizi düzenli denetimler ve bağımsız testlerle destekliyoruz.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Erişilebilirlik Yaklaşımımız (Prensipler) */}
                <section className="py-16 md:py-32 px-6 bg-white">
                    <div className="container mx-auto max-w-6xl space-y-12 md:space-y-20">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-6xl font-bold tracking-tight">Erişilebilirlik Yaklaşımımız.</h2>
                            <p className="text-lg md:text-xl text-muted-foreground">Prensiplerimiz, kapsayıcı bir toplum inşa etme vizyonuumuzun temelidir.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            <div className="space-y-4 md:space-y-6">
                                <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-primary" /> Bir Özellik Değil, Standarttır.</h3>
                                <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed">Erişilebilirlik, platformun üzerine sonradan eklenen bir modül değil; tasarımın en başından itibaren her bileşene entegre edilmiş bir kalite standardıdır.</p>
                            </div>
                            <div className="space-y-4 md:space-y-6">
                                <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3"><UserCheck className="h-6 w-6 text-primary" /> Kullanıcıya Kontrol Verme.</h3>
                                <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed">Tek bir kullanıcı profiline göre tasarım yapmak yerine, her bireyin kendi ihtiyaçlarına göre özelleştirebileceği gelişmiş erişilebilirlik ayarları sunuyoruz.</p>
                            </div>
                            <div className="space-y-4 md:space-y-6">
                                <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3"><Zap className="h-6 w-6 text-primary" /> Varsayılan Sadelik.</h3>
                                <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed">Uygulamamız varsayılan olarak sade ve net bir yapıdadır. İhtiyaç duyulduğunda aktive edilen gelişmiş özellikler (AAA kriterleri), bu sadeliği bozmadan etkiyi artırır.</p>
                            </div>
                            <div className="space-y-4 md:space-y-6">
                                <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3"><Info className="h-6 w-6 text-primary" /> Şeffaf ve Süreklilik.</h3>
                                <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed">Erişilebilirlik uyumluluğumuzu düzenli olarak değerlendiriyor, kullanıcının geri bildirimlerini teknik yol haritamızın en başına koyuyoruz.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-16 md:py-24 px-6 text-center bg-[#f5f5f7]">
                    <div className="container mx-auto max-w-3xl space-y-8 md:space-y-10">
                        <ShieldCheck className="h-12 w-12 md:h-16 md:w-16 text-primary mx-auto mb-4 md:mb-6" />
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Sürekli İyileştirme Taahhüdü.</h2>
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                            Hangel olarak erişilebilirliği bitmiş bir süreç değil, sürekli bir gelişim yolculuğu olarak görüyoruz. Teknik ve içerik ekiplerimiz, en yüksek erişilebilirlik farkındalığıyla platformu her gün daha kapsayıcı hale getirmek için çalışmaktadır.
                        </p>
                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button asChild size="lg" className="rounded-full px-10 md:px-12 h-12 md:h-14 font-bold shadow-xl shadow-primary/20 text-base md:text-lg w-full sm:w-auto">
                                <Link href="/feedback">Geri Bildirim Ver</Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="rounded-full px-10 md:px-12 h-12 md:h-14 font-bold border border-black/10 hover:bg-white text-base md:text-lg w-full sm:w-auto">
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
