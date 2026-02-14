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
    Landmark,
    Target
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const ComplianceTable = ({ title, description, data, headers }: { title: string, description?: string, data: any[], headers: string[] }) => (
    <div className="space-y-6">
        <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">{title}</h3>
            {description && <p className="text-sm text-muted-foreground font-medium">{description}</p>}
        </div>
        <Card className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-black/5 shadow-sm bg-white">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#f5f5f7] border-none hover:bg-[#f5f5f7]">
                            {headers.map((header, i) => (
                                <TableHead key={i} className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#1d1d1f]/60 whitespace-nowrap">
                                    {header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, i) => (
                            <TableRow key={i} className="hover:bg-[#f5f5f7]/50 border-black/5">
                                {Object.values(row).map((cell: any, j) => (
                                    <TableCell key={j} className={cn(
                                        "py-4 px-6 text-sm font-medium",
                                        j === 0 ? "text-[#1d1d1f] font-bold" : "text-[#1d1d1f]/70",
                                        String(cell).includes('%') && "text-primary font-black"
                                    )}>
                                        {cell}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    </div>
);

export default function StandardsPage() {
    const router = useRouter();

    const mainComplianceData = [
        { label: "Kullanıcı Sözleşmesi", std: "Tüketici Hukuku", org: "Ticaret Bakanlığı", region: "Türkiye", rate: "%100" },
        { label: "Kullanıcı Sözleşmesi", std: "Consumer Protection", org: "FTC", region: "ABD", rate: "%90" },
        { label: "Kuruluş Sözleşmesi", std: "Social Enterprise Model", org: "OECD", region: "OECD", rate: "%95" },
        { label: "Gönüllülük Sözleşmesi", std: "ILO Çerçevesi", org: "ILO", region: "Küresel", rate: "%90" },
        { label: "Gönüllü Hakları Beyanı", std: "İnsan Hakları", org: "UN", region: "Küresel", rate: "%95" },
        { label: "Gizlilik Politikası", std: "ISO/IEC 27701", org: "ISO", region: "Küresel", rate: "%85" },
        { label: "KVKK Aydınlatma Metni", std: "KVKK", org: "KVKK Kurumu", region: "Türkiye", rate: "%100" },
        { label: "GDPR Uyum Politikası", std: "GDPR", org: "AB Veri Otoriteleri", region: "AB", rate: "%90" },
        { label: "Açık Rıza Metni", std: "GDPR + KVKK", org: "KVKK / EDPB", region: "TR + AB", rate: "%100" },
        { label: "Veri Saklama & İmha", std: "ISO 27001", org: "ISO", region: "Küresel", rate: "%85" },
        { label: "Çevresel Sorumluluk", std: "ISO 14001", org: "ISO", region: "Küresel", rate: "%75" },
        { label: "Etik İlkeler", std: "UN Global Compact", org: "UNGC", region: "Küresel", rate: "%95" },
        { label: "İnsan Hakları", std: "UNGP", org: "UN", region: "Küresel", rate: "%95" },
        { label: "Erişilebilirlik", std: "WCAG 2.1", org: "W3C", region: "Küresel", rate: "%85" },
    ];

    const accessibilityComplianceData = [
        { label: "Web Content Accessibility Guidelines", std: "WCAG 2.2", org: "W3C", region: "Küresel", rate: "AA: %100 / AAA: %95" },
        { label: "European Accessibility Act (EAA)", std: "EN 301 549", org: "Avrupa Komisyonu", region: "Avrupa Birliği", rate: "%95" },
        { label: "Americans with Disabilities Act (ADA)", std: "WCAG 2.1–2.2 AA", org: "Department of Justice", region: "ABD", rate: "%96" },
        { label: "Section 508", std: "WCAG 2.1–2.2", org: "U.S. Access Board", region: "ABD", rate: "%96" },
        { label: "TS EN 301 549", std: "WCAG 2.1–2.2", org: "TSE", region: "Türkiye", rate: "%95" },
        { label: "UN CRPD (Madde 9)", std: "WCAG referanslı", org: "United Nations", region: "Küresel", rate: "%100" },
    ];

    const socialEconomyData = [
        { label: "Sosyal Ekonomi Eylem Planı", std: "Çerçeve politika", org: "European Commission", region: "AB", rate: "%100" },
        { label: "Sosyal Girişim Tanımı (EU)", std: "Tavsiye kararı", org: "European Union", region: "AB", rate: "%100" },
        { label: "GRI 413 / 203", std: "Etki raporlama standardı", org: "Global Reporting Initiative", region: "Küresel", rate: "%100" },
        { label: "Dernekler Kanunu (5253)", std: "Bağlayıcı mevzuat", org: "İçişleri Bakanlığı", region: "Türkiye", rate: "%100" },
        { label: "SDGs (2030 Gündemi)", std: "Küresel hedef seti", org: "United Nations", region: "Küresel", rate: "%100" },
    ];

    const fullAuditList = [
        { label: "Kullanıcı Sözleşmesi", std: "Kurumsal kullanım şartları", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Kuruluş Sözleşmesi", std: "Kurumsal yapı", org: "hangel", region: "Türkiye", rate: "100" },
        { label: "Gönüllülük Sözleşmesi", std: "Gönüllü hak ve sorumluluklar", org: "hangel", region: "Türkiye", rate: "100" },
        { label: "Gizlilik Politikası", std: "KVKK / GDPR / CCPA / LGPD", org: "hangel", region: "AB, ABD, TR, LATAM", rate: "100" },
        { label: "KVKK Aydınlatma Metni", std: "KVKK", org: "İçişleri Bakanlığı", region: "Türkiye", rate: "100" },
        { label: "Bilgi Güvenliği Politikası", std: "ISO 27001", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Yapay Zekâ Şeffaflık Beyanı", std: "AI Şeffaflık İlkeleri", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Sosyal Etki Politikası", std: "SROI & Theory of Change", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Açık Veri Politikası", std: "Global Reporting Initiative", org: "GRI", region: "Küresel", rate: "100" },
        { label: "İnsan Hakları Politikası", std: "UN Guiding Principles", org: "United Nations", region: "Küresel", rate: "100" },
        { label: "Erişilebilirlik Politikası", std: "WCAG / EN 301 549", org: "European Commission", region: "AB", rate: "100" },
        { label: "ISO 27001 Uyum Beyanı", std: "Bilgi Güvenliği", org: "ISO", region: "Küresel", rate: "100" },
        { label: "ISO 22301 Uyum Beyanı", std: "İş Sürekliliği", org: "ISO", region: "Küresel", rate: "100" },
        { label: "Bağımsız Mali Denetim", std: "IFRS / GAAP", org: "IFRS / GAAP", region: "Küresel", rate: "100" },
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

                {/* Compliance Sections */}
                <section className="container mx-auto px-6 max-w-6xl space-y-24">
                    
                    <ComplianceTable 
                        title="Kurumsal Sözleşme ve Politika Uyum Oranları"
                        description="Ana sözleşmeler, gizlilik ve finansal şeffaflık politikalarımızın küresel standartlarla eşleşme durumu."
                        headers={["Belge", "Standart / Sertifika", "Kurum", "Ülke / Birlik", "Sağlanan"]}
                        data={mainComplianceData}
                    />

                    <ComplianceTable 
                        title="Küresel Erişilebilirlik Mevzuat Uyumu"
                        description="Platformumuz; WCAG 2.2 AA standartlarıyla %100 uyumlu, WCAG 2.2 AAA kriterlerini ise %95 oranında destekler."
                        headers={["Belge / Mevzuat", "Standart Referansı", "Talep Eden Kurum", "Ülke / Birlik", "Sağlanan (%)"]}
                        data={accessibilityComplianceData}
                    />

                    <ComplianceTable 
                        title="Sosyal Ekonomi ve Kalkınma Çerçeveleri"
                        description="Sosyal girişimcilik ve etki ölçümlemede temel aldığımız uluslararası politikalar."
                        headers={["Belge / Çerçeve", "Hukuki Statü", "Kurum", "Ülke / Birlik", "Sağlanan %"]}
                        data={socialEconomyData}
                    />

                    <div className="space-y-8 pt-12 border-t border-black/5">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Tam Uyumluluk Beyan Listesi.</h2>
                            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
                                hangel ekosisteminde %100 uyum sağlanan ve periyodik denetime tabi olan döküman ve beyanların tam listesi.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fullAuditList.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-green-50 rounded-xl text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-sm text-[#1d1d1f]">{item.label}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{item.std}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] tracking-widest">%{item.rate}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                </section>

                {/* Bottom Context */}
                <section className="container mx-auto px-6 max-w-4xl mt-32">
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
            </main>

            <PublicFooter currentPageLabel="Standartlar" />
        </div>
    );
}
