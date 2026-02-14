'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, 
    CheckCircle2, 
    Award,
    ChevronRight,
    Globe,
    ShieldCheck,
    Target
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const ComplianceTable = ({ title, description, data, headers }: { title: string, description?: string, data: any[], headers: string[] }) => (
    <div className="space-y-6 scroll-mt-24" id={title.toLowerCase().replace(/\s+/g, '-')}>
        <div className="space-y-1 px-1">
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

const regions = [
    {
        name: "Türkiye",
        flag: "🇹🇷",
        desc: "KVKK, 2860 Sayılı Yardım Toplama ve 5253 Sayılı Dernekler Kanunu standartlarıyla tam uyumluluk.",
        image: "https://images.unsplash.com/photo-1541432901012-a77cbd55a04e?q=80&w=2070&auto=format&fit=crop",
        hint: "istanbul landscape"
    },
    {
        name: "Avrupa Birliği",
        flag: "🇪🇺",
        desc: "GDPR veri koruma normları ve EAA (European Accessibility Act) teknik erişilebilirlik mevzuatlarına %100 uyum.",
        image: "https://images.unsplash.com/photo-1561574564-8a5f8b7a6fae?q=80&w=2070&auto=format&fit=crop",
        hint: "european parliament"
    },
    {
        name: "ABD",
        flag: "🇺🇸",
        desc: "IRS 501(c)(3) bağışçılık standartları, COPPA çocuk veri güvenliği ve ADA erişilebilirlik yasalarıyla uyumluluk.",
        image: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?q=80&w=2070&auto=format&fit=crop",
        hint: "washington dc"
    },
    {
        name: "Brezilya",
        flag: "🇧🇷",
        desc: "LGPD (Lei Geral de Proteção de Dados) kapsamında Latin Amerika veri güvenliği standartlarına tam adaptasyon.",
        image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=2070&auto=format&fit=crop",
        hint: "rio landscape"
    },
    {
        name: "Birleşik Krallık",
        flag: "🇬🇧",
        desc: "Equality Act 2010 ve WCAG 2.1 AA seviyesindeki Birleşik Krallık kamu dijital erişilebilirlik kriterlerine uyum.",
        image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop",
        hint: "london big ben"
    }
];

export default function StandardsPage() {
    const router = useRouter();

    const mainComplianceData = [
        { label: "Kullanıcı Sözleşmesi", std: "Tüketici Hukuku / Kurumsal kullanım şartları", org: "Ticaret Bakanlığı / hangel", region: "Türkiye / Küresel", rate: "%100 / %100" },
        { label: "Kullanıcı Sözleşmesi", std: "Consumer Protection", org: "FTC", region: "ABD", rate: "%90" },
        { label: "Kuruluş Sözleşmesi", std: "Social Enterprise Model / Kurumsal yapı", org: "OECD / hangel", region: "OECD / Türkiye", rate: "%95 / %100" },
        { label: "Gönüllülük Sözleşmesi", std: "ILO Çerçevesi", org: "ILO", region: "Küresel", rate: "%90" },
        { label: "Gönüllü Hakları Beyanı", std: "İnsan Hakları / Etik ve yasal çerçeve", org: "UN / hangel", region: "Küresel", rate: "%95 / %100" },
    ];

    const privacySecurityData = [
        { label: "Gizlilik Politikası", std: "ISO/IEC 27701 / KVKK / GDPR / CCPA / LGPD", org: "ISO / hangel", region: "Küresel / AB / ABD / Türkiye / Latin Amerika", rate: "%85 / %100" },
        { label: "KVKK Aydınlatma Metni", std: "KVKK", org: "KVKK / İçişleri Bakanlığı", region: "Türkiye", rate: "%100" },
        { label: "Açık Rıza Metni", std: "GDPR / KVKK uyumlu", org: "hangel", region: "AB / Türkiye", rate: "%100" },
        { label: "Veri Saklama & İmha", std: "ISO 27001", org: "ISO / hangel", region: "Küresel", rate: "%85 / %100" },
        { label: "DPO Tanımı", std: "GDPR Md.37", org: "AB", region: "AB / Türkiye", rate: "%80 / %100" },
        { label: "Veri İhlali Bildirimi", std: "ISO 27035", org: "AB Otoriteleri / hangel", region: "AB / Türkiye", rate: "%85 / %100" },
        { label: "Çerez Politikası", std: "ePrivacy / GDPR / KVKK", org: "AB Komisyonu / hangel", region: "AB / Türkiye", rate: "%100" },
        { label: "COPPA Uyumu", std: "COPPA", org: "FTC", region: "ABD", rate: "%75 / %100" },
        { label: "CCPA / CPRA", std: "California Law", org: "California AG", region: "ABD", rate: "%80 / %100" },
        { label: "LGPD Beyanı", std: "LGPD", org: "ANPD / hangel", region: "Brezilya / Latin Amerika", rate: "%75 / %100" },
        { label: "Ülke Bazlı Veri Uyumu", std: "Yerel Yasalar", org: "Ulusal Otoriteler", region: "Global / Türkiye / Latin Amerika / ABD", rate: "%70 / %100" },
        { label: "Yapay Zekâ Şeffaflığı", std: "OECD AI Principles", org: "OECD / hangel", region: "Küresel", rate: "%65 / %100" },
    ];

    const socialImpactFinancialData = [
        { label: "Sosyal Etki Politikası", std: "UN SDGs / SROI & ToC", org: "UN / hangel", region: "Küresel", rate: "%95 / %100" },
        { label: "Etki Ölçüm Metodu", std: "SROI / ToC", org: "Fon Sağlayıcılar / hangel", region: "Küresel", rate: "%80 / %100" },
        { label: "Açık Sosyal Girişim Beyanı", std: "Social Business / Sosyal Girişim İlkeleri", org: "Fon Sağlayıcılar / hangel", region: "Küresel", rate: "%100" },
        { label: "Bağış ve Yardım Politikası", std: "Charity Compliance / IRS / Ulusal mevzuat", org: "Kamu / hangel", region: "Ülke bazlı / ABD / Türkiye", rate: "%95 / %100" },
        { label: "Bağışçı Hakları Beyannamesi", std: "Donor Bill of Rights", org: "Vakıflar / hangel", region: "ABD / AB / Küresel", rate: "%90 / %100" },
        { label: "Bağış Denetimi", std: "Financial Audit", org: "Bağımsız Denetçiler / hangel", region: "Küresel", rate: "%85 / %100" },
        { label: "Finansal Şeffaflık", std: "IFRS / GAAP", org: "IFRS Foundation / hangel", region: "Küresel", rate: "%90 / %100" },
        { label: "Kâr Dağıtım Politikası", std: "Sosyal Şirket Modeli", org: "Yatırımcılar / hangel", region: "Küresel", rate: "%100" },
        { label: "IRS Uyumlu Bağış", std: "IRS 501(c)", org: "IRS / hangel", region: "ABD", rate: "%70 / %100" },
        { label: "Çevresel Sorumluluk", std: "ISO 14001 / ESG", org: "ISO / hangel", region: "Küresel", rate: "%75 / %100" },
        { label: "AML / CFT", std: "FATF / Finansal Uyum", org: "FATF / hangel", region: "Küresel", rate: "%80 / %100" },
        { label: "Etik Bağış Beyanı", std: "Anti-Corruption / Etik Finans", org: "Fonlar / hangel", region: "Küresel", rate: "%95 / %100" },
        { label: "Açık Veri Politikası", std: "Open Data Charter", org: "AB / OECD / hangel", region: "AB / OECD", rate: "%70 / %100" },
    ];

    const governanceEthicsData = [
        { label: "Etik İlkeler", std: "UN Global Compact", org: "UNGC / hangel", region: "Küresel", rate: "%95" },
        { label: "Çıkar Çatışması", std: "OECD Governance", org: "OECD", region: "OECD", rate: "%90" },
        { label: "Whistleblower Politikası", std: "ISO 37002", org: "ISO / hangel", region: "Küresel", rate: "%85 / %100" },
        { label: "Kurumsal Yönetişim", std: "G20 / OECD", org: "G20", region: "G20", rate: "%90" },
        { label: "İnsan Hakları Politikası", std: "UNGP", org: "United Nations", region: "Küresel", rate: "%95 / %100" },
        { label: "DEI Politikası", std: "ESG Framework", org: "ESG Fonları / hangel", region: "AB / ABD / Küresel", rate: "%85 / %100" },
        { label: "Risk & Kriz Yönetimi", std: "ISO 31000", org: "ISO / hangel", region: "Küresel", rate: "%80 / %100" },
        { label: "Yönetim ve Kurumsal Yönetişim İlkeleri", std: "Kurumsal Yönetim Standartları", org: "hangel", region: "Küresel", rate: "%100" },
        { label: "Kurumsal Risk ve Uyum Komitesi Beyanı", std: "Kurumsal Risk Yönetimi", org: "hangel", region: "Küresel", rate: "%100" },
    ];

    const accessibilityLawData = [
        { label: "Erişilebilirlik", std: "WCAG 2.2 / EN 301 549", org: "W3C / European Commission / TSE / hangel", region: "Küresel / AB / Türkiye / Uzak Doğu / Afrika / Latin Amerika / Güney Amerika", rate: "AA: %100 / AAA: %95" },
        { label: "Bilgilendirme Politikası", std: "Transparency Rules", org: "Regülatörler / hangel", region: "Küresel", rate: "%95 / %100" },
        { label: "Çok Dilli Erişim", std: "Inclusive Design", org: "Uluslararası Kullanıcılar / hangel", region: "Küresel", rate: "%80 / %100" },
        { label: "Yerel Bağış Uyumu", std: "Ulusal Mevzuat", org: "Kamu / hangel", region: "Ülke bazlı", rate: "%85 / %100" },
        { label: "Gelişim Yol Haritası Beyanı", std: "hangel beyanı", org: "hangel", region: "Küresel", rate: "%100" },
        { label: "ISO 22301 Uyum Beyanı", std: "İş Sürekliliği", org: "ISO / hangel", region: "Küresel", rate: "%100" },
        { label: "ISO / IEC 25010 / EN 301 549", std: "Dijital Platform Standartları", org: "ISO / European Commission / hangel", region: "AB / Küresel", rate: "%100" },
        { label: "Sızma ve Güvenlik Testleri", std: "Bilgi Güvenliği Testleri", org: "hangel", region: "Küresel", rate: "%100" },
        { label: "UX ve Kullanıcı Deneyimi Testleri", std: "Dijital Deneyim Standartları", org: "hangel", region: "Küresel", rate: "%100" },
        { label: "Felaket Kurtarma Beyanı", std: "İş Sürekliliği Testleri", org: "hangel", region: "Küresel", rate: "%100" },
        { label: "Üçüncü Taraf Gözetim Beyanı", std: "Kurumsal Uyum / Etik", org: "hangel", region: "Küresel", rate: "%100" },
    ];

    const fullAuditList = [
        { label: "Kullanıcı Sözleşmesi", std: "Kurumsal kullanım şartları", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Kuruluş Sözleşmesi", std: "Kurumsal yapı", org: "hangel", region: "Türkiye", rate: "100" },
        { label: "Gönüllülük Sözleşmesi", std: "Gönüllü hak ve sorumluluklar", org: "hangel", region: "Türkiye", rate: "100" },
        { label: "Gönüllü Hakları Beyanı", std: "Etik ve yasal çerçeve", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Gizlilik Politikası", std: "KVKK / GDPR / CCPA / LGPD", org: "hangel", region: "Küresel", rate: "100" },
        { label: "KVKK Aydınlatma Metni", std: "KVKK", org: "hangel", region: "Türkiye", rate: "100" },
        { label: "Açık Rıza Metni", std: "GDPR / KVKK uyumlu", org: "hangel", region: "Global", rate: "100" },
        { label: "Veri Saklama & İmha", std: "ISO 27001", org: "hangel", region: "Küresel", rate: "100" },
        { label: "GDPR Uyum Politikası", std: "GDPR", org: "hangel", region: "AB", rate: "100" },
        { label: "DPO Tanımı", std: "GDPR / KVKK", org: "hangel", region: "Global", rate: "100" },
        { label: "Veri İhlali Bildirimi", std: "GDPR / KVKK", org: "hangel", region: "Global", rate: "100" },
        { label: "Çerez Politikası", std: "GDPR / KVKK", org: "hangel", region: "Global", rate: "100" },
        { label: "Bilgi Güvenliği Politikası", std: "ISO 27001", org: "hangel", region: "Küresel", rate: "100" },
        { label: "COPPA Uyumu", std: "COPPA", org: "hangel", region: "ABD", rate: "100" },
        { label: "CCPA / CPRA", std: "CCPA / CPRA", org: "hangel", region: "ABD", rate: "100" },
        { label: "LGPD Beyanı", std: "LGPD", org: "hangel", region: "Brezilya", rate: "100" },
        { label: "Yapay Zekâ Şeffaflığı", std: "AI Şeffaflık İlkeleri", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Sosyal Etki Politikası", std: "SROI & Theory of Change", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Etki Ölçüm Metodu", std: "SROI & Theory of Change", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Açık Sosyal Girişim Beyanı", std: "Sosyal Girişim İlkeleri", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Bağış ve Yardım Politikası", std: "IRS / Ulusal mevzuat", org: "hangel", region: "Global", rate: "100" },
        { label: "Bağışçı Hakları Beyanı", std: "Bağış İlkeleri", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Finansal Şeffaflık", std: "IFRS / GAAP", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Kâr Dağıtım Politikası", std: "Sosyal Şirket Modeli", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Ücret Politikası", std: "Kurumsal Etik", org: "hangel", region: "Küresel", rate: "100" },
        { label: "AML / CFT Uyum Beyanı", std: "Finansal Uyum", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Etik Bağış Beyanı", std: "Etik Finans", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Açık Veri Politikası", std: "GRI", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Etik İlkeler", std: "Kurumsal Etik", org: "hangel", region: "Küresel", rate: "100" },
        { label: "İnsan Hakları Politikası", std: "UNGP", org: "hangel", region: "Küresel", rate: "100" },
        { label: "DEI Politikası", std: "DEI", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Risk & Kriz Yönetimi", std: "ISO 31000", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Erişilebilirlik Politikası", std: "WCAG / EN 301 549", org: "hangel", region: "Küresel", rate: "100" },
        { label: "ISO 22301 Uyum Beyanı", std: "İş Sürekliliği", org: "ISO", region: "Küresel", rate: "100" },
        { label: "ISO 27001 Uyum Beyanı", std: "Bilgi Güvenliği", org: "ISO", region: "Küresel", rate: "100" },
        { label: "Sızma Testleri Beyanı", std: "Güvenlik Testleri", org: "hangel", region: "Küresel", rate: "100" },
        { label: "UX Testleri Beyanı", std: "Deneyim Testleri", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Felaket Kurtarma Beyanı", std: "İş Sürekliliği", org: "hangel", region: "Küresel", rate: "100" },
        { label: "Uyum Komitesi Beyanı", std: "Kurumsal Risk", org: "hangel", region: "Küresel", rate: "100" },
    ];

    const tableHeaders = ["Belge", "Standart / Çerçeve", "Talep Eden Kurum", "Ülke / Birlik", "Sağlanan %"];

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans selection:bg-primary/30">
            {/* Navigation */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <span className="text-[10px] font-black tracking-tight uppercase hidden sm:inline">Kalite & Sertifikasyon Standartları</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Link href="/settings/contracts">Beyanları Oku</Link>
                    </Button>
                </div>
            </header>

            <main className="pt-24 pb-32">
                {/* Hero Section */}
                <section className="container mx-auto px-6 max-w-5xl text-center py-16 md:py-24 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-4 animate-in fade-in zoom-in duration-700">
                        <Award className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Global Güven Standartları</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-[#1d1d1f] leading-[0.95] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        Standartlarına Uyum sağladığımız <br className="hidden md:block" /> Sertifikasyon Kurumları.
                    </h1>
                    <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed opacity-80">
                        hangel, teknoloji ve sosyal fayda arasındaki köprüyü uluslararası otoritelerin belirlediği en sıkı standartlarla inşaa eder. Güvenimiz, uyum sağladığımız bu ilkelerden gelir.
                    </p>
                </section>

                {/* Regions Section - Flag Integrated Design */}
                <section className="container mx-auto px-4 max-w-7xl mb-32">
                    <div className="text-center mb-12 space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Küresel Uyum Ağımız</h2>
                        <p className="text-muted-foreground font-medium">Faaliyet gösterdiğimiz bölgelerdeki en sıkı yasal ve etik normları uyguluyoruz.</p>
                    </div>
                    <Carousel opts={{ align: "start" }} className="w-full">
                        <CarouselContent className="-ml-6">
                            {regions.map((region) => (
                                <CarouselItem key={region.name} className="md:basis-1/2 lg:basis-1/3 pl-6">
                                    <div className="rounded-[2.5rem] bg-white border border-black/5 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 h-[500px] flex flex-col group">
                                        <div className="relative aspect-video overflow-hidden">
                                            <Image src={region.image} alt={region.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" data-ai-hint={region.hint} />
                                            {/* Flag Panel Integration */}
                                            <div className="absolute inset-0 bg-black/5" />
                                            <div className="absolute top-6 left-6 w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-xl border border-white/30 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                                {region.flag}
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                        </div>
                                        <div className="p-8 flex flex-col flex-1 justify-between">
                                            <div className="space-y-3">
                                                <h3 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">{region.name}</h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{region.desc}</p>
                                            </div>
                                            <div className="pt-4">
                                                <span className="text-primary font-bold flex items-center text-sm group-hover:gap-2 transition-all">
                                                    Standartları İncele <ChevronRight className="h-4 w-4 ml-1" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="hidden xl:flex justify-end gap-2 mt-8 px-6">
                            <CarouselPrevious className="static translate-y-0 h-12 w-12 border-black/10" />
                            <CarouselNext className="static translate-y-0 h-12 w-12 border-black/10" />
                        </div>
                    </Carousel>
                </section>

                {/* Compliance Sections */}
                <section className="container mx-auto px-6 max-w-6xl space-y-32">
                    
                    <ComplianceTable 
                        title="A. ANA SÖZLEŞMELER"
                        description="Kullanıcı ve kuruluş sözleşmelerimizin bölgesel tüketici ve sivil toplum yasalarıyla uyumu."
                        headers={tableHeaders}
                        data={mainComplianceData}
                    />

                    <ComplianceTable 
                        title="B. GİZLİLİK, VERİ KORUMA VE GÜVENLİK"
                        description="Veri mahremiyeti ve siber güvenlik alanındaki uluslararası sertifikasyonlar ve yerel kanunlar."
                        headers={tableHeaders}
                        data={privacySecurityData}
                    />

                    <ComplianceTable 
                        title="C. SOSYAL ETKİ, BAĞIŞ VE FİNANSAL ŞEFFAFLIK"
                        description="Bağışçılık, sosyal etki ölçümleme ve finansal raporlama standartlarımız."
                        headers={tableHeaders}
                        data={socialImpactFinancialData}
                    />

                    <ComplianceTable 
                        title="D. KURUMSAL YÖNETİŞİM, ETİK VE DENETİM"
                        description="Şirket ve dernek yönetişimi, etik ilkeler ve risk yönetimi çerçeveleri."
                        headers={tableHeaders}
                        data={governanceEthicsData}
                    />

                    <ComplianceTable 
                        title="E. ERİŞİLEBİLİRLİK VE DİĞER POLİTİKALAR"
                        description="Küresel erişilebilirlik mevzuat uyumu ve teknik operasyonel standartlar."
                        headers={tableHeaders}
                        data={accessibilityLawData}
                    />

                    <div className="space-y-12 pt-12 border-t border-black/10">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Tam Uyumluluk Beyan Listesi.</h2>
                            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-tight">
                                hangel ekosisteminde %100 uyum sağlanan ve periyodik denetime tabi olan döküman ve beyanların tam listesi.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {fullAuditList.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-xl transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-green-50 rounded-xl text-green-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-0.5 min-w-0">
                                            <p className="font-bold text-sm text-[#1d1d1f] truncate">{item.label}</p>
                                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest truncate">{item.std}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] tracking-widest shrink-0">%{item.rate}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                </section>

                {/* Bottom Context - Final Shield */}
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
                            <Button asChild size="lg" className="rounded-full px-10 h-14 font-bold bg-white text-black hover:bg-white/90 w-full sm:w-auto transition-all active:scale-95">
                                <Link href="/ngo-admin/transparency">Şeffaflık Raporu</Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="rounded-full px-10 h-14 font-bold text-white hover:bg-white/10 w-full sm:w-auto transition-all active:scale-95">
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
