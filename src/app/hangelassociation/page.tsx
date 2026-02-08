
'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, ArrowLeft, Globe, Users, Heart, ShieldCheck, Newspaper, Target, ArrowRight, 
    Briefcase, Brain, Scale, UserCheck, Map as MapIcon, BookOpen, DollarSign, GraduationCap, 
    FileText, Sparkles, ShoppingCart, HeartHandshake, Landmark, Search, Filter, ArrowDownUp,
    Store, MessageSquare, Download, School, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

const AssociationHeader = ({ currentPage }: { currentPage?: string }) => {
    const router = useRouter();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.push('/login')} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium text-[#1d1d1f]/80">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Platforma Dön
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-[#1d1d1f]/60">
                    <Link href="/hangelassociation/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>Dernek Hakkında</Link>
                    <Link href="/hangelassociation/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>Dernek Etkinlikleri</Link>
                    <Link href="/hangelassociation/workshop" className={cn("hover:text-primary transition-colors", currentPage === 'workshop' && "text-primary")}>Uluslararası Çalıştay</Link>
                    <Link href="/hangelassociation/legislation" className={cn("hover:text-primary transition-colors", currentPage === 'legislation' && "text-primary")}>Mevzuat Taslağı</Link>
                </nav>
                <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Link href="/login/selection?action=register">Gönüllü Ol</Link>
                </Button>
            </div>
        </header>
    );
};

const StatCard = ({ label, value, sub }: { label: string, value: string, sub?: string }) => (
    <div className="text-center p-8 bg-white rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-2xl transition-all duration-500 group">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 group-hover:text-primary transition-colors">{label}</p>
        <p className="text-5xl md:text-7xl font-black tracking-tighter text-[#1d1d1f] group-hover:scale-110 transition-transform duration-500">{value}</p>
        {sub && <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">{sub}</p>}
    </div>
);

export default function AssociationHomePage() {
    const { toast } = useToast();

    const handleAction = (label: string) => {
        toast({
            title: label,
            description: "İlgili kurumsal modül ve içerik hazırlanıyor...",
        });
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 text-center space-y-8 overflow-hidden bg-[#f5f5f7]">
                <div className="container mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-4">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Social Business Global</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] leading-[0.95]">
                        Yok öyle yalnız başına mücadele etmek.
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                        Sosyal sorunlara çözüm için sistemli mücadeleyi ve sosyal inovasyonu önceliklendiren, sosyal girişimcilik ve gönüllülük alanında araştırma, politika ve projeler üreten etki odaklı fikirlerin buluşma noktasına hoş geldiniz.
                    </p>
                    <div className="pt-8 space-y-2">
                        <p className="text-lg md:text-xl font-bold text-primary italic">"Bunu acıları yarıştırmadan hep birlikte gerçekleştireceğiz."</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Social Business Global Türkiye Ofisi</p>
                    </div>
                </div>
            </section>

            {/* Global Metrics */}
            <section className="py-24 px-6 border-b border-black/5">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Yolculuk" value="5" sub="YIL" />
                        <StatCard label="Küresel Ağ" value="54" sub="FARKLI ÜLKE" />
                        <StatCard label="Topluluk" value="15.561" sub="KATILIMCI" />
                        <StatCard label="Etki Birliği" value="126" sub="ETKİNLİK" />
                        <StatCard label="Akademi" value="42" sub="ÜNİVERSİTE" />
                        <StatCard label="Partner" value="120" sub="AKTİF KURULUŞ" />
                        <StatCard label="Ekosistem" value="12" sub="TİCARET ODASI" />
                        <StatCard label="Kamusal" value="17" sub="BELEDİYE & VALİLİK" />
                    </div>
                </div>
            </section>

            {/* Gündem Section */}
            <section className="py-32 px-6 bg-[#f5f5f7]">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div className="space-y-4">
                            <Target className="h-12 w-12 text-primary" />
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Gündem.</h2>
                        </div>
                        <p className="text-xl text-muted-foreground font-medium max-w-md">Sosyal fayda ekosisteminin öncelikli stratejik başlıkları.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { title: "STK Gelir Modelleri", desc: "Sivil toplumun finansal sürdürülebilirliği için yeni nesil modeller.", icon: DollarSign, action: "Gelir Modelleri" },
                            { title: "Uluslararası Çalıştay", desc: "Küresel sosyal girişimcilik diyalogları ve raporlama.", href: "/hangelassociation/workshop", icon: Globe },
                            { title: "hangel Clubs", desc: "Üniversite kampüslerinde sosyal inovasyon hareketi.", action: "hangel Clubs", icon: School },
                            { title: "Mevzuat Tasarısı", desc: "Sosyal Girişimcilik Kanunu için yasal istişare süreçleri.", href: "/hangelassociation/legislation", icon: Scale }
                        ].map((item, i) => (
                            <div key={i}>
                                {item.href ? (
                                    <Link href={item.href} className="group flex items-center justify-between p-10 bg-white rounded-[3rem] border border-black/5 hover:shadow-2xl transition-all duration-500">
                                        <div className="space-y-4">
                                            <div className="p-3 bg-[#f5f5f7] rounded-2xl w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                                                <item.icon className="h-6 w-6" />
                                            </div>
                                            <h4 className="font-bold text-2xl group-hover:text-primary transition-colors">{item.title}</h4>
                                            <p className="text-muted-foreground font-medium">{item.desc}</p>
                                        </div>
                                        <ChevronRight className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                                    </Link>
                                ) : (
                                    <button onClick={() => handleAction(item.action!)} className="w-full group flex items-center justify-between p-10 bg-white rounded-[3rem] border border-black/5 hover:shadow-2xl transition-all duration-500 text-left">
                                        <div className="space-y-4">
                                            <div className="p-3 bg-[#f5f5f7] rounded-2xl w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                                                <item.icon className="h-6 w-6" />
                                            </div>
                                            <h4 className="font-bold text-2xl group-hover:text-primary transition-colors">{item.title}</h4>
                                            <p className="text-muted-foreground font-medium">{item.desc}</p>
                                        </div>
                                        <ChevronRight className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Projelerimiz Section */}
            <section className="py-32 px-6 bg-white overflow-hidden">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center space-y-4 mb-20">
                        <Briefcase className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Projelerimiz.</h2>
                        <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto">Sürdürülebilir dönüşüm için hayata geçirdiğimiz vizyon modeller.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { title: "Sosyal Girişimcilik Kanunu", desc: "Sektörün yasal statüsü için 29 maddelik kanun teklifi taslağı.", icon: Scale, slug: "legislation" },
                            { title: "Girişimcilik Kütüphanesi", desc: "21 merkezde bilgi ve tecrübe temelli yol haritası kütüphaneleri.", icon: BookOpen, slug: "workshop" },
                            { title: "Etki İstihdamı Protokolü", desc: "Gönüllülüğü 'Resmi Özgeçmiş' sayan kurumsal işbirliği ağı.", icon: ShieldCheck, slug: "projects/istihdam-protokolu" },
                            { title: "Sosyal Etki Atlası", desc: "Türkiye'nin dijital sosyal sorun ve çözüm haritası.", icon: MapIcon, slug: "projects/etki-atlasi" }
                        ].map((project, i) => (
                            <Link key={i} href={`/hangelassociation/${project.slug}`} className="group relative bg-[#f5f5f7] rounded-[3rem] p-10 flex flex-col gap-6 hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-black/5">
                                <div className="p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                    <project.icon className="h-8 w-8 text-primary group-hover:text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">{project.title}</h3>
                                <p className="text-base text-muted-foreground leading-relaxed font-medium">{project.desc}</p>
                                <div className="mt-auto pt-4 flex items-center text-primary font-bold text-sm uppercase tracking-widest">
                                    İncele <ChevronRight className="ml-1 h-4 w-4" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Komitelerimiz */}
            <section className="py-32 px-6 bg-[#f5f5f7]">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center space-y-4 mb-20">
                        <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Komitelerimiz.</h2>
                        <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto">Bilimsel veri ve stratejik politika üretim merkezlerimiz.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Akademik Bilim Kurulu", icon: Brain, color: "bg-blue-500", slug: "akademik" },
                            { title: "Etki Mevzuatı Komisyonu", icon: Scale, color: "bg-primary", slug: "mevzuat" },
                            { title: "İnsan ve Kültür Komitesi", icon: Users, color: "bg-orange-500", slug: "insan-kultur" }
                        ].map((comm, i) => (
                            <Link key={i} href={`/hangelassociation/committees/${comm.slug}`} className="flex flex-col items-center gap-6 p-10 bg-white rounded-[3rem] hover:shadow-2xl transition-all border border-black/5 text-center group">
                                <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500", comm.color)}>
                                    <comm.icon className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight text-[#1d1d1f] leading-tight">{comm.title}</h3>
                                <span className="text-primary font-bold text-xs uppercase tracking-widest mt-auto">Detayları Gör</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Heyecanlarımız - Academic Projects */}
            <section className="py-32 px-6 bg-black text-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
                        <div className="space-y-4">
                            <GraduationCap className="h-12 w-12 text-primary" />
                            <h2 className="text-4xl md:text-7xl font-bold tracking-tighter">Heyecanlarımız.</h2>
                        </div>
                        <p className="text-xl text-white/60 font-medium max-w-md italic">"Türkiye'de sosyal girişimciliğin akademik temellerini atıyoruz."</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Mersin Üniversitesi", desc: "Sosyal Girişimcilik Yüksek Lisans Programı", logo: "https://logo.clearbit.com/mersin.edu.tr" },
                            { title: "Int. Science & Tech Univ.", desc: "Social Enterprise Master Program (Polonya)", logo: "https://picsum.photos/seed/univpol/200/200" },
                            { title: "Maltepe Üniversitesi", desc: "Uygulamalı Sosyal Girişimcilik Lisans Dersi", logo: "https://logo.clearbit.com/maltepe.edu.tr" }
                        ].map((item, i) => (
                            <Card key={i} className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden group bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="p-10 space-y-8">
                                    <Avatar className="h-20 w-20 border-2 border-white/10 bg-white p-2">
                                        <AvatarImage src={item.logo} className="object-contain" />
                                        <AvatarFallback><GraduationCap className="text-black" /></AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-3">
                                        <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-primary">{item.title}</h4>
                                        <p className="text-2xl font-bold leading-[1.1] tracking-tight">{item.desc}</p>
                                    </div>
                                    <Button variant="ghost" className="p-0 h-auto text-primary font-bold hover:bg-transparent group-hover:pl-2 transition-all" onClick={() => handleAction(item.title)}>
                                        Programı İncele <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Raporlarımız Section */}
            <section className="py-32 px-6 bg-[#f5f5f7]">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center space-y-4 mb-20">
                        <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Raporlarımız.</h2>
                        <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto">Şeffaf ve hesap verebilir sivil toplum için 5 yıllık dijital mirasımız.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { title: "5 Yıllık Sosyal Fayda Raporu", desc: "2020-2025 Etki Analizi ve Stratejik Sonuçlar", slug: "5-yillik-etki" },
                            { title: "Sosyal Girişimcilik 2025 Raporu", desc: "Türkiye'nin Sosyal İnovasyon Haritası ve Trendleri", slug: "etkinlikler" },
                            { title: "Afet Müdahale Raporu", desc: "Deprem Öncesi ve Sonrası Müdaheleler ve Dayanışma Verileri", slug: "afet-mudahale" },
                            { title: "Etkinlik & Konferans Raporu", desc: "Ulusal ve Uluslararası 126 Etkinliğin Katılım Analizi", slug: "etkinlikler" }
                        ].map((report, i) => (
                            <Link key={i} href={`/hangelassociation/reports/${report.slug}`} className="group p-10 bg-white rounded-[3rem] border border-black/5 flex items-center justify-between hover:shadow-2xl transition-all duration-500">
                                <div className="space-y-3">
                                    <h4 className="font-bold text-2xl leading-tight group-hover:text-primary transition-colors">{report.title}</h4>
                                    <p className="text-sm text-muted-foreground font-medium">{report.desc}</p>
                                </div>
                                <div className="p-4 bg-[#f5f5f7] rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Download className="h-6 w-6" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Basında Biz Section */}
            <section className="py-32 px-6 bg-white border-b border-black/5">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div className="space-y-4">
                            <Newspaper className="h-12 w-12 text-primary" />
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">Basında Biz.</h2>
                        </div>
                        <Link href="/press" className="text-primary font-bold flex items-center hover:underline">Medya Arşivini Gör <ChevronRight className="h-5 w-5 ml-1"/></Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { agency: "AA", title: "Türkiye'nin sosyal girişimcilik etki haritası çıkartılacak", link: "https://www.aa.com.tr/tr/turkiye/turkiyenin-sosyal-girisimcilik-etki-haritasi-cikartilacak/1526753" },
                            { agency: "TRT Haber", title: "Sistemli İyilik: Sosyal Girişimcilik Dönüşümü", link: "https://www.trthaber.com/haber/turkiye/turkiyenin-sosyal-girisimcilik-etki-haritasi-cikarilacak-422386.html" },
                            { agency: "Hürriyet", title: "Rekabetin yeni adı: Sosyal Fayda", link: "https://www.hurriyet.com.tr/yazarlar/sibel-bagci-uzun/rekabetin-yeni-adi-sosyal-fayda-41862206" },
                            { agency: "NTV", title: "Üniversitelilerden Vana Kan Bağışı Desteği", link: "https://www.ntv.com.tr/egitim/universitelilerden-vana-kan,KYYWoqEdIEO-E38v3kzFSw" }
                        ].map((news, i) => (
                            <a key={i} href={news.link} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between p-8 bg-[#f5f5f7] rounded-[2rem] hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-black/5">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{news.agency}</span>
                                    <h4 className="text-xl font-bold text-[#1d1d1f] group-hover:text-primary transition-colors">{news.title}</h4>
                                </div>
                                <ExternalLink className="h-6 w-6 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom Quote Section */}
            <section className="bg-black text-white py-40 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="container mx-auto px-6 max-w-4xl space-y-12 relative z-10">
                    <Heart className="h-20 w-20 text-primary mx-auto mb-8 animate-pulse" />
                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter">Birlikte Başaralım.</h2>
                    <p className="text-2xl md:text-4xl text-white/70 leading-relaxed font-medium italic max-w-3xl mx-auto">
                        "Bir fikirle başlar, dayanışmayla büyür, vizyonla dünya değişir. Acıları yarıştırmadan, toplumsal sorunlar için birlikte çalışıyoruz."
                    </p>
                    <div className="pt-12">
                        <Button asChild size="lg" className="rounded-full px-16 h-16 font-black bg-primary hover:bg-primary/90 text-xl shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <Link href="/login/selection?action=register">Hemen Katıl <ArrowRight className="ml-3 h-6 w-6" /></Link>
                        </Button>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="hangel Derneği" />
        </div>
    );
}
