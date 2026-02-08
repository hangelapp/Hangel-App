'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight, 
    ArrowLeft, 
    Globe, 
    Users, 
    Heart, 
    ShieldCheck, 
    Newspaper, 
    Target, 
    ArrowRight, 
    Home, 
    Truck, 
    Briefcase, 
    ExternalLink,
    Brain,
    Scale,
    UserCheck,
    Map as MapIcon,
    BookOpen,
    DollarSign,
    GraduationCap,
    FileText,
    Sparkles,
    Siren,
    ShoppingCart,
    HeartHandshake
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HangelLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

const AssociationHeader = ({ currentPage }: { currentPage?: string }) => {
    const router = useRouter();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.push('/login')} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Platforma Dön
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

const StatCard = ({ label, value, sub }: { label: string, value: string, sub?: string }) => (
    <div className="text-center p-6 bg-white rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{label}</p>
        <p className="text-4xl md:text-6xl font-black tracking-tighter text-primary">{value}</p>
        {sub && <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">{sub}</p>}
    </div>
);

const FeatureCard = ({ title, subtitle, href, image, hint, theme = 'light' }: any) => (
    <Link href={href} className="group relative block w-full aspect-square md:aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-xl border border-black/5">
        <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" data-ai-hint={hint} />
        <div className={cn(
            "absolute inset-0 p-8 md:p-12 flex flex-col justify-end",
            theme === 'dark' ? "bg-black/20" : "bg-white/10"
        )}>
            <div className="relative z-10 space-y-2">
                <h3 className={cn("text-3xl md:text-5xl font-bold tracking-tight", theme === 'dark' ? "text-white" : "text-[#1d1d1f]")}>{title}</h3>
                <p className={cn("text-lg md:text-xl font-medium opacity-90 flex items-center", theme === 'dark' ? "text-white/80" : "text-[#1d1d1f]/80")}>
                    {subtitle} <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </p>
            </div>
        </div>
    </Link>
);

const SectionTitle = ({ title, subtitle, centered = false }: { title: string, subtitle?: string, centered?: boolean }) => (
    <div className={cn("space-y-4 mb-12", centered ? "text-center" : "text-left")}>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">{title}</h2>
        {subtitle && <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">{subtitle}</p>}
    </div>
);

export default function AssociationHomePage() {
    const { toast } = useToast();

    const handleAction = (label: string) => {
        toast({
            title: label,
            description: "İlgili içerik veya modül yükleniyor...",
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
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-[#1d1d1f] leading-[0.95]">
                        Yok öyle yalnız başına mücadele etmek.
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                        Sosyal sorunlara çözüm için sistemli mücadeleyi ve sosyal inovasyonu önceliklendiren, sosyal girişimcilik ve gönüllülük alanında araştırma, politika ve projeler üreten etki odaklı fikirlerin buluşma noktasına hoş geldiniz.
                    </p>
                    <div className="pt-4">
                        <p className="text-lg font-bold text-primary italic">"Bunu acıları yarıştırmadan hep birlikte gerçekleştireceğiz."</p>
                    </div>
                </div>
            </section>

            {/* Stats Highlight */}
            <section className="py-24 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Serüven" value="5" sub="Yıl" />
                        <StatCard label="Erişim" value="54" sub="Farklı Ülke" />
                        <StatCard label="Etki" value="15.561" sub="Katılımcı" />
                        <StatCard label="İş Birliği" value="126" sub="Etkinlik" />
                        <StatCard label="Akademi" value="42" sub="Üniversite" />
                        <StatCard label="Kamusal" value="17" sub="Valilik & Belediye" />
                        <StatCard label="Ekosistem" value="12" sub="Ticaret Odası" />
                        <StatCard label="Güç Birliği" value="120" sub="Aktif Partner" />
                    </div>
                </div>
            </section>

            {/* Agenda Section */}
            <section className="py-24 px-6 bg-[#f5f5f7]">
                <div className="container mx-auto max-w-6xl">
                    <SectionTitle title="Gündem." subtitle="Sosyal fayda ekosisteminin öncelikli başlıkları." />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: "STK Gelir Modelleri", desc: "Sürdürülebilirlik ve finansal bağımsızlık stratejileri.", action: "STK Gelir Modelleri" },
                            { title: "Global Çalıştay", desc: "Uluslararası sosyal girişimcilik diyalogları.", href: "/hangelassociation/workshop" },
                            { title: "hangel Clubs", desc: "Kampüslerde sosyal inovasyon hareketi.", action: "hangel Clubs" },
                            { title: "Mevzuat Tasarısı", desc: "Sosyal Girişimcilik Kanunu için yasal süreçler.", href: "/hangelassociation/legislation" }
                        ].map((item, i) => (
                            <div key={i}>
                                {item.href ? (
                                    <Link href={item.href} className="block p-8 bg-white h-full rounded-[2.5rem] border border-black/5 hover:border-primary/20 transition-all group">
                                        <h4 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                                    </Link>
                                ) : (
                                    <button onClick={() => handleAction(item.action!)} className="w-full text-left p-8 bg-white h-full rounded-[2.5rem] border border-black/5 hover:border-primary/20 transition-all group">
                                        <h4 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Committees Section */}
            <section className="py-32 px-6">
                <div className="container mx-auto max-w-6xl">
                    <SectionTitle title="Komitelerimiz." subtitle="Bilimsel veri ve stratejik politika üretim merkezlerimiz." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { title: "Sosyal İnovasyon Akademik Bilim Kurulu", icon: Brain, color: "bg-blue-500" },
                            { title: "Etki Mevzuatı ve Politika Geliştirme Komisyonu", icon: Scale, color: "bg-primary" },
                            { title: "hangel Sosyal İnovasyon Komitesi", icon: Sparkles, color: "bg-purple-500" },
                            { title: "Etki Odaklı İnsan ve Kültür Komitesi", icon: Users, color: "bg-orange-500" }
                        ].map((comm, i) => (
                            <button key={i} onClick={() => handleAction(comm.title)} className="flex items-center gap-6 p-8 bg-[#f5f5f7] rounded-[2.5rem] hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-black/5 text-left w-full">
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg", comm.color)}>
                                    <comm.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#1d1d1f]">{comm.title}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Projects Section */}
            <section className="py-32 px-6 bg-black text-white">
                <div className="container mx-auto max-w-6xl">
                    <SectionTitle title="Projelerimiz." subtitle="Sivil toplumun dijital ve yasal dönüşümüne öncülük eden vizyon projeler." />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "Sosyal Girişimcilik Kanun Teklifi", icon: Scale, href: "/hangelassociation/legislation" },
                            { title: "hangel Impact Fellow", icon: UserCheck, action: "Impact Fellow" },
                            { title: "Etki Odaklı İstihdam Protokolü", icon: Briefcase, action: "İstihdam Protokolü" },
                            { title: "hangel Sosyal Etki Atlası", icon: MapIcon, action: "Etki Atlası" },
                            { title: "Girişimcilik Kütüphanesi", icon: BookOpen, href: "/hangelassociation/workshop" },
                            { title: "STK Gelir Modeli & Sürdürülebilirlik", icon: DollarSign, action: "Gelir Modeli" }
                        ].map((proj, i) => (
                            <div key={i} className="group p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-between min-h-[280px]">
                                <div className="p-4 bg-white/10 rounded-2xl w-fit">
                                    <proj.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold tracking-tight leading-tight">{proj.title}</h3>
                                    {proj.href ? (
                                        <Link href={proj.href} className="inline-flex items-center text-primary font-bold hover:underline">
                                            İncele <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    ) : (
                                        <button onClick={() => handleAction(proj.action!)} className="inline-flex items-center text-primary font-bold hover:underline">
                                            İncele <ArrowRight className="ml-2 h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Academic Section */}
            <section className="py-32 px-6">
                <div className="container mx-auto max-w-6xl">
                    <SectionTitle title="Heyecanlarımız." subtitle="Türkiye'de sosyal girişimciliğin akademik temellerini atıyoruz." />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Mersin Üniversitesi", desc: "Sosyal Girişimcilik Yüksek Lisans Programı", logo: "https://logo.clearbit.com/mersin.edu.tr" },
                            { title: "Int. Science & Tech University", desc: "Social Enterprise Master Program", logo: "https://picsum.photos/seed/univ1/200/200" },
                            { title: "Maltepe Üniversitesi", desc: "Uygulamalı Sosyal Girişimcilik Lisans Dersi", logo: "https://logo.clearbit.com/maltepe.edu.tr" }
                        ].map((item, i) => (
                            <Card key={i} className="rounded-[2.5rem] border-none shadow-lg overflow-hidden group">
                                <div className="p-8 space-y-6">
                                    <Avatar className="h-16 w-16 border bg-white">
                                        <AvatarImage src={item.logo} className="object-contain p-2" />
                                        <AvatarFallback><GraduationCap /></AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <h4 className="font-black text-xs uppercase tracking-widest text-primary">{item.title}</h4>
                                        <p className="text-xl font-bold leading-tight">{item.desc}</p>
                                    </div>
                                    <Button variant="ghost" className="p-0 h-auto text-primary font-bold group-hover:pl-2 transition-all" onClick={() => handleAction(item.title)}>
                                        Detayları İncele <ChevronRight className="ml-1 h-4 w-4"/>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reports Section */}
            <section className="py-32 px-6 bg-[#f5f5f7]">
                <div className="container mx-auto max-w-6xl">
                    <SectionTitle title="Raporlarımız." subtitle="Şeffaf ve hesap verebilir sivil toplum için veriye dayalı dökümanlar." />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "5 Yıllık Sosyal Fayda Raporu", desc: "2020-2025 Etki Analizi" },
                            { title: "Sosyal Girişimcilik 2025", desc: "Türkiye Mevcut Durum Raporu" },
                            { title: "Afet Müdahale Raporu", desc: "Deprem Öncesi ve Sonrası Süreçler" },
                            { title: "Etkinlik & Konferans", desc: "SBG Ulusal ve Uluslararası Faaliyetler" }
                        ].map((report, i) => (
                            <div key={i} className="p-8 bg-white rounded-[2.5rem] border border-black/5 flex flex-col justify-between hover:shadow-2xl transition-all group min-h-[320px]">
                                <div className="p-4 bg-muted rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                                    <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-xl leading-tight">{report.title}</h4>
                                    <p className="text-xs text-muted-foreground font-medium">{report.desc}</p>
                                    <Button variant="outline" className="w-full rounded-full border-black/10 font-bold hover:bg-black hover:text-white" onClick={() => handleAction(report.title)}>Raporu İncele</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* News Section */}
            <section id="haberler" className="py-32 px-6">
                <div className="container mx-auto max-w-4xl space-y-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Newspaper className="h-8 w-8 text-primary" />
                            <h2 className="text-4xl font-bold tracking-tight text-[#1d1d1f]">Güncel Haberler.</h2>
                        </div>
                        <Button variant="ghost" className="font-bold text-primary" onClick={() => handleAction('Tüm Haberler')}>Tüm Haberler</Button>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { title: "4. Uluslararası Sosyal Girişimcilik Çalıştayı Tunceli'de Gerçekleşti", date: "9 Aralık 2024", author: "admin", img: "https://picsum.photos/seed/news1/800/400" },
                            { title: "Hakkari Üniversitesinden “Sosyal Girişimcilik” Semineri", date: "1 Mart 2024", author: "admin", img: "https://picsum.photos/seed/news2/800/400" },
                            { title: "STK’larda Gelir Modeli Oluşturma Buluşmaları Başlıyor", date: "8 Ağustos 2025", author: "admin", img: "https://picsum.photos/seed/news3/800/400" }
                        ].map((news, i) => (
                            <div key={i} className="group flex flex-col md:flex-row gap-8 p-6 bg-[#f5f5f7] rounded-3xl hover:bg-white hover:shadow-2xl transition-all border border-transparent hover:border-black/5">
                                <div className="relative w-full md:w-64 aspect-video rounded-2xl overflow-hidden shrink-0">
                                    <Image src={news.img} alt={news.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                                <div className="space-y-3 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <span>{news.author}</span>
                                        <span>•</span>
                                        <span>{news.date}</span>
                                    </div>
                                    <h4 className="text-xl md:text-2xl font-bold text-[#1d1d1f] group-hover:text-primary transition-colors leading-tight">{news.title}</h4>
                                    <Button variant="ghost" className="p-0 h-auto self-start text-primary font-bold" onClick={() => handleAction(news.title)}>Okumaya Devam Et <ArrowRight className="ml-1 h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom Quote Section */}
            <section className="bg-black text-white py-32 text-center border-b border-white/5">
                <div className="container mx-auto px-6 max-w-4xl space-y-12">
                    <Heart className="h-16 w-16 text-primary mx-auto" />
                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter">Dayanışmayla Büyür.</h2>
                    <p className="text-xl md:text-3xl text-white/70 leading-relaxed font-medium italic">
                        "Bir toplumun gücü, en savunmasız anlarda gösterdiği dayanışma ile ölçülür. Bir fikirle başlar, dayanışmayla büyür, vizyonla dünya değişir."
                    </p>
                    <div className="pt-8">
                        <Button asChild size="lg" className="rounded-full px-12 h-14 font-bold bg-primary hover:bg-primary/90 text-lg shadow-2xl shadow-primary/20">
                            <Link href="/login/selection?action=register">Hemen Katıl <ArrowRight className="ml-2 h-5 w-5" /></Link>
                        </Button>
                    </div>
                </div>
            </section>

            <PublicFooter currentPageLabel="hangel Derneği" />
        </div>
    );
}
