'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, 
    ShieldCheck, 
    Globe, 
    Scale, 
    UserCheck,
    CheckCircle2,
    Zap,
    Lock,
    Cpu,
    FileText,
    TrendingUp,
    ChevronRight,
    Award,
    Building2,
    Landmark
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const StandardItem = ({ 
    icon: Icon, 
    title, 
    body, 
    description,
    standards 
}: { 
    icon: any, 
    title: string, 
    body: string,
    description: string,
    standards: string[]
}) => (
    <Card className="bg-white rounded-[2rem] p-8 md:p-12 border border-black/5 shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col justify-between min-h-[450px]">
        <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">{body}</h3>
                    <h4 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1d1d1f]">{title}</h4>
                </div>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">{description}</p>
            </div>
        </div>
        <div className="pt-8 border-t border-black/5 mt-8">
            <div className="flex flex-wrap gap-2">
                {standards.map((s, i) => (
                    <Badge key={i} variant="secondary" className="bg-[#f5f5f7] text-[#1d1d1f]/60 border-none font-bold text-[10px] py-1 px-3 rounded-full">
                        {s}
                    </Badge>
                ))}
            </div>
        </div>
    </Card>
);

export default function StandardsPage() {
    const router = useRouter();

    const standardGroups = [
        {
            icon: ShieldCheck,
            body: "ISO / IEC",
            title: "Uluslararası Standartlar Organizasyonu",
            description: "Bilgi güvenliği ve iş sürekliliği alanında dünyanın en saygın sertifikasyon süreçlerini temel alıyoruz. Verileriniz ve operasyonlarımız küresel güvence altındadır.",
            standards: ["ISO 27001", "ISO 22301", "ISO 25010"]
        },
        {
            icon: Globe,
            body: "W3C / WCAG",
            title: "World Wide Web Consortium",
            description: "Webin evrenselliği için erişilebilirlik standartlarını (WCAG 2.2) eksiksiz uyguluyoruz. Engel gruplarını gözeterek dijital adaleti savunuyoruz.",
            standards: ["WCAG 2.2 AA", "WCAG 2.2 AAA", "EN 301 549"]
        },
        {
            icon: Lock,
            body: "EU / GDPR",
            title: "Avrupa Birliği Veri Otoriteleri",
            description: "Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) ile tam uyumlu mimarimizle, verilerinizin mahremiyetini ve taşınabilirliğini yasal korumaya alıyoruz.",
            standards: ["GDPR", "KVKK", "LGPD", "CCPA"]
        },
        {
            icon: TrendingUp,
            body: "SVI / SROI",
            title: "Social Value International",
            description: "Oluşturduğumuz toplumsal değerin ölçümlenmesinde uluslararası kabul görmüş SROI (Social Return on Investment) metodolojisini ve Değişim Teorisi'ni kullanıyoruz.",
            standards: ["SROI", "Theory of Change", "Impact Data"]
        },
        {
            icon: Landmark,
            body: "USA / IRS",
            title: "Internal Revenue Service (IRS)",
            description: "Küresel bağışçılık standartları ve fon yönetimi ilkelerinde ABD 501(c)(3) normlarına uyum sağlayarak uluslararası güven inşa ediyoruz.",
            standards: ["501(c)(3) Standards", "AML / CFT Compliance"]
        },
        {
            icon: UserCheck,
            body: "UN / SDG",
            title: "Birleşmiş Milletler",
            description: "Tüm faaliyetlerimizi Birleşmiş Milletler Sürdürülebilir Kalkınma Amaçları (SKA) ile hizalıyor, küresel hedeflere somut katkı sağlıyoruz.",
            standards: ["SKA 1-17", "Global Compact", "DEI Principles"]
        }
    ];

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans selection:bg-primary/30">
            {/* Navigation */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <span className="text-[10px] font-black tracking-tight uppercase">Kalite & Sertifikasyon Standartları</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Link href="/settings/contracts">Beyanları Oku</Link>
                    </Button>
                </div>
            </header>

            <main className="pt-24 pb-32">
                {/* Hero Section */}
                <section className="container mx-auto px-6 max-w-5xl text-center py-16 md:py-24 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-4">
                        <Award className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Global Güven Standartları</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-[#1d1d1f] leading-[0.95]">
                        Standartlarına Uyum sağladığımız <br className="hidden md:block" /> Sertifikasyon Kurumları.
                    </h1>
                    <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                        hangel, teknoloji ve sosyal fayda arasındaki köprüyü uluslararası otoritelerin belirlediği en sıkı standartlarla inşaa eder. Güvenimiz, uyum sağladığımız bu ilkelerden gelir.
                    </p>
                </section>

                {/* Standards Grid */}
                <section className="container mx-auto px-6 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {standardGroups.map((group, index) => (
                            <StandardItem key={index} {...group} />
                        ))}
                    </div>
                </section>

                {/* Compliance Statement */}
                <section className="container mx-auto px-6 max-w-4xl mt-24">
                    <Card className="rounded-[3rem] bg-black text-white p-10 md:p-16 border-none shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <CardHeader className="relative z-10 space-y-4">
                            <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
                            <CardTitle className="text-3xl md:text-5xl font-bold tracking-tight">Sürekli Denetim ve Gelişim.</CardTitle>
                            <CardDescription className="text-lg text-white/60 font-medium leading-relaxed max-w-2xl mx-auto">
                                Standartlara uyum bizim için bir son durak değil, sürekli bir gelişim yolculuğudur. Altyapımız, her yeni güncellenen regülasyona ve teknolojik standarda göre anlık olarak revize edilmektedir.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                            <Button asChild size="lg" className="rounded-full px-10 h-14 font-bold bg-white text-black hover:bg-white/90 w-full sm:w-auto">
                                <Link href="/ngo-admin/transparency">Şeffaflık Raporu</Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="rounded-full px-10 h-14 font-bold text-white hover:bg-white/10 w-full sm:w-auto">
                                <Link href="/support">Teknik Bilgi Al</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </section>

                {/* Bottom Context */}
                <section className="container mx-auto px-6 max-w-5xl mt-32 text-center space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                        <div className="space-y-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm w-fit border border-black/5">
                                <Scale className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-bold text-lg">Hukuki Güvence</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">Faaliyetlerimiz, hem yerel sivil toplum mevzuatı hem de uluslararası ticaret ve vakıf hukuku ile tam uyum içerisindedir.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm w-fit border border-black/5">
                                <Cpu className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-bold text-lg">Teknik Mükemmeliyet</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">Yazılım yaşam döngümüz (SDLC), güvenlik ve performans odaklı uluslararası mimari standartlara (ISO 25010) göre şekillenir.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm w-fit border border-black/5">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-bold text-lg">Kurumsal Şeffaflık</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">Tüm sertifikasyon iddialarımız, dileyen paydaşlarımız tarafından kütüphanemizdeki resmi belgelerle teyit edilebilir.</p>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter currentPageLabel="Standartlar" />
        </div>
    );
}
